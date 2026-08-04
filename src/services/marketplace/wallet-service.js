import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  query,
  runTransaction,
  where,
  Timestamp,
} from '../../lib/firestore-server';
import {
  COLLECTIONS,
  DEFAULT_CURRENCY,
  WALLET_TRANSACTION_TYPES,
} from './constants';
import { fromMinor, toMinor } from '../payments/money';

/**
 * Vendor wallet.
 *
 * Balances are held as major units in the document but every mutation is done
 * in minor units inside a Firestore transaction, so concurrent orders and
 * withdrawals cannot race each other into a wrong balance.
 *
 *   availableBalance  money the vendor can withdraw right now
 *   pendingBalance    money held against a withdrawal request under review
 *   totalEarnings     lifetime credits from paid orders
 *   totalWithdrawals  lifetime money actually paid out
 */

const emptyWallet = (vendorId, currency = DEFAULT_CURRENCY) => ({
  vendorId,
  currency,
  availableBalance: 0,
  pendingBalance: 0,
  totalEarnings: 0,
  totalWithdrawals: 0,
});

const walletRef = (vendorId) => doc(db, COLLECTIONS.WALLETS, vendorId);

/** Reads a wallet, returning a zeroed wallet if the vendor has never earned. */
export const getWallet = async (vendorId) => {
  if (!vendorId) return null;
  const snap = await getDoc(walletRef(vendorId));
  if (!snap.exists()) return emptyWallet(vendorId);

  const data = snap.data();
  return {
    ...emptyWallet(vendorId, data.currency),
    ...data,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null,
  };
};

const readWalletInTransaction = async (transaction, vendorId, currency) => {
  const ref = walletRef(vendorId);
  const snap = await transaction.get(ref);
  const current = snap.exists()
    ? { ...emptyWallet(vendorId, currency), ...snap.data() }
    : emptyWallet(vendorId, currency);

  return {
    ref,
    exists: snap.exists(),
    minor: {
      available: toMinor(current.availableBalance),
      pending: toMinor(current.pendingBalance),
      earnings: toMinor(current.totalEarnings),
      withdrawals: toMinor(current.totalWithdrawals),
    },
    currency: current.currency || currency || DEFAULT_CURRENCY,
  };
};

const writeWallet = (transaction, wallet, minor) => {
  const payload = {
    vendorId: wallet.ref.id,
    currency: wallet.currency,
    availableBalance: fromMinor(minor.available),
    pendingBalance: fromMinor(minor.pending),
    totalEarnings: fromMinor(minor.earnings),
    totalWithdrawals: fromMinor(minor.withdrawals),
    updatedAt: Timestamp.now(),
  };

  if (wallet.exists) {
    transaction.update(wallet.ref, payload);
  } else {
    transaction.set(wallet.ref, { ...payload, createdAt: Timestamp.now() });
  }

  return payload;
};

const ledgerEntry = (transaction, entry) => {
  const ref = doc(collection(db, COLLECTIONS.WALLET_TRANSACTIONS));
  transaction.set(ref, { ...entry, createdAt: Timestamp.now() });
  return ref.id;
};

/**
 * Credits a vendor's available balance after a paid order.
 * Idempotent: a second call with the same orderId is a no-op.
 */
export const creditOrderEarnings = async ({
  vendorId,
  orderId,
  orderNumber,
  amount,
  commissionAmount,
  grossAmount,
  currency = DEFAULT_CURRENCY,
}) => {
  if (!vendorId) throw new Error('vendorId is required to credit a wallet');

  // Cheap pre-check outside the transaction; the write below is still guarded
  // by the order document's own paid/credited flags in order-service.
  const existing = await getDocs(
    query(
      collection(db, COLLECTIONS.WALLET_TRANSACTIONS),
      where('orderId', '==', orderId),
      where('type', '==', WALLET_TRANSACTION_TYPES.EARNING),
      fsLimit(1),
    ),
  );
  if (!existing.empty) {
    return { alreadyCredited: true, wallet: await getWallet(vendorId) };
  }

  const creditMinor = toMinor(amount);

  const wallet = await runTransaction(db, async (transaction) => {
    const current = await readWalletInTransaction(transaction, vendorId, currency);

    const next = {
      ...current.minor,
      available: current.minor.available + creditMinor,
      earnings: current.minor.earnings + creditMinor,
    };

    const payload = writeWallet(transaction, current, next);

    ledgerEntry(transaction, {
      vendorId,
      type: WALLET_TRANSACTION_TYPES.EARNING,
      direction: 'credit',
      amount: fromMinor(creditMinor),
      grossAmount: Number(grossAmount || amount) || 0,
      commissionAmount: Number(commissionAmount || 0),
      currency: current.currency,
      balanceAfter: payload.availableBalance,
      orderId: orderId || null,
      orderNumber: orderNumber || null,
      status: 'completed',
      description: `Earnings from order ${orderNumber || orderId}`,
    });

    return payload;
  });

  return { alreadyCredited: false, wallet };
};

/**
 * Moves money from available to pending when a withdrawal is requested.
 * Rejects if the vendor does not have the funds.
 */
