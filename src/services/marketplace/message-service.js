import { db, collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, Timestamp } from '../../lib/firestore-server';

/**
 * Lightweight in-app messaging — currently only for status-originated
 * inquiries ("I saw your status, is this still available?"). Deliberately
 * not a real-time chat platform: no typing indicators, no read receipts
 * beyond a coarse unread flag. New messages plug into the notification/email
 * system that already exists rather than inventing a second one.
 */

const THREADS = 'messageThreads';
const MESSAGES = 'threadMessages';

const hydrateThread = (entry) => {
  const data = entry.data();
  return {
    id: entry.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
    lastMessageAt: data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : null,
  };
};

/** One thread per (status, customer) pair — reopening the same status re-uses the existing conversation. */
export const getOrCreateThreadForStatus = async ({
  statusId,
  statusImage,
  statusCaption,
  sellerId,
  sellerStoreName,
  sellerEmail,
  sellerWhatsapp,
  customerId,
  customerName,
  customerEmail,
}) => {
  if (sellerId === customerId) throw new Error("You can't message your own status");

  const existing = await getDocs(
    query(collection(db, THREADS), where('statusId', '==', statusId), where('customerId', '==', customerId)),
  );
  if (!existing.empty) return { id: existing.docs[0].id, isNew: false };

  const ref = await addDoc(collection(db, THREADS), {
    statusId,
    statusImage: statusImage || null,
    statusCaption: statusCaption || null,
    sellerId,
    sellerStoreName: sellerStoreName || 'Seller',
    sellerEmail: sellerEmail || null,
    sellerWhatsapp: sellerWhatsapp || null,
    customerId,
    customerName: customerName || 'A buyer',
    customerEmail: customerEmail || null,
    createdAt: Timestamp.now(),
    lastMessageAt: Timestamp.now(),
    lastMessage: null,
  });

  return { id: ref.id, isNew: true };
};

export const getThread = async (threadId) => {
  const snap = await getDoc(doc(db, THREADS, threadId));
  return snap.exists() ? hydrateThread(snap) : null;
};

/** A thread's two participants are its seller and its customer — nobody else can read or post to it. */
export const assertParticipant = (thread, userId) => {
  if (!thread || (thread.sellerId !== userId && thread.customerId !== userId)) {
    throw new Error('Thread not found');
  }
};

export const sendMessage = async ({ threadId, senderId, senderRole, text }) => {
  const trimmed = (text || '').trim();
  if (!trimmed) throw new Error('Message cannot be empty');

  await addDoc(collection(db, MESSAGES), {
    threadId,
    senderId,
    senderRole,
    text: trimmed,
    createdAt: Timestamp.now(),
  });

  await updateDoc(doc(db, THREADS, threadId), {
    lastMessageAt: Timestamp.now(),
    lastMessage: trimmed.slice(0, 140),
  });
};
