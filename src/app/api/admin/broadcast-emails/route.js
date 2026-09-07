import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  sendAnnouncementEmail,
  sendProductSpotlightEmail,
  sendFeatureDigestEmail,
  usingResend,
} from '@/services/marketplace/email-service';

/**
 * Admin broadcast tool: a free-text announcement to sellers/customers/both,
 * or a "you might like this" product spotlight to customers.
 *
 * Batched deliberately. Gmail SMTP (the fallback when RESEND_API_KEY isn't
 * set) throttles hard past a few dozen messages in a short window and will
 * start silently failing sends well before any real seller/customer list is
 * fully covered — so this always sends in small chunks with a pause between
 * them, whichever provider email-service.js ends up using.
 */

const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 1500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const AUDIENCES = ['sellers', 'customers', 'all'];

/** Collects { email, name } recipients, deduped by email. */
const collectRecipients = async (audience, { respectMarketingOptOut = false } = {}) => {
  const recipients = new Map();

  if (audience === 'sellers' || audience === 'all') {
    const snap = await getDocs(collection(db, 'sellers'));
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const email = data.contactEmail;
      if (email && email !== 'N/A' && email.includes('@')) {
        recipients.set(email, { name: data.ownerName || data.storeName || 'Partner' });
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
      recipients.set(email, { name: data.name || null });
    });
  }

  return Array.from(recipients.entries()).map(([email, info]) => ({ email, ...info }));
};

const sendInBatches = async (recipients, sendOne) => {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((recipient) => sendOne(recipient).catch(() => ({ sent: false }))),
    );
    results.forEach((result) => (result?.sent ? sent++ : failed++));

    if (i + BATCH_SIZE < recipients.length) await sleep(BATCH_DELAY_MS);
  }

  return { sent, failed };
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, audience = 'sellers', mode = 'announcement', product } = body;

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

    const { sent, failed } = await sendInBatches(recipients, ({ email, name }) => {
      if (mode === 'product_spotlight') return sendProductSpotlightEmail({ email, name, product });
      if (mode === 'feature_digest') return sendFeatureDigestEmail({ email, name });
      return sendAnnouncementEmail({ email, name, title, message });
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: recipients.length,
      // Proves which provider this deployment actually used, rather than
      // guessing from delivery numbers alone.
      provider: usingResend() ? 'resend' : 'gmail',
    });
  } catch (error) {
    console.error('Error running broadcast API:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
