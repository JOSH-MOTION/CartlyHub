import { getThread, listMessages, assertParticipant } from '@/services/marketplace/message-service';
import { requireUser } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await requireUser(request);
    const thread = await getThread(params.id);
    assertParticipant(thread, user.uid);

    const messages = await listMessages(params.id);
    return ok({ thread, messages, currentUserId: user.uid });
  } catch (error) {
    return fail(error, 400);
  }
}
