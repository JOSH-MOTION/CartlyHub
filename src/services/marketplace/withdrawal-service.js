import {
  db,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  query,
  updateDoc,
  where,
  Timestamp,
} from '../../lib/firestore-server';
import {
  AUDIENCES,
  COLLECTIONS,
  DEFAULT_CURRENCY,
  NOTIFICATION_TYPES,
  WITHDRAWAL_METHODS,
  WITHDRAWAL_STATUS,
} from './constants';
import { getMarketplaceSettings } from './settings-service';
import {
  getWallet,
  holdForWithdrawal,
  releaseWithdrawalHold,
  settleWithdrawal,
} from './wallet-service';
import { createNotification } from './notification-service';
import { formatCurrency, round2 } from '../payments/money';

/**
 * Withdrawals.
 *
 * A request immediately moves money from available to pending so a vendor
 * cannot request the same funds twice. The platform then reviews the queue and
 * marks it paid or rejects it — `autoProcessWithdrawals` in marketplace
 * settings is the hook for automating this later.
 */

const methodFor = (value) =>
  WITHDRAWAL_METHODS.find((method) => method.value === value) || null;

const validateDestination = (method, destination = {}) => {
  const accountName = String(destination.accountName || '').trim();
  const accountNumber = String(destination.accountNumber || '').trim();

  if (!accountName) throw new Error('Account name is required');
  if (!accountNumber) throw new Error('Account number is required');

  if (method.kind === 'mobile_money') {
    if (!/^\+?\d[\d\s-]{7,}$/.test(accountNumber)) {
      throw new Error('Enter a valid mobile money number');
    }
    return { accountName, accountNumber, bankName: null, branch: null };
  }

  const bankName = String(destination.bankName || '').trim();
  if (!bankName) throw new Error('Bank name is required');

  return {
    accountName,
    accountNumber,
    bankName,
    branch: String(destination.branch || '').trim() || null,
  };
};

const hydrate = (id, data) => ({
  id,
  ...data,
  requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : new Date(),
  reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate() : null,
  paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : null,
});

export const requestWithdrawal = async ({
  vendorId,
  vendorStoreName,
  amount,
  method: methodValue,
  destination,
}) => {
  const method = methodFor(methodValue);
  if (!method) throw new Error('Choose a valid withdrawal method');

  const settings = await getMarketplaceSettings();
  const requested = round2(amount);

  if (!Number.isFinite(requested) || requested <= 0) {
    throw new Error('Enter a withdrawal amount');
  }
  if (requested < settings.minWithdrawalAmount) {
    throw new Error(
      `Minimum withdrawal is ${formatCurrency(settings.minWithdrawalAmount, settings.currency)}`,
    );
  }

  const wallet = await getWallet(vendorId);
  if (Number(wallet.availableBalance || 0) < requested) {
    throw new Error('You do not have enough available balance');
  }

  const cleanDestination = validateDestination(method, destination);

  const payload = {
    vendorId,
    vendorStoreName: vendorStoreName || null,
    amount: requested,
    currency: wallet.currency || settings.currency || DEFAULT_CURRENCY,
    method: method.value,
    methodLabel: method.label,
    methodKind: method.kind,
    destination: cleanDestination,
    status: WITHDRAWAL_STATUS.PENDING,
    reviewedBy: null,
    reviewedAt: null,
    adminNote: null,
    payoutReference: null,
    requestedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const ref = await addDoc(collection(db, COLLECTIONS.WITHDRAWALS), payload);

  // Hold the funds only after the request exists, so a failed hold cannot
  // leave money stranded with nothing to point at.
  try {
    await holdForWithdrawal({
      vendorId,
      withdrawalId: ref.id,
      amount: requested,
      currency: payload.currency,
      description: `Withdrawal request to ${method.label}`,
    });
  } catch (error) {
    await updateDoc(ref, {
      status: WITHDRAWAL_STATUS.REJECTED,
      adminNote: 'Automatically cancelled — funds could not be held',
      updatedAt: Timestamp.now(),
    });
    throw error;
  }

  await createNotification({
    userId: vendorId,
    audience: AUDIENCES.VENDOR,
    type: NOTIFICATION_TYPES.WITHDRAWAL_REQUESTED,
    title: 'Withdrawal requested',
    message: `${formatCurrency(requested, payload.currency)} to ${method.label} is under review.`,
    data: { withdrawalId: ref.id, amount: requested },
    ctaLabel: 'View withdrawals',
    ctaHref: '/seller/withdrawals',
  });

  return hydrate(ref.id, payload);
};

export const getWithdrawal = async (withdrawalId) => {
  const snap = await getDoc(doc(db, COLLECTIONS.WITHDRAWALS, withdrawalId));
  return snap.exists() ? hydrate(snap.id, snap.data()) : null;
};

export const listVendorWithdrawals = async (vendorId, { limit = 100 } = {}) => {
  if (!vendorId) return [];
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.WITHDRAWALS),
      where('vendorId', '==', vendorId),
      fsLimit(200),
    ),
  );
  return snapshot.docs
    .map((entry) => hydrate(entry.id, entry.data()))
    .sort((a, b) => b.requestedAt - a.requestedAt)
    .slice(0, limit);
};

