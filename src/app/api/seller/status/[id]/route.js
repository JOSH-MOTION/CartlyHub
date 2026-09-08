import { deleteStatusNow } from '@/services/marketplace/status-service';
import { requireVendor } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const { uid } = await requireVendor(request);
    await deleteStatusNow(uid, params.id);
    return ok({});
  } catch (error) {
    return fail(error, 400);
  }
}
