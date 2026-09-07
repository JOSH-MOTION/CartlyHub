import { syncCart } from '@/services/marketplace/cart-service';
import { requireUser } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/**
 * Mirrors a signed-in user's cart server-side, debounced client-side —
 * purely so an abandoned-cart reminder can be sent. Never read at checkout;
 * the real cart stays client-side (useCart.js), same as before this existed.
 */
export async function POST(request) {
  try {
    const user = await requireUser(request);
    const { items } = await request.json();

    await syncCart({
      userId: user.uid,
      email: user.email,
      name: user.name,
      items: (items || []).map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.productName,
        productImage: item.productImage || null,
        price: item.price,
        quantity: item.quantity,
      })),
    });

    return ok({});
  } catch (error) {
    return fail(error, 400);
  }
}
