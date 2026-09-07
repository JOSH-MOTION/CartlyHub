import { NextResponse } from 'next/server';
import { usingResend } from '@/services/marketplace/email-service';

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
  });
}
