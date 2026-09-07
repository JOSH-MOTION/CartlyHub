import { findAbandonedCarts, markCartReminded } from '@/services/marketplace/cart-service';
import { sendAbandonedCartEmail } from '@/services/marketplace/email-service';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Vercel Cron target — see vercel.json. Vercel signs cron requests with
 * CRON_SECRET automatically (Authorization: Bearer <CRON_SECRET>); this just
 * checks it matches, so the endpoint can't be triggered by anyone else who
 * finds the URL.
 */
export async function GET(request) {
  try {
    const auth = request.headers.get('authorization');
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return fail(new Error('Unauthorized'), 401);
    }

    const carts = await findAbandonedCarts({
      olderThanMs: TWO_HOURS_MS,
      cooldownMs: THREE_DAYS_MS,
    });

    let sent = 0;
    for (const cart of carts) {
      const result = await sendAbandonedCartEmail({
        email: cart.email,
        name: cart.name,
        items: cart.items,
      });
      if (result.sent) {
        await markCartReminded(cart.userId);
        sent++;
      }
    }

    return ok({ scanned: carts.length, sent });
  } catch (error) {
    return fail(error, 500);
  }
}
