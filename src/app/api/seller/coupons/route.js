import { createCoupon, listSellerCoupons } from '@/services/marketplace/coupon-service';
import { requireVendor } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { uid } = await requireVendor(request);
    const coupons = await listSellerCoupons(uid);
    return ok({ coupons });
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request) {
  try {
    const { uid } = await requireVendor(request);
    const { code, type, value, minOrderAmount, maxUses, expiresAt } = await request.json();

    const created = await createCoupon({
      sellerId: uid,
      code,
      type,
      value,
      minOrderAmount,
      maxUses,
      expiresAt,
    });

    return ok(created);
  } catch (error) {
    return fail(error, 400);
  }
}
