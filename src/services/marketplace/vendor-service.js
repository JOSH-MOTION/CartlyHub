import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  Timestamp,
} from '../../lib/firestore-server';
import {
  AUDIENCES,
  COLLECTIONS,
  NOTIFICATION_TYPES,
  SELLING_MODES,
} from './constants';
import { createNotification } from './notification-service';
import { validateSellingPreferences } from './selling-preferences';

export const getVendor = async (vendorId) => {
  const snap = await getDoc(doc(db, COLLECTIONS.SELLERS, vendorId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const listVendors = async () => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.SELLERS));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      ...data,
      sellingMode: data.sellingMode || SELLING_MODES.WHATSAPP,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
    };
  });
};

export const updateSellingPreferences = async (vendorId, preferences) => {
  const clean = validateSellingPreferences(preferences);

  await updateDoc(doc(db, COLLECTIONS.SELLERS, vendorId), {
    ...clean,
    updatedAt: Timestamp.now(),
  });

  return clean;
};

/** Suspended vendors keep their data but drop out of checkout entirely. */
export const setVendorSuspended = async (vendorId, suspended, { adminId, reason } = {}) => {
  const vendor = await getVendor(vendorId);
  if (!vendor) throw new Error('Vendor not found');

  await updateDoc(doc(db, COLLECTIONS.SELLERS, vendorId), {
    isSuspended: Boolean(suspended),
    suspendedAt: suspended ? Timestamp.now() : null,
    suspendedBy: suspended ? adminId || null : null,
    suspensionReason: suspended ? reason || null : null,
    updatedAt: Timestamp.now(),
  });

  await createNotification({
    userId: vendorId,
    audience: AUDIENCES.VENDOR,
    type: suspended
      ? NOTIFICATION_TYPES.VENDOR_SUSPENDED
      : NOTIFICATION_TYPES.VENDOR_REINSTATED,
    title: suspended ? 'Your store has been suspended' : 'Your store is active again',
    message: suspended
      ? `New orders are paused.${reason ? ` Reason: ${reason}` : ''} Contact Cartly Hub support to resolve this.`
      : 'Customers can order from your store again.',
    data: { vendorId },
    ctaLabel: 'Open dashboard',
    ctaHref: '/seller',
  });

  return { ...vendor, isSuspended: Boolean(suspended) };
};
