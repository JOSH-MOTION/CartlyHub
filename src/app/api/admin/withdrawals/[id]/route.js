import {
  approveWithdrawal,
  markWithdrawalPaid,
  rejectWithdrawal,
} from '@/services/marketplace/withdrawal-service';
import { requireAdmin } from '@/app/api/_lib/auth';
import { ok, fail, badRequest } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/**
 * Withdrawal review queue.
 *
 *   approve  → vendor is told it is on the way, funds stay held
 *   pay      → funds clear out of pending into lifetime withdrawals
 *   reject   → funds go straight back to the vendor's available balance
 *
 * Automation later means calling `pay` from a payout provider callback
 * instead of from this screen; the wallet accounting does not change.
 */
export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin(request);
    const { action, note, payoutReference } = await request.json();

    switch (action) {
      case 'approve':
        return ok({
          withdrawal: await approveWithdrawal(params.id, { adminId: admin.uid, note }),
        });
      case 'pay':
        return ok({
          withdrawal: await markWithdrawalPaid(params.id, {
            adminId: admin.uid,
            payoutReference,
          }),
        });
      case 'reject':
        return ok({
          withdrawal: await rejectWithdrawal(params.id, { adminId: admin.uid, note }),
        });
      default:
        return badRequest('Action must be approve, pay or reject');
    }
  } catch (error) {
    return fail(error, 400);
  }
}
