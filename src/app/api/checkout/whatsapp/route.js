import {
  buildOrderGroups,
  createWhatsappOrder,
  generatePaymentReference,
} from '@/services/marketplace/order-service';
import { optionalUser } from '@/app/api/_lib/auth';
import { ok, fail, badRequest } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/**
 * WhatsApp order.
 *
 * The order is saved in Cartly Hub *first* — it shows up in the vendor's
 * dashboard and fires an in-app notification whether or not the customer
 * actually sends the chat message. The response carries the wa.me link with
 * the order details pre-filled for the browser to open.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { items, vendorId, customer = {}, delivery = {} } = body;

    if (!vendorId) return badRequest('Which vendor is this order for?');
    if (!customer.name) return badRequest('Please tell us who the order is for');
    if (!customer.phone) return badRequest('A phone number is required so the vendor can reply');

    const user = await optionalUser(request);

    const groups = await buildOrderGroups(items);
    const group = groups.find((entry) => entry.vendorId === vendorId);

    if (!group) return badRequest('That vendor has no items in your cart');
    if (!group.supportsWhatsapp) {
      return badRequest(`${group.vendorStoreName} is not accepting WhatsApp orders`);
    }

    const { order, whatsappUrl } = await createWhatsappOrder({
      group,
      groupId: generatePaymentReference(),
      customer: {
        id: user?.uid || null,
        name: customer.name,
        email: customer.email || user?.email || null,
        phone: customer.phone,
      },
      delivery,
    });

    return ok({
      whatsappUrl,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        vendorStoreName: order.vendorStoreName,
        totalAmount: order.totalAmount,
        currency: order.currency,
      },
    });
  } catch (error) {
    return fail(error, 400);
  }
}
