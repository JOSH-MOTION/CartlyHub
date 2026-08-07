import { NextResponse } from 'next/server';
import { requireUser } from '../../_lib/auth';
import { fail } from '../../_lib/respond';
import { sendWelcomeEmail } from '../../../../services/marketplace/email-service';

export const dynamic = 'force-dynamic';

/**
 * Welcome email for a new account.
 *
 * Signup happens client-side through Firebase Auth, so the browser calls this
 * once the account exists. It is authenticated and sends only to the caller's
 * own verified address — otherwise this would be an open relay for spamming
 * arbitrary addresses with Cartly Hub branding.
 *
 * Best-effort by design: a mail failure must never make a successful signup
 * look broken, so a send failure still returns 200 with sent:false.
 */
export async function POST(request) {
  try {
    const user = await requireUser(request);

    const email = user.email;
    if (!email) {
      return NextResponse.json({ success: true, sent: false, reason: 'no email on account' });
    }

    const result = await sendWelcomeEmail({ email, name: user.name });

    return NextResponse.json({ success: true, sent: result.sent, error: result.error });
  } catch (error) {
    return fail(error, 400);
  }
}
