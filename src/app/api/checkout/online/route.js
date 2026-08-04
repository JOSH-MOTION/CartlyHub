import {
  buildOrderGroups,
  startOnlineCheckout,
} from '@/services/marketplace/order-service';
import { optionalUser } from '@/app/api/_lib/auth';
import { ok, fail, badRequest } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/**
 * Starts an online payment.
 *
 * Customers always pay Cartly Hub's central Paystack account — no vendor
 * subaccounts, no split settlement. Vendors are paid from their wallet.
 * Orders are created here in `awaiting_payment`; nothing is fulfilled until
 * /api/payments/verify confirms the money with the gateway.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { items, customer = {}, delivery = {} } = body;

    if (!customer.email) return badRequest('An email address is required to pay online');
    if (!customer.name) return badRequest('Please tell us who the order is for');
    if (!customer.phone) return badRequest('A phone number is required for delivery');

    const user = await optionalUser(request);

    const groups = await buildOrderGroups(items);
    if (!groups.some((group) => group.supportsOnline)) {
      return badRequest(
        'None of the vendors in your cart accept online payments. Use the WhatsApp option instead.',
      );
    }

    const origin = new URL(request.url).origin;

    const result = await startOnlineCheckout({
      groups,
      customer: {
        id: user?.uid || null,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      delivery,
      callbackUrl: `${origin}/checkout/confirm`,
    });

    return ok({
      reference: result.reference,
      provider: result.provider,
      totalAmount: result.totalAmount,
      authorizationUrl: result.session.authorizationUrl,
      accessCode: result.session.accessCode,
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
