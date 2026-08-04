import {
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
} from '@/services/marketplace/order-service';
import { buildEnquiryWhatsappLink } from '@/services/marketplace/whatsapp';
import { optionalUser, requireUser } from '@/app/api/_lib/auth';
import { ok, fail, badRequest } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

const load = async (id) =>
  id.startsWith('CH-') ? getOrderByNumber(id) : getOrderById(id);

/**
 * Order detail for the confirmation and tracking pages.
 *
 * Accepts either a document id or an order number. A signed-in customer or the
 * vendor sees everything; a guest who has the order number sees a redacted
 * copy so they can still track their order from the confirmation link.
 */
export async function GET(request, { params }) {
  try {
    const order = await load(params.id);
    if (!order) return badRequest('Order not found');

    const user = await optionalUser(request);
    const isOwner = user && (user.uid === order.customerId || user.uid === order.vendorId);
    const isAdmin = user && String(user.role).toUpperCase() === 'ADMIN';

    const chatUrl = order.vendorWhatsapp ? buildEnquiryWhatsappLink(order) : null;

    if (isOwner || isAdmin) {
      return ok({ order: { ...order, chatUrl } });
    }

    return ok({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        channel: order.channel,
        vendorStoreName: order.vendorStoreName,
        items: order.items,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
        currency: order.currency,
        deliveryAddress: order.deliveryAddress,
        estimatedDeliveryAt: order.estimatedDeliveryAt,
        statusHistory: order.statusHistory || [],
        createdAt: order.createdAt,
        customerName: order.customerName,
        chatUrl,
      },
      redacted: true,
    });
  } catch (error) {
    return fail(error, 400);
  }
}

/** Vendors (and admins) move an order through fulfilment. */
export async function PATCH(request, { params }) {
  try {
    const user = await requireUser(request);
    const { status, note } = await request.json();

    const order = await load(params.id);
    if (!order) return badRequest('Order not found');

    const isVendor = user.uid === order.vendorId;
    const isAdmin = String(user.role).toUpperCase() === 'ADMIN';
    if (!isVendor && !isAdmin) return badRequest('You cannot update this order');

    const updated = await updateOrderStatus(order.id, status, {
      actorId: user.uid,
      note,
    });

    return ok({ order: updated });
  } catch (error) {
    return fail(error, 400);
  }
}
