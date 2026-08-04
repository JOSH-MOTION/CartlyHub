import { db, doc, getDoc, setDoc, Timestamp } from '../../lib/firestore-server';
import { COLLECTIONS, DEFAULT_CURRENCY } from './constants';
import { DEFAULT_PROVIDER_ID } from '../payments';

const SETTINGS_DOC = 'marketplace';

export const DEFAULT_MARKETPLACE_SETTINGS = {
  /** Percentage Cartly Hub keeps from every online order. */
  commissionPercent: 5,
  currency: DEFAULT_CURRENCY,
  /** Vendors cannot request less than this. */
  minWithdrawalAmount: 50,
  /** Used to show customers an estimated delivery window. */
  estimatedDeliveryDays: 3,
  /** Which gateway new payments are routed to. */
  activePaymentProvider: DEFAULT_PROVIDER_ID,
  /** Set true once payouts are automated; the queue is manual for now. */
  autoProcessWithdrawals: false,
};

/** Reads marketplace settings, falling back to defaults for missing keys. */
export const getMarketplaceSettings = async () => {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOC));
    if (!snap.exists()) return { ...DEFAULT_MARKETPLACE_SETTINGS };
    return { ...DEFAULT_MARKETPLACE_SETTINGS, ...snap.data() };
  } catch (error) {
    console.error('Failed to read marketplace settings, using defaults:', error);
    return { ...DEFAULT_MARKETPLACE_SETTINGS };
  }
};

export const updateMarketplaceSettings = async (updates, updatedBy) => {
  const clean = {};

  if (updates.commissionPercent !== undefined) {
    const value = Number(updates.commissionPercent);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error('Commission must be a number between 0 and 100');
    }
    clean.commissionPercent = value;
  }

  if (updates.minWithdrawalAmount !== undefined) {
    const value = Number(updates.minWithdrawalAmount);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Minimum withdrawal must be zero or more');
    }
    clean.minWithdrawalAmount = value;
  }

  if (updates.estimatedDeliveryDays !== undefined) {
    const value = Number(updates.estimatedDeliveryDays);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Estimated delivery days must be zero or more');
    }
    clean.estimatedDeliveryDays = value;
  }

  if (updates.activePaymentProvider !== undefined) {
    clean.activePaymentProvider = String(updates.activePaymentProvider);
  }

  if (updates.autoProcessWithdrawals !== undefined) {
    clean.autoProcessWithdrawals = Boolean(updates.autoProcessWithdrawals);
  }

  await setDoc(
    doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOC),
    { ...clean, updatedAt: Timestamp.now(), updatedBy: updatedBy || null },
    { merge: true },
  );

  return getMarketplaceSettings();
};
