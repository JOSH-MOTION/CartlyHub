import { NextResponse } from 'next/server';
import { db, collection, getDocs } from '@/lib/firestore-server';
import { getProducts } from '@/utils/firebaseData';
import { sendWeeklyCustomerDigestEmail } from '@/services/marketplace/email-service';
import { productSlug } from '@/lib/product-url';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SEND_DELAY_MS = 550;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const asDigestProduct = (product) => ({
  name: product.name,
  price: product.basePrice,
  currency: product.currency || 'GHS',
  image: product.images?.[0] || null,
  href: `/product/${productSlug(product)}`,
});

/**
 * Weekly, see vercel.json. New arrivals + price drops, site-wide — no
 * personalization yet, just "what changed this week", same content for
 * every recipient (cheap to compute once, reused across the whole send).
 */
export async function GET(request) {
  try {
    const auth = request.headers.get('authorization');
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let products;
    try {
      products = await getProducts();
    } catch (error) {
      return NextResponse.json({ error: `[getProducts] ${error.message}` }, { status: 500 });
    }

    const newArrivals = products.slice(0, 4).map(asDigestProduct);
    const priceDrops = products
      .filter((p) => p.compareAtPrice && Number(p.compareAtPrice) > Number(p.basePrice))
      .slice(0, 4)
      .map(asDigestProduct);

    if (newArrivals.length === 0 && priceDrops.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0, note: 'nothing to send' });
    }

    let snap;
    try {
      snap = await getDocs(collection(db, 'users'));
    } catch (error) {
      return NextResponse.json({ error: `[users getDocs] ${error.message}` }, { status: 500 });
    }

    const recipients = snap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((user) => user.email && user.email.includes('@') && !user.marketingEmailsOptOut);

    let sent = 0;
    let failed = 0;
    for (let i = 0; i < recipients.length; i++) {
      const user = recipients[i];
      const result = await sendWeeklyCustomerDigestEmail({
        email: user.email,
        name: user.name,
        userId: user.id,
        newArrivals,
        priceDrops,
      }).catch(() => ({ sent: false }));
      if (result?.sent) sent++;
      else failed++;

      if (i < recipients.length - 1) await sleep(SEND_DELAY_MS);
    }

    return NextResponse.json({ success: true, sent, failed, total: recipients.length });
  } catch (error) {
    console.error('Error running customer digest cron:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
