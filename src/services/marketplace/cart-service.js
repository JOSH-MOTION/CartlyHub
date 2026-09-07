import { db, doc, getDoc, getDocs, collection, setDoc, updateDoc, Timestamp } from '../../lib/firestore-server';

/**
 * Server-side mirror of each signed-in user's cart, kept only so an
 * abandoned-cart reminder can be sent — the cart itself still lives and
 * operates entirely client-side (Zustand + localStorage, `useCart.js`).
 *
 * Guest carts are never mirrored: there's no email to remind, so there's
 * nothing useful to store.
 */

const CARTS = 'carts';

/** Called on every (debounced) client-side cart change for a signed-in user. */
export const syncCart = async ({ userId, email, name, items }) => {
  if (!userId) return;

  const ref = doc(db, CARTS, userId);
  const hasItems = Array.isArray(items) && items.length > 0;

  await setDoc(
    ref,
    {
      userId,
      email: email || null,
      name: name || null,
      items: items || [],
      updatedAt: Timestamp.now(),
      // A fresh reminder should be possible again once the cart is genuinely
      // active again, not just because a stale doc exists.
      ...(hasItems ? {} : { reminderSentAt: null }),
    },
    { merge: true },
  );
};

/**
 * Carts untouched for `olderThanMs`, still holding items, and not reminded
 * in the last `cooldownMs` — fetched in full and filtered in memory, same as
 * notification-service.js, since cart volume here doesn't warrant a
 * composite index.
 */
export const findAbandonedCarts = async ({ olderThanMs, cooldownMs }) => {
  const snapshot = await getDocs(collection(db, CARTS));
  const now = Date.now();

  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .filter((cart) => {
      if (!cart.email || !Array.isArray(cart.items) || cart.items.length === 0) return false;

      const updatedAt = cart.updatedAt?.toDate ? cart.updatedAt.toDate().getTime() : 0;
      if (now - updatedAt < olderThanMs) return false;

      const remindedAt = cart.reminderSentAt?.toDate ? cart.reminderSentAt.toDate().getTime() : 0;
      if (remindedAt && now - remindedAt < cooldownMs) return false;

      return true;
    });
};

export const markCartReminded = async (userId) => {
  await updateDoc(doc(db, CARTS, userId), { reminderSentAt: Timestamp.now() });
};