export const holdForWithdrawal = async ({
  vendorId,
  withdrawalId,
  amount,
  currency = DEFAULT_CURRENCY,
  description,
}) => {
  const holdMinor = toMinor(amount);
  if (holdMinor <= 0) throw new Error('Withdrawal amount must be greater than zero');

  return runTransaction(db, async (transaction) => {
    const current = await readWalletInTransaction(transaction, vendorId, currency);

    if (current.minor.available < holdMinor) {
      throw new Error('Insufficient available balance for this withdrawal');
    }

    const next = {
      ...current.minor,
      available: current.minor.available - holdMinor,
      pending: current.minor.pending + holdMinor,
    };

    const payload = writeWallet(transaction, current, next);

    ledgerEntry(transaction, {
      vendorId,
      type: WALLET_TRANSACTION_TYPES.WITHDRAWAL_HOLD,
      direction: 'debit',
      amount: fromMinor(holdMinor),
      currency: current.currency,
      balanceAfter: payload.availableBalance,
      withdrawalId: withdrawalId || null,
      status: 'pending',
      description: description || 'Withdrawal request placed on hold',
    });

    return payload;
  });
};

/** Settles a withdrawal that has actually been paid out. */
export const settleWithdrawal = async ({
  vendorId,
  withdrawalId,
  amount,
  currency = DEFAULT_CURRENCY,
  reference,
}) => {
  const settleMinor = toMinor(amount);

  return runTransaction(db, async (transaction) => {
    const current = await readWalletInTransaction(transaction, vendorId, currency);

    if (current.minor.pending < settleMinor) {
      throw new Error('Withdrawal amount is no longer held on this wallet');
    }

    const next = {
      ...current.minor,
      pending: current.minor.pending - settleMinor,
      withdrawals: current.minor.withdrawals + settleMinor,
    };

    const payload = writeWallet(transaction, current, next);

    ledgerEntry(transaction, {
      vendorId,
      type: WALLET_TRANSACTION_TYPES.WITHDRAWAL_PAID,
      direction: 'debit',
      amount: fromMinor(settleMinor),
      currency: current.currency,
      balanceAfter: payload.availableBalance,
      withdrawalId: withdrawalId || null,
      reference: reference || null,
      status: 'completed',
      description: 'Withdrawal paid out',
    });

    return payload;
  });
};

/** Returns held money to available when a withdrawal is rejected/cancelled. */
export const releaseWithdrawalHold = async ({
  vendorId,
  withdrawalId,
  amount,
  currency = DEFAULT_CURRENCY,
  reason,
}) => {
  const releaseMinor = toMinor(amount);

  return runTransaction(db, async (transaction) => {
    const current = await readWalletInTransaction(transaction, vendorId, currency);

    const heldMinor = Math.min(current.minor.pending, releaseMinor);

    const next = {
      ...current.minor,
      pending: current.minor.pending - heldMinor,
      available: current.minor.available + heldMinor,
    };

    const payload = writeWallet(transaction, current, next);

    ledgerEntry(transaction, {
      vendorId,
      type: WALLET_TRANSACTION_TYPES.WITHDRAWAL_REVERSAL,
      direction: 'credit',
      amount: fromMinor(heldMinor),
      currency: current.currency,
      balanceAfter: payload.availableBalance,
      withdrawalId: withdrawalId || null,
      status: 'completed',
      description: reason || 'Withdrawal request returned to available balance',
    });

    return payload;
  });
};

/** Manual admin credit/debit, used for refunds and corrections. */
export const adjustWallet = async ({
  vendorId,
  amount,
  direction = 'credit',
  currency = DEFAULT_CURRENCY,
  description,
  actorId,
}) => {
  const deltaMinor = toMinor(Math.abs(amount));

  return runTransaction(db, async (transaction) => {
    const current = await readWalletInTransaction(transaction, vendorId, currency);

    if (direction === 'debit' && current.minor.available < deltaMinor) {
      throw new Error('Insufficient available balance for this adjustment');
    }

    const next = {
      ...current.minor,
      available:
        direction === 'debit'
          ? current.minor.available - deltaMinor
          : current.minor.available + deltaMinor,
    };

    const payload = writeWallet(transaction, current, next);

    ledgerEntry(transaction, {
      vendorId,
      type: WALLET_TRANSACTION_TYPES.ADJUSTMENT,
      direction,
      amount: fromMinor(deltaMinor),
      currency: current.currency,
      balanceAfter: payload.availableBalance,
      actorId: actorId || null,
      status: 'completed',
      description: description || 'Manual wallet adjustment',
    });

    return payload;
  });
};

export const listWalletTransactions = async (vendorId, { limit = 100 } = {}) => {
  if (!vendorId) return [];

  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.WALLET_TRANSACTIONS),
      where('vendorId', '==', vendorId),
      fsLimit(300),
    ),
  );

  return snapshot.docs
    .map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
};

/** Every wallet on the platform — used by the admin dashboard. */
export const listAllWallets = async () => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.WALLETS));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      ...emptyWallet(entry.id, data.currency),
      ...data,
      vendorId: entry.id,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null,
    };
  });
};

/** Used by the ledger writer above and re-exported for tests. */
export const __internals = { emptyWallet };
