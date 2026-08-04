/**
 * Server-side Firestore access for the marketplace services.
 *
 * Why this exists
 * ---------------
 * firestore.rules makes every money collection read-only from a browser, and
 * orders updatable only by an admin. The API therefore cannot use the Firebase
 * *web* SDK: route handlers have no signed-in user, so those writes are denied.
 * The Admin SDK bypasses rules, which is exactly what a trusted server wants.
 *
 * The Admin SDK's API is shaped differently from the web SDK
 * (`db.collection(x).doc(y).get()` rather than `getDoc(doc(db, x, y))`), so
 * this module re-exposes the small slice of the web SDK surface the services
 * use, backed by the Admin SDK. Service code imports from here instead of
 * 'firebase/firestore' and otherwise reads identically.
 *
 * Without credentials
 * -------------------
 * If FIREBASE_SERVICE_ACCOUNT (or GOOGLE_APPLICATION_CREDENTIALS) is absent,
 * this falls back to the web SDK so the app still boots for local UI work.
 * In that mode every write to orders, wallets, withdrawals and settings will
 * be rejected by the security rules — that is expected, not a bug. Check
 * `isAdminSdk` if you need to branch on it.
 */

import * as webSdk from 'firebase/firestore';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { db as webDb } from './firebase';

const serviceAccountJson = () =>
  process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

const hasAdminCredentials = Boolean(
  serviceAccountJson() || process.env.GOOGLE_APPLICATION_CREDENTIALS,
);

let adminDb = null;

if (hasAdminCredentials) {
  try {
    const raw = serviceAccountJson();
    const credential = raw
      ? cert(JSON.parse(raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString()))
      : applicationDefault();

    const app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });

    adminDb = getFirestore(app);
  } catch (error) {
    console.error(
      '[firestore-server] Admin SDK failed to initialise, falling back to the web SDK. ' +
        'Writes to orders, wallets and withdrawals will be denied by security rules.',
      error,
    );
    adminDb = null;
  }
} else if (
  process.env.NODE_ENV === 'production' &&
  // Every prerendered page imports this; only warn on a running server.
  process.env.NEXT_PHASE !== 'phase-production-build'
) {
  console.warn(
    '[firestore-server] FIREBASE_SERVICE_ACCOUNT is not set. The marketplace API ' +
      'cannot write orders, wallets or withdrawals until it is.',
  );
}

export const isAdminSdk = Boolean(adminDb);

// ---------------------------------------------------------------------------
// Web SDK fallback: hand back the real thing unchanged.
// ---------------------------------------------------------------------------
const webExports = {
  db: webDb,
  collection: webSdk.collection,
  doc: webSdk.doc,
  getDoc: webSdk.getDoc,
  getDocs: webSdk.getDocs,
  query: webSdk.query,
  where: webSdk.where,
  limit: webSdk.limit,
  orderBy: webSdk.orderBy,
  addDoc: webSdk.addDoc,
  setDoc: webSdk.setDoc,
  updateDoc: webSdk.updateDoc,
  deleteDoc: webSdk.deleteDoc,
  runTransaction: webSdk.runTransaction,
  Timestamp: webSdk.Timestamp,
  increment: webSdk.increment,
};

// ---------------------------------------------------------------------------
// Admin SDK adapter.
// ---------------------------------------------------------------------------

/** Wraps an Admin snapshot so `exists` is callable, as it is in the web SDK. */
const wrapDocSnapshot = (snapshot) => ({
  id: snapshot.id,
  ref: snapshot.ref,
  exists: () => snapshot.exists,
  data: () => snapshot.data(),
});

const wrapQuerySnapshot = (snapshot) => ({
  docs: snapshot.docs.map((entry) => ({
    id: entry.id,
    ref: entry.ref,
    data: () => entry.data(),
  })),
  empty: snapshot.empty,
  size: snapshot.size,
});

const buildAdminExports = () => {
  /**
   * `doc(db, 'orders', id)` → a document reference.
   * `doc(collectionRef)`    → a reference with a generated id.
   */
  const doc = (parent, ...segments) => {
    if (segments.length === 0) return parent.doc();

    let ref = parent;
    for (let index = 0; index < segments.length; index += 1) {
      ref = index % 2 === 0 ? ref.collection(segments[index]) : ref.doc(segments[index]);
    }
    return ref;
  };

  return {
    db: adminDb,

    collection: (parent, name) => parent.collection(name),
    doc,

    getDoc: async (ref) => wrapDocSnapshot(await ref.get()),
    getDocs: async (target) => wrapQuerySnapshot(await target.get()),

    // Constraints are deferred so `query()` can fold them onto the reference,
    // which is how the Admin SDK chains them.
    query: (ref, ...constraints) =>
      constraints.reduce((current, apply) => apply(current), ref),
    where: (field, operator, value) => (ref) => ref.where(field, operator, value),
    limit: (count) => (ref) => ref.limit(count),
    orderBy: (field, direction = 'asc') => (ref) => ref.orderBy(field, direction),

    addDoc: (collectionRef, data) => collectionRef.add(data),
    setDoc: (ref, data, options) =>
      options?.merge ? ref.set(data, { merge: true }) : ref.set(data),
    updateDoc: (ref, data) => ref.update(data),
    deleteDoc: (ref) => ref.delete(),

    runTransaction: (_db, handler) =>
      adminDb.runTransaction((transaction) =>
        handler({
          get: async (ref) => wrapDocSnapshot(await transaction.get(ref)),
          set: (ref, data, options) =>
            options?.merge
              ? transaction.set(ref, data, { merge: true })
              : transaction.set(ref, data),
          update: (ref, data) => transaction.update(ref, data),
          delete: (ref) => transaction.delete(ref),
        }),
      ),

    Timestamp: AdminTimestamp,
    increment: (value) => FieldValue.increment(value),
  };
};

const api = adminDb ? buildAdminExports() : webExports;

export const db = api.db;
export const collection = api.collection;
export const doc = api.doc;
export const getDoc = api.getDoc;
export const getDocs = api.getDocs;
export const query = api.query;
export const where = api.where;
export const limit = api.limit;
export const orderBy = api.orderBy;
export const addDoc = api.addDoc;
export const setDoc = api.setDoc;
export const updateDoc = api.updateDoc;
export const deleteDoc = api.deleteDoc;
export const runTransaction = api.runTransaction;
export const Timestamp = api.Timestamp;
export const increment = api.increment;
