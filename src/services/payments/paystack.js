import crypto from 'crypto';
import { PaymentError, WEBHOOK_EVENTS } from './provider';
import { fromMinor, toMinor } from './money';

/**
 * Paystack provider.
 *
 * Cartly Hub runs ONE central Paystack account. Customers always pay Cartly
 * Hub; vendors are settled from their Cartly Hub wallet. That is why there is
 * no subaccount/split configuration here — it is deliberate, not missing.
 */

const API_BASE = 'https://api.paystack.co';

const secretKey = () => process.env.PAYSTACK_SECRET_KEY;

const authHeaders = () => {
  const key = secretKey();
  if (!key) {
    throw new PaymentError('Paystack is not configured — set PAYSTACK_SECRET_KEY', {
      provider: 'paystack',
      code: 'provider_not_configured',
      status: 500,
    });
  }
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
};

const request = async (path, init = {}) => {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: authHeaders(),
      cache: 'no-store',
    });
  } catch (error) {
    throw new PaymentError('Could not reach Paystack', {
      provider: 'paystack',
      code: 'network_error',
      raw: error?.message,
    });
  }

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.status) {
    throw new PaymentError(body?.message || 'Paystack request failed', {
      provider: 'paystack',
      code: 'gateway_error',
      status: response.status === 401 ? 500 : 502,
      raw: body,
    });
  }

  return body.data;
};

const paystackProvider = {
  id: 'paystack',
  displayName: 'Paystack',
  currencies: ['GHS', 'NGN', 'USD'],

  isConfigured() {
    return Boolean(secretKey());
  },

  async initialize({ reference, amount, currency = 'GHS', email, callbackUrl, metadata }) {
    if (!email) {
      throw new PaymentError('A customer email is required to start a payment', {
        provider: 'paystack',
        code: 'email_required',
        status: 400,
      });
    }

    const data = await request('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount: toMinor(amount),
        currency,
        reference,
        callback_url: callbackUrl,
        metadata: metadata || {},
      }),
    });

    return {
      provider: this.id,
      reference: data.reference || reference,
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      raw: data,
    };
  },

  async verify(reference) {
    const data = await request(`/transaction/verify/${encodeURIComponent(reference)}`);

    return {
      provider: this.id,
      reference: data.reference,
      paid: data.status === 'success',
      status: data.status,
      amount: fromMinor(data.amount),
      currency: data.currency,
      transactionId: data.id != null ? String(data.id) : null,
      paidAt: data.paid_at || data.paidAt || null,
      channel: data.channel || null,
      customer: {
        email: data.customer?.email || null,
        name:
          [data.customer?.first_name, data.customer?.last_name]
            .filter(Boolean)
            .join(' ') || null,
        phone: data.customer?.phone || null,
      },
      metadata: data.metadata || {},
      raw: data,
    };
  },

  /** Paystack signs the raw request body with HMAC-SHA512 using the secret key. */
  verifyWebhook(rawBody, headers) {
    const signature =
      headers?.['x-paystack-signature'] ||
      (typeof headers?.get === 'function' ? headers.get('x-paystack-signature') : null);

    if (!signature) return false;

    const expected = crypto
      .createHmac('sha512', secretKey() || '')
      .update(rawBody, 'utf8')
      .digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  },

  parseWebhook(rawBody) {
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { type: WEBHOOK_EVENTS.UNKNOWN, reference: null, raw: rawBody };
    }

    const reference = payload?.data?.reference || null;

    const type =
      payload?.event === 'charge.success'
        ? WEBHOOK_EVENTS.PAYMENT_SUCCEEDED
        : payload?.event === 'charge.failed'
          ? WEBHOOK_EVENTS.PAYMENT_FAILED
          : WEBHOOK_EVENTS.UNKNOWN;

    return { type, reference, raw: payload };
  },
};

export default paystackProvider;
