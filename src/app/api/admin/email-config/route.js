import { NextResponse } from 'next/server';
import { usingResend } from '@/services/marketplace/email-service';
import { isAdminSdk } from '@/lib/firestore-server';

export const dynamic = 'force-dynamic';

/**
 * Side-effect-free — reports which email provider this deployment will
 * actually use, without sending anything. Exists so "is Resend wired?" can
 * be checked without re-broadcasting to every seller/customer each time.
 */
export async function GET() {
  return NextResponse.json({
    provider: usingResend() ? 'resend' : 'gmail',
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    hasGmailCredentials: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    hasEmailFrom: Boolean(process.env.EMAIL_FROM),
    // If false, every "server" Firestore read/write in this app is quietly
    // running on the unauthenticated web SDK instead of the Admin SDK —
    // it only works at all because some collections' security rules happen
    // to be open. That's the actual explanation for "users reads fail but
    // sellers/products don't": Admin SDK bypasses rules with no exceptions,
    // so a collection-specific permission error is only possible without it.
    isAdminSdk,
    hasServiceAccount: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY),
    // Vercel sets this automatically per-deployment — the only reliable way
    // to confirm which commit is actually serving a given request, after a
    // stretch of deploys that silently failed to update production at all.
    deployedCommit: process.env.VERCEL_GIT_COMMIT_SHA || null,
  });
}
