import {
  listVendorWithdrawals,
  requestWithdrawal,
} from '@/services/marketplace/withdrawal-service';
import { requireVendor } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { uid } = await requireVendor(request);
    return ok({ withdrawals: await listVendorWithdrawals(uid) });
  } catch (error) {
    return fail(error, error?.status || 500);
  }
}

/**
 * Requests a payout to MTN Mobile Money, Telecel Cash, AirtelTigo Money or a
 * bank account. The money leaves the available balance immediately and sits in
 * pending until the platform marks it paid or rejects it.
 */
export async function POST(request) {
  try {
    const { uid, vendor } = await requireVendor(request);
    const { amount, method, destination } = await request.json();

    const withdrawal = await requestWithdrawal({
      vendorId: uid,
      vendorStoreName: vendor.storeName || null,
      amount,
      method,
      destination,
    });

    return ok({ withdrawal });
  } catch (error) {
    return fail(error, 400);
  }
}
