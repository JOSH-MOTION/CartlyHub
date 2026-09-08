import { NextResponse } from 'next/server';
import { db, collection, getDocs } from '@/lib/firestore-server';
import { usingResend } from '@/services/marketplace/email-service';
import { enqueueMany, processEmailQueue } from '@/services/marketplace/email-queue-service';
import { requireAdmin } from '@/app/api/_lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Admin broadcast tool: a free-text announcement to sellers/customers/both,
 * or a "you might like this" product spotlight to customers.
 *
 * Enqueues rather than sending directly — see email-queue-service.js. A
 * large broadcast may now take more than one day to fully go out if it's
 * bigger than the remaining daily budget; the response tells you how many
 * queued vs. how many actually went out in this call.
 */

const AUDIENCES = ['sellers', 'customers', 'all'];

const MODE_TO_QUEUE_TYPE = {
  product_spotlight: 'product_spotlight',
  feature_digest: 'feature_digest',
  announcement: 'announcement',
};

/** Collects { email, name, userId } recipients, deduped by email. */
const collectRecipients = async (audience, { respectMarketingOptOut = false } = {}) => {
  const recipients = new Map();

  if (audience === 'sellers' || audience === 'all') {
    const snap = await getDocs(collection(db, 'sellers'));
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const email = data.contactEmail;
      if (email && email !== 'N/A' && email.includes('@')) {
        recipients.set(email, { name: data.ownerName || data.storeName || 'Partner', userId: docSnap.id });
      }
    });
  }

  if (audience === 'customers' || audience === 'all') {
    const snap = await getDocs(collection(db, 'users'));
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const email = data.email;
      if (!email || !email.includes('@') || recipients.has(email)) return;
      if (respectMarketingOptOut && data.marketingEmailsOptOut) return;
      recipients.set(email, { name: data.name || null, userId: docSnap.id });
    });
  }

  return Array.from(recipients.entries()).map(([email, info]) => ({ email, ...info }));
};

export async function POST(request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { title, message, audience = 'sellers', mode = 'announcement', product, imageUrl } = body;

    if (mode === 'product_spotlight') {
      if (!product?.name || !product?.href || product?.price === undefined) {
        return NextResponse.json({ error: 'Missing product fields' }, { status: 400 });
      }
    } else if (mode === 'announcement' && (!title || !message)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!AUDIENCES.includes(audience)) {
      return NextResponse.json({ error: 'Invalid audience' }, { status: 400 });
    }

    const recipients = await collectRecipients(mode === 'product_spotlight' ? 'customers' : audience, {
      respectMarketingOptOut: mode === 'product_spotlight',
    });

    const queueType = MODE_TO_QUEUE_TYPE[mode] || 'announcement';
    const payloads = recipients.map(({ email, name, userId }) => {
      if (mode === 'product_spotlight') return { email, name, product, userId };
      if (mode === 'feature_digest') return { email, name };
      return { email, name, title, message, imageUrl };
    });

    const queued = await enqueueMany(queueType, payloads);
    const result = await processEmailQueue();

    return NextResponse.json({
      success: true,
      queued,
      ...result,
      // Proves which provider this deployment actually used, rather than
      // guessing from delivery numbers alone.
      provider: usingResend() ? 'resend' : 'gmail',
    });
  } catch (error) {
    console.error('Error running broadcast API:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: error.status || 500 });
  }
}
