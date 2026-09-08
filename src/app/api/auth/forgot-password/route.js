import { generatePasswordResetLink } from '@/services/marketplace/auth-service';
import { sendPasswordResetEmail } from '@/services/marketplace/email-service';
import { ok, badRequest } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/**
 * Always responds with the same generic success message, whether or not the
 * email belongs to an account — otherwise this endpoint would let anyone
 * check which emails are registered on Cartly Hub.
 */
export async function POST(request) {
  const { email } = await request.json().catch(() => ({}));
  if (!email || !String(email).includes('@')) return badRequest('Enter a valid email address');

  try {
    const resetLink = await generatePasswordResetLink(String(email).trim().toLowerCase());
    await sendPasswordResetEmail({ email: String(email).trim().toLowerCase(), resetLink });
  } catch (error) {
    // auth/user-not-found and similar are expected for an email that isn't
    // registered — logged for our own visibility, never surfaced to the caller.
    if (error?.code !== 'auth/user-not-found') {
      console.error('[forgot-password]', error?.code || error?.message || error);
    }
  }

  return ok({ message: "If that email has a Cartly Hub account, we've sent a reset link." });
}
