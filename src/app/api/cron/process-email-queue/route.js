import { NextResponse } from 'next/server';
import { processEmailQueue, getQueueStatus } from '@/services/marketplace/email-queue-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron target — see vercel.json. Runs once daily, early, before any
 * of the day's producers (customer-digest, seller-nudge, broadcasts) add
 * anything new — so a backlog left over from a day that hit the 70/day cap
 * gets first claim on the fresh day's budget instead of competing with
 * whatever gets enqueued later that same day.
 */
export async function GET(request) {
  try {
    const auth = request.headers.get('authorization');
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processEmailQueue();
    const status = await getQueueStatus();

    return NextResponse.json({ success: true, ...result, queueStatus: status });
  } catch (error) {
    console.error('Error running email queue processor:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
