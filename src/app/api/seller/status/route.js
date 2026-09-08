import { createStatus, listSellerStatuses } from '@/services/marketplace/status-service';
import { requireVendor } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { uid } = await requireVendor(request);
    const statuses = await listSellerStatuses(uid);
    return ok({ statuses });
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request) {
  try {
    const { uid, vendor } = await requireVendor(request);
    const { image, imagePublicId, caption, price } = await request.json();

    const created = await createStatus({
      sellerId: uid,
      storeName: vendor.storeName,
      storeLogo: vendor.storeLogo || null,
      whatsappNumber: vendor.whatsappNumber || null,
      sellerEmail: vendor.contactEmail || null,
      image,
      imagePublicId,
      caption,
      price,
    });

    return ok(created);
  } catch (error) {
    return fail(error, 400);
  }
}
