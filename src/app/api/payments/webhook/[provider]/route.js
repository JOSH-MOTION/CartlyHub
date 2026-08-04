import { NextResponse } from 'next/server';
import { getPaymentProvider } from '@/services/payments';
import { WEBHOOK_EVENTS } from '@/services/payments/provider';
import { fulfilPaidOrders } from '@/services/marketplace/order-service';

export const dynamic = 'force-dynamic';

/**
 * Gateway webhook — the safety net for customers who close the tab before the
 * browser callback runs.
 *
 * One route serves every provider: the slug picks the adapter, the adapter
 * checks the signature and normalises the event. Adding Stripe or Flutterwave
 * means adding an adapter, not another endpoint.
 *
 * Point Paystack at:  POST /api/payments/webhook/paystack
 */
export async function POST(request, { params }) {
  const providerId = params?.provider;

  // The signature is computed over the exact bytes sent, so read text, not JSON.
  const rawBody = await request.text();

  let provider;
  try {
    provider = getPaymentProvider(providerId);
  } catch {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 404 });
  }

  if (provider.verifyWebhook && !provider.verifyWebhook(rawBody, request.headers)) {
    console.warn(`[webhook] rejected unsigned ${providerId} payload`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = provider.parseWebhook(rawBody);

  if (event.type !== WEBHOOK_EVENTS.PAYMENT_SUCCEEDED || !event.reference) {
    // Acknowledge anything we do not act on, otherwise the gateway retries.
    return NextResponse.json({ received: true, handled: false });
  }

  try {
    await fulfilPaidOrders(event.reference, { providerId });
  } catch (error) {
    console.error(`[webhook] ${providerId} fulfilment failed`, error);
    // 500 asks the gateway to retry, which is what we want for a transient fault.
    return NextResponse.json({ error: 'Fulfilment failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true, handled: true });
}
