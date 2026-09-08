import { db, collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, setDoc, Timestamp } from '../../lib/firestore-server';
import {
  sendAnnouncementEmail,
  sendProductSpotlightEmail,
  sendFeatureDigestEmail,
  sendWeeklyCustomerDigestEmail,
  sendSellerEngagementNudgeEmail,
  sendAbandonedCartEmail,
} from './email-service';
import { markCartReminded } from './cart-service';

/**
 * A shared daily budget for every non-transactional email — weekly digests,
 * engagement nudges, admin broadcasts, product spotlights, abandoned-cart
 * reminders. Anything past the daily cap isn't dropped, it waits in
 * `emailQueue` until a day with room. Order confirmations, receipts and
 * low-stock alerts don't go through this — those are transactional,
 * expected immediately after a real action, and low-volume by nature, so
 * capping them would just delay something a customer is actively waiting
 * on for no real quota benefit.
 */

const QUEUE = 'emailQueue';
const QUOTA = 'emailQuota';
const DAILY_LIMIT = 70;
const SEND_DELAY_MS = 550;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const todayKey = () => new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD

/**
 * `afterSent` runs only once a queued item has actually gone out — for
 * abandoned carts that means marking the cart reminded only now, not at
 * enqueue time, since the real send can happen a day or more later once the
 * daily budget allows it.
 */
const SENDERS = {
  announcement: { send: (p) => sendAnnouncementEmail(p) },
  product_spotlight: { send: (p) => sendProductSpotlightEmail(p) },
  feature_digest: { send: (p) => sendFeatureDigestEmail(p) },
  customer_digest: { send: (p) => sendWeeklyCustomerDigestEmail(p) },
  seller_nudge: { send: (p) => sendSellerEngagementNudgeEmail(p) },
  abandoned_cart: {
    send: (p) => sendAbandonedCartEmail(p),
    afterSent: (p) => markCartReminded(p.userId),
  },
};

/** Adds one email to the queue. Cheap and synchronous-feeling — the actual send happens in processQueue. */
export const enqueueEmail = async (type, payload) => {
  if (!SENDERS[type]) throw new Error(`Unknown queued email type: ${type}`);
  await addDoc(collection(db, QUEUE), {
    type,
    payload,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
};

export const enqueueMany = async (type, payloads) => {
  for (const payload of payloads) await enqueueEmail(type, payload);
  return payloads.length;
};

const getRemainingQuota = async () => {
  const key = todayKey();
  const ref = doc(db, QUOTA, key);
  const snap = await getDoc(ref);
  const sentToday = snap.exists() ? Number(snap.data().sentToday || 0) : 0;
  return { key, ref, sentToday, remaining: Math.max(0, DAILY_LIMIT - sentToday) };
};

const bumpQuota = async (ref, sentToday) => {
  await setDoc(ref, { sentToday: sentToday + 1, updatedAt: Timestamp.now() }, { merge: true });
};

/**
 * Sends as many pending items as today's remaining budget allows, oldest
 * first, throttled. Called once at the end of every producer (so sending
 * starts right away, not a full day later), and once daily on its own to
 * clear any backlog left over from a day that filled up.
 */
export const processEmailQueue = async () => {
  const { ref: quotaRef, sentToday: startingSentToday, remaining } = await getRemainingQuota();
  if (remaining <= 0) return { processed: 0, sent: 0, failed: 0, remaining: 0 };

  // Filtering on `status` and ordering by `createdAt` together needs a
  // composite index Firestore won't build automatically — sorting the
  // (small) pending set in memory avoids that, same reasoning as
  // notification-service.js's listNotifications.
  const pendingSnap = await getDocs(query(collection(db, QUEUE), where('status', '==', 'pending')));
  const docs = pendingSnap.docs
    .slice()
    .sort((a, b) => (a.data().createdAt?.toMillis?.() ?? 0) - (b.data().createdAt?.toMillis?.() ?? 0))
    .slice(0, remaining);

  let sent = 0;
  let failed = 0;
  let sentToday = startingSentToday;

  for (let i = 0; i < docs.length; i++) {
    const item = docs[i];
    const { type, payload } = item.data();

    try {
      const result = await SENDERS[type].send(payload);
      if (result?.sent) {
        await updateDoc(doc(db, QUEUE, item.id), { status: 'sent', processedAt: Timestamp.now() });
        if (SENDERS[type].afterSent) await SENDERS[type].afterSent(payload).catch(() => {});
        await bumpQuota(quotaRef, sentToday);
        sentToday++;
        sent++;
      } else {
        await updateDoc(doc(db, QUEUE, item.id), {
          status: 'failed',
          processedAt: Timestamp.now(),
          error: result?.error || 'send returned not-sent',
        });
        failed++;
      }
    } catch (error) {
      await updateDoc(doc(db, QUEUE, item.id), {
        status: 'failed',
        processedAt: Timestamp.now(),
        error: error.message,
      }).catch(() => {});
      failed++;
    }

    if (i < docs.length - 1) await sleep(SEND_DELAY_MS);
  }

  return { processed: docs.length, sent, failed, remaining: Math.max(0, DAILY_LIMIT - sentToday) };
};

/** For visibility — how much of today's budget is left, and how big the backlog is. */
export const getQueueStatus = async () => {
  const { sentToday, remaining } = await getRemainingQuota();
  const pendingSnap = await getDocs(query(collection(db, QUEUE), where('status', '==', 'pending')));
  return { dailyLimit: DAILY_LIMIT, sentToday, remaining, pending: pendingSnap.size };
};
