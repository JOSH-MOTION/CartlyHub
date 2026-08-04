import { setVendorSuspended } from '@/services/marketplace/vendor-service';
import { requireAdmin } from '@/app/api/_lib/auth';
import { ok, fail, badRequest } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/** Suspends or reinstates a vendor. Suspended vendors drop out of checkout. */
export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin(request);
    const { action, reason } = await request.json();

    if (action !== 'suspend' && action !== 'reinstate') {
      return badRequest('Action must be suspend or reinstate');
    }

    const vendor = await setVendorSuspended(params.id, action === 'suspend', {
      adminId: admin.uid,
      reason,
    });

    return ok({ vendor });
  } catch (error) {
    return fail(error, 400);
  }
}
