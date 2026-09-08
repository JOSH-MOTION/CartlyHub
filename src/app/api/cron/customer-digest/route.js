import { NextResponse } from 'next/server';
import { db, collection, getDocs } from '@/lib/firestore-server';
import { getProducts } from '@/utils/firebaseData';
import { enqueueMany, processEmailQueue } from '@/services/marketplace/email-queue-service';
import { productSlug } from '@/lib/product-url';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
 *
 * Enqueues rather than sending directly — see email-queue-service.js for
 * why (a shared 70/day budget across every non-transactional email type).
 */
export async function GET(request) {
  try {
    const auth = request.headers.get('authorization');
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await getProducts();
    const newArrivals = products.slice(0, 4).map(asDigestProduct);
    const priceDrops = products
      .filter((p) => p.compareAtPrice && Number(p.compareAtPrice) > Number(p.basePrice))
      .slice(0, 4)
      .map(asDigestProduct);

    if (newArrivals.length === 0 && priceDrops.length === 0) {
      return NextResponse.json({ success: true, queued: 0, note: 'nothing to send' });
    }

    const snap = await getDocs(collection(db, 'users'));
    const recipients = snap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((user) => user.email && user.email.includes('@') && !user.marketingEmailsOptOut);

    const queued = await enqueueMany(
      'customer_digest',
      recipients.map((user) => ({
        email: user.email,
        name: user.name,
        userId: user.id,
        newArrivals,
        priceDrops,
      })),
    );

    const result = await processEmailQueue();

    return NextResponse.json({ success: true, queued, ...result });
  } catch (error) {
    console.error('Error running customer digest cron:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
