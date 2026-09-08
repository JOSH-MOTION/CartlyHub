import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '../../lib/firestore-server';

/**
 * Password reset links, generated server-side via Admin Auth.
 *
 * `handleCodeInApp: true` is what makes Firebase point the link at our own
 * `url` (with `mode`/`oobCode` appended) instead of Firebase's generic
 * hosted action-handler page — that's the whole difference between a
 * Cartly Hub–branded reset page and a bare firebaseapp.com one.
 */
const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://cartlyhubgh.com').replace(/\/+$/, '');

export const generatePasswordResetLink = async (email) => {
  const app = getAdminApp();
  if (!app) {
    throw new Error('Password reset is not available right now — please try again shortly');
  }

  return getAuth(app).generatePasswordResetLink(email, {
    url: `${siteUrl()}/reset-password`,
    handleCodeInApp: true,
  });
};
