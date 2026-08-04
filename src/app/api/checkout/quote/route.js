import { buildOrderGroups } from '@/services/marketplace/order-service';
import { getMarketplaceSettings } from '@/services/marketplace/settings-service';
import { round2 } from '@/services/payments/money';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/**
 * Server-authoritative view of the cart.
 *
 * The checkout page renders from this, not from localStorage, so prices,
 * stock and each vendor's selling mode are the real ones. It also tells the UI
 * which vendors need a "Pay Now" button and which need "Order on WhatsApp".
 */
export async function POST(request) {
  try {
    const { items } = await request.json();
    const [groups, settings] = await Promise.all([
      buildOrderGroups(items),
      getMarketplaceSettings(),
    ]);

    const payable = groups.filter((group) => group.supportsOnline);
    const whatsappOnly = groups.filter(
      (group) => !group.supportsOnline && group.supportsWhatsapp,
    );
    const unavailable = groups.filter(
      (group) => !group.supportsOnline && !group.supportsWhatsapp,
    );

    return ok({
      currency: settings.currency,
      groups: groups.map((group) => ({
        vendorId: group.vendorId,
        vendorStoreName: group.vendorStoreName,
        supportsOnline: group.supportsOnline,
        supportsWhatsapp: group.supportsWhatsapp,
        items: group.items,
        subtotal: group.subtotal,
      })),
      onlineTotal: round2(
        payable.reduce((total, group) => total + group.subtotal, 0),
      ),
      whatsappTotal: round2(
        whatsappOnly.reduce((total, group) => total + group.subtotal, 0),
      ),
      cartTotal: round2(groups.reduce((total, group) => total + group.subtotal, 0)),
      hasOnline: payable.length > 0,
      hasWhatsapp: whatsappOnly.length > 0,
      unavailableVendors: unavailable.map((group) => group.vendorStoreName),
    });
  } catch (error) {
    return fail(error, 400);
  }
}
