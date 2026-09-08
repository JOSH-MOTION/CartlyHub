import { NextResponse } from 'next/server';
import { db, collection, getDocs } from '@/lib/firestore-server';
import { getSellerProducts } from '@/utils/firebaseData';
import { sendSellerEngagementNudgeEmail } from '@/services/marketplace/email-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SEND_DELAY_MS = 550;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const STALE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Weekly, see vercel.json. Only emails a seller who's actually gone quiet —
 * zero listings, or nothing new in 7+ days — never every seller regardless
 * of activity, so this stays a useful nudge rather than noise.
 */
export async function GET(request) {
  try {
    const auth = request.headers.get('authorization');
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snap = await getDocs(collection(db, 'sellers'));
    const sellers = snap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter(
        (seller) =>
          !seller.isSuspended &&
          seller.contactEmail &&
          seller.contactEmail !== 'N/A' &&
          seller.contactEmail.includes('@') &&
          !seller.marketingEmailsOptOut,
      );

    const now = Date.now();
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      const products = await getSellerProducts(seller.id);

      const hasNoProducts = products.length === 0;
      let daysSinceLastListing = null;

      if (!hasNoProducts) {
        const mostRecent = products.reduce((latest, product) => {
          const createdAt = product.createdAt instanceof Date ? product.createdAt.getTime() : 0;
          return createdAt > latest ? createdAt : latest;
        }, 0);
        daysSinceLastListing = Math.floor((now - mostRecent) / DAY_MS);
      }

      if (!hasNoProducts && daysSinceLastListing < STALE_DAYS) {
        skipped++;
        continue;
      }

      const result = await sendSellerEngagementNudgeEmail({
        email: seller.contactEmail,
        ownerName: seller.ownerName,
        storeName: seller.storeName,
        userId: seller.id,
        hasNoProducts,
        daysSinceLastListing,
      }).catch(() => ({ sent: false }));

      if (result?.sent) sent++;
      else failed++;

      if (i < sellers.length - 1) await sleep(SEND_DELAY_MS);
    }

    return NextResponse.json({ success: true, sent, failed, skipped, total: sellers.length });
  } catch (error) {
    console.error('Error running seller engagement nudge cron:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
