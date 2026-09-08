import { NextResponse } from 'next/server';
import { listActiveStatuses } from '@/services/marketplace/status-service';

export const dynamic = 'force-dynamic';

/** Public — the homepage story bar reads this, no auth needed. */
export async function GET() {
  try {
    const sellers = await listActiveStatuses();
    return NextResponse.json({ success: true, sellers });
  } catch (error) {
    console.error('Error listing active statuses:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
