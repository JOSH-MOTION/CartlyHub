import { findAbandonedCarts } from '@/services/marketplace/cart-service';
import { enqueueMany, processEmailQueue } from '@/services/marketplace/email-queue-service';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Vercel Cron target — see vercel.json. Vercel signs cron requests with
 * CRON_SECRET automatically (Authorization: Bearer <CRON_SECRET>); this just
 * checks it matches, so the endpoint can't be triggered by anyone else who
 * finds the URL.
 *
 * Enqueues rather than sending directly — see email-queue-service.js for
 * why (a shared 70/day budget across every non-transactional email type).
 * `markCartReminded` only fires once the send actually happens, which the
 * queue processor's `afterSent` hook handles — not here at enqueue time.
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

    const queued = await enqueueMany(
      'abandoned_cart',
      carts.map((cart) => ({
        email: cart.email,
        name: cart.name,
        items: cart.items,
        userId: cart.userId,
      })),
    );

    const result = await processEmailQueue();

    return ok({ scanned: carts.length, queued, ...result });
  } catch (error) {
    return fail(error, 500);
  }
}
