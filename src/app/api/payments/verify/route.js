import { fulfilPaidOrders } from '@/services/marketplace/order-service';
import { ok, fail, badRequest } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/**
 * Confirms a payment and fulfils the orders behind it.
 *
 * Idempotent by design: the browser calls this when it returns from the
 * gateway, and the webhook calls the same code path. Whichever arrives first
 * does the work; the second one is a no-op.
 */
export async function POST(request) {
  try {
    const { reference, provider } = await request.json();
    if (!reference) return badRequest('A payment reference is required');

    const result = await fulfilPaidOrders(reference, { providerId: provider });

    if (!result.paid) {
      return ok(
        {
          paid: false,
          status: result.verification.status,
          error: 'This payment has not been completed',
        },
        { status: 402 },
      );
    }

    return ok({
      paid: true,
      reference: result.verification.reference,
      amount: result.verification.amount,
      currency: result.verification.currency,
      orders: result.orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        vendorStoreName: order.vendorStoreName,
        totalAmount: order.totalAmount,
      })),
    });
  } catch (error) {
    return fail(error, 400);
  }
}
