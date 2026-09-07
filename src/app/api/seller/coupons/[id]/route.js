import { setCouponActive, deleteCoupon } from '@/services/marketplace/coupon-service';
import { requireVendor } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const { uid } = await requireVendor(request);
    const { isActive } = await request.json();
    await setCouponActive(uid, params.id, isActive);
    return ok({});
  } catch (error) {
    return fail(error, 400);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { uid } = await requireVendor(request);
    await deleteCoupon(uid, params.id);
    return ok({});
  } catch (error) {
    return fail(error, 400);
  }
}