export const listAllWithdrawals = async ({ status } = {}) => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.WITHDRAWALS));
  return snapshot.docs
    .map((entry) => hydrate(entry.id, entry.data()))
    .filter((withdrawal) => (status ? withdrawal.status === status : true))
    .sort((a, b) => b.requestedAt - a.requestedAt);
};

export const approveWithdrawal = async (withdrawalId, { adminId, note } = {}) => {
  const withdrawal = await getWithdrawal(withdrawalId);
  if (!withdrawal) throw new Error('Withdrawal not found');
  if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
    throw new Error(`This withdrawal is already ${withdrawal.status}`);
  }

  await updateDoc(doc(db, COLLECTIONS.WITHDRAWALS, withdrawalId), {
    status: WITHDRAWAL_STATUS.APPROVED,
    reviewedBy: adminId || null,
    reviewedAt: Timestamp.now(),
    adminNote: note || null,
    updatedAt: Timestamp.now(),
  });

  await createNotification({
    userId: withdrawal.vendorId,
    audience: AUDIENCES.VENDOR,
    type: NOTIFICATION_TYPES.WITHDRAWAL_APPROVED,
    title: 'Withdrawal approved',
    message: `${formatCurrency(withdrawal.amount, withdrawal.currency)} to ${withdrawal.methodLabel} was approved and is being paid out.`,
    data: { withdrawalId, amount: withdrawal.amount },
    ctaLabel: 'View withdrawals',
    ctaHref: '/seller/withdrawals',
  });

  return { ...withdrawal, status: WITHDRAWAL_STATUS.APPROVED };
};

/** Money actually left the platform: clears the hold and books the payout. */
export const markWithdrawalPaid = async (withdrawalId, { adminId, payoutReference } = {}) => {
  const withdrawal = await getWithdrawal(withdrawalId);
  if (!withdrawal) throw new Error('Withdrawal not found');
  if (withdrawal.status === WITHDRAWAL_STATUS.PAID) return withdrawal;
  if (withdrawal.status === WITHDRAWAL_STATUS.REJECTED) {
    throw new Error('A rejected withdrawal cannot be marked paid');
  }

  await settleWithdrawal({
    vendorId: withdrawal.vendorId,
    withdrawalId,
    amount: withdrawal.amount,
    currency: withdrawal.currency,
    reference: payoutReference || null,
  });

  await updateDoc(doc(db, COLLECTIONS.WITHDRAWALS, withdrawalId), {
    status: WITHDRAWAL_STATUS.PAID,
    payoutReference: payoutReference || null,
    paidAt: Timestamp.now(),
    reviewedBy: adminId || withdrawal.reviewedBy || null,
    updatedAt: Timestamp.now(),
  });

  await createNotification({
    userId: withdrawal.vendorId,
    audience: AUDIENCES.VENDOR,
    type: NOTIFICATION_TYPES.WITHDRAWAL_PAID,
    title: 'Withdrawal paid',
    message: `${formatCurrency(withdrawal.amount, withdrawal.currency)} has been sent to ${withdrawal.destination?.accountNumber} (${withdrawal.methodLabel}).`,
    data: { withdrawalId, amount: withdrawal.amount },
    ctaLabel: 'View withdrawals',
    ctaHref: '/seller/withdrawals',
  });

  return { ...withdrawal, status: WITHDRAWAL_STATUS.PAID };
};

export const rejectWithdrawal = async (withdrawalId, { adminId, note } = {}) => {
  const withdrawal = await getWithdrawal(withdrawalId);
  if (!withdrawal) throw new Error('Withdrawal not found');
  if (withdrawal.status === WITHDRAWAL_STATUS.PAID) {
    throw new Error('A paid withdrawal cannot be rejected');
  }
  if (withdrawal.status === WITHDRAWAL_STATUS.REJECTED) return withdrawal;

  await releaseWithdrawalHold({
    vendorId: withdrawal.vendorId,
    withdrawalId,
    amount: withdrawal.amount,
    currency: withdrawal.currency,
    reason: note || 'Withdrawal request rejected',
  });

  await updateDoc(doc(db, COLLECTIONS.WITHDRAWALS, withdrawalId), {
    status: WITHDRAWAL_STATUS.REJECTED,
    reviewedBy: adminId || null,
    reviewedAt: Timestamp.now(),
    adminNote: note || null,
    updatedAt: Timestamp.now(),
  });

  await createNotification({
    userId: withdrawal.vendorId,
    audience: AUDIENCES.VENDOR,
    type: NOTIFICATION_TYPES.WITHDRAWAL_REJECTED,
    title: 'Withdrawal rejected',
    message:
      `${formatCurrency(withdrawal.amount, withdrawal.currency)} was returned to your available balance.` +
      (note ? ` Reason: ${note}` : ''),
    data: { withdrawalId, amount: withdrawal.amount },
    ctaLabel: 'View withdrawals',
    ctaHref: '/seller/withdrawals',
  });

  return { ...withdrawal, status: WITHDRAWAL_STATUS.REJECTED };
};
