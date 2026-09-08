import { getOrCreateThreadForStatus } from '@/services/marketplace/message-service';
import { getStatusById } from '@/services/marketplace/status-service';
import { requireUser } from '@/app/api/_lib/auth';
import { ok, fail, badRequest } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/** A buyer taps "Message seller" on a status — creates (or reuses) the thread. */
export async function POST(request) {
  try {
    const user = await requireUser(request);
    const { statusId } = await request.json();
    if (!statusId) return badRequest('A status is required');

    const status = await getStatusById(statusId);
    if (!status) return badRequest('That status is no longer available');

    const thread = await getOrCreateThreadForStatus({
      statusId,
      statusImage: status.image,
      statusCaption: status.caption,
      sellerId: status.sellerId,
      sellerStoreName: status.storeName,
      sellerEmail: status.sellerEmail || null,
      sellerWhatsapp: status.whatsappNumber,
      customerId: user.uid,
      customerName: user.name || user.profile?.name,
      customerEmail: user.email,
    });

    return ok(thread);
  } catch (error) {
    return fail(error, 400);
  }
}
