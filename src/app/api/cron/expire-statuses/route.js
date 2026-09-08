import { NextResponse } from 'next/server';
import { expireAndArchiveStatuses } from '@/services/marketplace/status-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron target — see vercel.json. Runs daily: archives + deletes
 * anything past its 24h window (Firestore doc + Cloudinary image both), then
 * hard-deletes archive entries past 30 days.
 *
 * The homepage itself already filters to expiresAt > now, so a status looks
 * gone within its exact 24 hours regardless of when this cron happens to
 * run — this is only about the underlying data actually being removed.
 */
export async function GET(request) {
  try {
    const auth = request.headers.get('authorization');
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await expireAndArchiveStatuses();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error running status expiry cron:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
