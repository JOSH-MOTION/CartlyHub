import { listThreadsForUser } from '@/services/marketplace/message-service';
import { requireUser } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/** Every thread the current user is part of, as either buyer or seller. */
export async function GET(request) {
  try {
    const user = await requireUser(request);
    const threads = await listThreadsForUser(user.uid);
    return ok({ threads, currentUserId: user.uid });
  } catch (error) {
    return fail(error, 400);
  }
}
