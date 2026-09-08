import { db, collection, doc, addDoc, deleteDoc, getDoc, getDocs, query, where, Timestamp } from '../../lib/firestore-server';
import cloudinary from '../../lib/cloudinary';

/**
 * Ephemeral seller "statuses" — a quick photo + caption, live on the
 * homepage for 24 hours, then gone. Built for drop-shippers and anyone
 * flash-posting a find without committing to a full permanent listing.
 *
 * Storage is deliberately bounded: a status is archived (not just deleted)
 * when it expires, so a dispute has *something* to check against, but that
 * archive is itself purged after 30 days — nothing here grows forever.
 */

const STATUSES = 'sellerStatuses';
const ARCHIVE = 'statusArchive';
const ACTIVE_HOURS = 24;
const ARCHIVE_DAYS = 30;
const MAX_ACTIVE_PER_SELLER = 5;

const hydrate = (entry) => {
  const data = entry.data();
  return {
    id: entry.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
    expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : null,
  };
};

export const createStatus = async ({ sellerId, storeName, storeLogo, whatsappNumber, image, imagePublicId, caption, price }) => {
  const existing = await getDocs(query(collection(db, STATUSES), where('sellerId', '==', sellerId)));
  const now = Date.now();
  const activeCount = existing.docs.filter((entry) => {
    const expiresAt = entry.data().expiresAt?.toDate?.().getTime() || 0;
    return expiresAt > now;
  }).length;

  if (activeCount >= MAX_ACTIVE_PER_SELLER) {
    throw new Error(`You can only have ${MAX_ACTIVE_PER_SELLER} active statuses at once — wait for one to expire or delete one first`);
  }
  if (!image) throw new Error('An image is required');

  const ref = await addDoc(collection(db, STATUSES), {
    sellerId,
    storeName: storeName || 'A Cartly Hub seller',
    storeLogo: storeLogo || null,
    whatsappNumber: whatsappNumber || null,
    image,
    imagePublicId: imagePublicId || null,
    caption: caption || '',
    price: price || null,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + ACTIVE_HOURS * 60 * 60 * 1000),
  });

  return { id: ref.id };
};

export const listSellerStatuses = async (sellerId) => {
  const snap = await getDocs(query(collection(db, STATUSES), where('sellerId', '==', sellerId)));
  return snap.docs.map(hydrate).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

/** Everything currently live, for the homepage — fetched in full and filtered/grouped in memory (small collection, avoids a composite index). */
export const listActiveStatuses = async () => {
  const snap = await getDocs(collection(db, STATUSES));
  const now = Date.now();

  const active = snap.docs.map(hydrate).filter((status) => status.expiresAt && status.expiresAt.getTime() > now);
  active.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const bySeller = new Map();
  for (const status of active) {
    if (!bySeller.has(status.sellerId)) {
      bySeller.set(status.sellerId, {
        sellerId: status.sellerId,
        storeName: status.storeName,
        storeLogo: status.storeLogo,
        statuses: [],
      });
    }
    bySeller.get(status.sellerId).statuses.push(status);
  }

  return Array.from(bySeller.values());
};

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Never let a Cloudinary hiccup block the Firestore cleanup — worst case
    // an orphaned image sits in Cloudinary, which is recoverable; a status
    // stuck live forever because of a storage-provider error is worse.
    console.error('[status-service] Cloudinary delete failed', publicId, error.message);
  }
};

/** A seller deleting their own status early — same cleanup as natural expiry, just immediate and with no archive copy (nothing to dispute, they removed it themselves). */
export const deleteStatusNow = async (sellerId, statusId) => {
  const ref = doc(db, STATUSES, statusId);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().sellerId !== sellerId) throw new Error('Status not found');

  await deleteCloudinaryImage(snap.data().imagePublicId);
  await deleteDoc(ref);
};

/**
 * Daily cron target. Two passes: move anything past 24h into the archive
 * (and delete its live copy + Cloudinary image), then hard-delete archive
 * entries past 30 days — the actual "forever deleted" step.
 */
export const expireAndArchiveStatuses = async () => {
  const now = Date.now();

  const snap = await getDocs(collection(db, STATUSES));
  let expired = 0;
  for (const entry of snap.docs) {
    const data = entry.data();
    const expiresAt = data.expiresAt?.toDate?.().getTime() || 0;
    if (expiresAt > now) continue;

    await addDoc(collection(db, ARCHIVE), { ...data, archivedAt: Timestamp.now(), originalId: entry.id });
    await deleteCloudinaryImage(data.imagePublicId);
    await deleteDoc(doc(db, STATUSES, entry.id));
    expired++;
  }

  const archiveSnap = await getDocs(collection(db, ARCHIVE));
  const cutoff = now - ARCHIVE_DAYS * 24 * 60 * 60 * 1000;
  let purged = 0;
  for (const entry of archiveSnap.docs) {
    const archivedAt = entry.data().archivedAt?.toDate?.().getTime() || 0;
    if (archivedAt && archivedAt < cutoff) {
      await deleteDoc(doc(db, ARCHIVE, entry.id));
      purged++;
    }
  }

  return { expired, purged };
};
