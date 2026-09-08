import { NextResponse } from 'next/server';
import { db, collection, getDocs, doc, updateDoc, query, where, Timestamp } from '@/lib/firestore-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TRIMMED_FIELDS = ['storeName', 'ownerName', 'description', 'location', 'region', 'contactEmail'];

/**
 * One-time cleanup: trims stray leading/trailing whitespace from existing
 * seller profiles saved before onboarding/settings started trimming on
 * write. A trailing space in storeName silently breaks exact-match lookups
 * (getSellerByStoreName) used for both the store page and its link preview
 * — this is what caused an already-live store to fall back to generic
 * metadata. Idempotent: safe to call again, it only touches docs that still
 * have untrimmed values.
 */
export async function POST() {
  try {
    const sellersSnap = await getDocs(collection(db, 'sellers'));
    let sellersFixed = 0;
    let productsFixed = 0;
    let reviewsFixed = 0;

    for (const sellerDoc of sellersSnap.docs) {
      const data = sellerDoc.data();
      const updates = {};
      let storeNameChanged = false;

      TRIMMED_FIELDS.forEach((field) => {
        const value = data[field];
        if (typeof value === 'string' && value !== value.trim()) {
          updates[field] = value.trim();
          if (field === 'storeName') storeNameChanged = true;
        }
      });

      if (Object.keys(updates).length === 0) continue;

      await updateDoc(doc(db, 'sellers', sellerDoc.id), { ...updates, updatedAt: Timestamp.now() });
      sellersFixed++;

      // storeName is denormalized onto every product and review this seller
      // owns — keep them in sync the same way Settings already does.
      if (storeNameChanged) {
        const trimmedName = updates.storeName;

        const productsSnap = await getDocs(
          query(collection(db, 'products'), where('sellerId', '==', sellerDoc.id)),
        );
        for (const productDoc of productsSnap.docs) {
          await updateDoc(doc(db, 'products', productDoc.id), { sellerName: trimmedName });
          productsFixed++;
        }

        const reviewsSnap = await getDocs(
          query(collection(db, 'reviews'), where('sellerId', '==', sellerDoc.id)),
        );
        for (const reviewDoc of reviewsSnap.docs) {
          await updateDoc(doc(db, 'reviews', reviewDoc.id), { sellerName: trimmedName });
          reviewsFixed++;
        }
      }
    }

    return NextResponse.json({ success: true, sellersFixed, productsFixed, reviewsFixed });
  } catch (error) {
    console.error('Error cleaning up seller names:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
