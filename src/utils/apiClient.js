import { auth } from '@/lib/firebase';

/**
 * Fetch wrapper for the marketplace API.
 *
 * Attaches the current Firebase ID token so route handlers can verify who is
 * calling, and unwraps the `{ success, error }` envelope every marketplace
 * endpoint returns into either data or a thrown Error with a message that is
 * safe to show the user.
 */
export const apiFetch = async (path, { method = 'GET', body, signal } = {}) => {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // Guest checkout is allowed — carry on without a token.
  }

  const response = await fetch(path, {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || 'Something went wrong. Please try again.');
  }

  return payload;
};
