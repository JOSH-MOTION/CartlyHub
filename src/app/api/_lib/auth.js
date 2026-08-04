import { db, doc, getDoc } from '../../../lib/firestore-server';
import { COLLECTIONS } from '../../../services/marketplace/constants';

/**
 * Request authentication for the marketplace API.
 *
 * The client sends its Firebase ID token as `Authorization: Bearer <token>`.
 * We validate it server-side through Google's Identity Toolkit, which works
 * with only the public web API key — no service account needed. The token's
 * signature, expiry and audience are all checked by Google, so a caller cannot
 * simply claim to be another uid.
 *
 * Roles come from the `users` document, vendor identity from `sellers`.
 */

const IDENTITY_ENDPOINT =
  'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

export class ApiAuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'ApiAuthError';
    this.status = status;
  }
}

const bearerToken = (request) => {
  const header = request.headers.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
};

const verifyIdToken = async (idToken) => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new ApiAuthError('Authentication is not configured on the server', 500);
  }

  const response = await fetch(`${IDENTITY_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    cache: 'no-store',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.users?.length) {
    throw new ApiAuthError('Your session has expired, please sign in again');
  }

  const account = body.users[0];
  return {
    uid: account.localId,
    email: account.email || null,
    name: account.displayName || null,
    emailVerified: Boolean(account.emailVerified),
  };
};

/** Any signed-in customer, vendor or admin. */
export const requireUser = async (request) => {
  const token = bearerToken(request);
  if (!token) throw new ApiAuthError('Sign in to continue');

  const identity = await verifyIdToken(token);

  const snap = await getDoc(doc(db, 'users', identity.uid));
  const profile = snap.exists() ? snap.data() : null;

  return {
    ...identity,
    name: profile?.name || identity.name,
    role: profile?.role || 'customer',
    profile,
  };
};

/** A signed-in user who has an active seller profile. */
export const requireVendor = async (request) => {
  const user = await requireUser(request);

  const snap = await getDoc(doc(db, COLLECTIONS.SELLERS, user.uid));
  if (!snap.exists()) {
    throw new ApiAuthError('You do not have a Cartly Hub store', 403);
  }

  const vendor = { id: snap.id, ...snap.data() };
  if (vendor.isSuspended) {
    throw new ApiAuthError('Your store is suspended', 403);
  }

  return { ...user, vendor };
};

export const requireAdmin = async (request) => {
  const user = await requireUser(request);
  if (String(user.role).toUpperCase() !== 'ADMIN') {
    throw new ApiAuthError('Administrator access required', 403);
  }
  return user;
};

/** Optional identity — used by guest checkout. */
export const optionalUser = async (request) => {
  try {
    return await requireUser(request);
  } catch {
    return null;
  }
};
