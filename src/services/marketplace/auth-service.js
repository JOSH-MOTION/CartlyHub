import { GoogleAuth } from 'google-auth-library';

/**
 * Password reset links, via Google Identity Toolkit's REST API directly —
 * NOT firebase-admin/auth. That module pulls in jwks-rsa, whose own declared
 * dependency on `jose` is ESM-only; Node's require() of it crashes with
 * ERR_REQUIRE_ESM in Vercel's serverless bundle (confirmed via a diagnostic
 * probe — this isn't a bundler-config problem, jwks-rsa is broken for any
 * CJS consumer as of its current release). This calls the same underlying
 * API Admin SDK's generatePasswordResetLink uses, with the same service
 * account credentials already loaded for Firestore, without touching that
 * broken import path.
 *
 * `canHandleCodeInApp: true` + `continueUrl` is what makes the generated
 * link point at our own /reset-password page (with mode/oobCode as query
 * params) instead of Firebase's generic hosted action-handler page — the
 * REST equivalent of the client SDK's `actionCodeSettings.handleCodeInApp`.
 */

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://cartlyhubgh.com').replace(/\/+$/, '');

const serviceAccountJson = () =>
  process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let cachedAuthClient = null;

const getAccessToken = async () => {
  const raw = serviceAccountJson();
  if (!raw) throw new Error('Password reset is not available right now — please try again shortly');

  if (!cachedAuthClient) {
    const credentials = JSON.parse(raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString());
    cachedAuthClient = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  const client = await cachedAuthClient.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error('Could not authenticate with Google Identity Toolkit');
  return token;
};

export const generatePasswordResetLink = async (email) => {
  const accessToken = await getAccessToken();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
        returnOobLink: true,
        continueUrl: `${siteUrl()}/reset-password`,
        canHandleCodeInApp: true,
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || '';
    const error = new Error(message || 'Could not generate a reset link');
    error.code = message === 'EMAIL_NOT_FOUND' ? 'auth/user-not-found' : `identitytoolkit/${message}`;
    throw error;
  }

  return data.oobLink;
};
