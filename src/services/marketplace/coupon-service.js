import {
  db,
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  Timestamp,
} from '../../lib/firestore-server';
import { round2 } from '../payments/money';

/**
 * Seller-scoped discount codes.
 *
 * Each coupon belongs to one seller and only discounts that seller's items —
 * a coupon is funded by the seller who creates it, not by Cartly Hub, so
 * `validateCoupon` is always called with the specific vendor group's own
 * subtotal, never the whole cart.
 */

const COUPONS = 'coupons';

export const COUPON_TYPES = { PERCENT: 'PERCENT', FIXED: 'FIXED' };

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

const hydrate = (id, data) => ({
  id,
  ...data,
  expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : null,
  createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
});

export const createCoupon = async ({
  sellerId,
  code,
  type,
  value,
  minOrderAmount,
  maxUses,
  expiresAt,
}) => {
  const normalized = normalizeCode(code);
  if (!normalized) throw new Error('A coupon code is required');
  if (!Object.values(COUPON_TYPES).includes(type)) throw new Error('Invalid coupon type');

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error('Coupon value must be greater than zero');
  }
  if (type === COUPON_TYPES.PERCENT && numericValue > 100) {
    throw new Error('A percentage coupon cannot exceed 100%');
  }

  const existing = await getDocs(
    query(collection(db, COUPONS), where('sellerId', '==', sellerId), where('code', '==', normalized)),
  );
  if (!existing.empty) throw new Error(`You already have a coupon with the code ${normalized}`);

  const ref = await addDoc(collection(db, COUPONS), {
    sellerId,
    code: normalized,
    type,
    value: numericValue,
    minOrderAmount: Number(minOrderAmount) || 0,
    maxUses: maxUses ? Number(maxUses) : null,
    usedCount: 0,
    isActive: true,
    expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
    createdAt: Timestamp.now(),
  });

  return { id: ref.id };
};

export const listSellerCoupons = async (sellerId) => {
  if (!sellerId) return [];
  const snap = await getDocs(query(collection(db, COUPONS), where('sellerId', '==', sellerId)));
  return snap.docs
    .map((entry) => hydrate(entry.id, entry.data()))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

export const setCouponActive = async (sellerId, couponId, isActive) => {
  const ref = doc(db, COUPONS, couponId);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().sellerId !== sellerId) {
    throw new Error('Coupon not found');
  }
  await updateDoc(ref, { isActive: Boolean(isActive) });
};

export const deleteCoupon = async (sellerId, couponId) => {
  const ref = doc(db, COUPONS, couponId);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().sellerId !== sellerId) {
    throw new Error('Coupon not found');
  }
  await deleteDoc(ref);
};

/**
 * Server-authoritative check — a discount amount is never trusted from the
 * client, only recomputed here from the coupon's real rules and the vendor
 * group's real subtotal.
 */
export const validateCoupon = async ({ code, sellerId, subtotal }) => {
  const normalized = normalizeCode(code);
  if (!normalized) return { valid: false, reason: 'Enter a coupon code' };

  const snap = await getDocs(
    query(collection(db, COUPONS), where('sellerId', '==', sellerId), where('code', '==', normalized)),
  );
  if (snap.empty) return { valid: false, reason: 'That code is not valid for this store' };

  const coupon = hydrate(snap.docs[0].id, snap.docs[0].data());

  if (!coupon.isActive) return { valid: false, reason: 'This code is no longer active' };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, reason: 'This code has expired' };
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, reason: 'This code has reached its usage limit' };
  }
  if (subtotal < (coupon.minOrderAmount || 0)) {
    return {
      valid: false,
      reason: `This code needs an order of at least ${coupon.minOrderAmount} from this store`,
    };
  }

  const discountAmount =
    coupon.type === COUPON_TYPES.PERCENT
      ? round2(subtotal * (coupon.value / 100))
      : round2(Math.min(coupon.value, subtotal));

  return { valid: true, coupon, discountAmount };
};

export const incrementCouponUsage = async (couponId) => {
  if (!couponId) return;
  const ref = doc(db, COUPONS, couponId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, { usedCount: (Number(snap.data().usedCount) || 0) + 1 });
};
