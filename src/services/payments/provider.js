/**
 * Payment provider contract.
 *
 * Business logic (orders, stock, wallets, notifications) never talks to a
 * gateway directly — it only ever sees the shapes described here. Adding
 * Stripe, Flutterwave or Hubtel means writing one more module that returns
 * these shapes and registering it in ./index.js; nothing else changes.
 *
 * A provider module exports an object with:
 *
 *   id            string   stable slug stored on the order, e.g. 'paystack'
 *   displayName   string   shown to customers
 *   currencies    string[] currencies the provider is configured for
 *   isConfigured()          boolean — are the required secrets present?
 *   initialize(request)     Promise<InitializeResult>
 *   verify(reference)       Promise<VerificationResult>
 *   verifyWebhook(raw, hdr) boolean — is this webhook genuinely from the gateway?
 *   parseWebhook(raw)       WebhookEvent
 *
 * InitializeRequest
 *   { reference, amount, currency, email, callbackUrl, metadata }
 *   `amount` is in major units (e.g. 500.00 GHS).
 *
 * InitializeResult
 *   { provider, reference, authorizationUrl, accessCode, raw }
 *
 * VerificationResult
 *   { provider, reference, paid, status, amount, currency,
 *     transactionId, paidAt, channel, customer, metadata, raw }
 *   `amount` is in major units and is the amount the gateway actually
 *   collected — business logic must trust this over anything the browser sent.
 *
 * WebhookEvent
 *   { type: 'payment.succeeded' | 'payment.failed' | 'unknown', reference, raw }
 */

export class PaymentError extends Error {
  constructor(message, { provider, code, status, raw } = {}) {
    super(message);
    this.name = 'PaymentError';
    this.provider = provider;
    this.code = code || 'payment_error';
    this.status = status || 502;
    this.raw = raw;
  }
}

export const WEBHOOK_EVENTS = {
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  UNKNOWN: 'unknown',
};

/** Throws unless the module looks like a payment provider. */
export const assertProviderShape = (provider) => {
  const required = ['id', 'initialize', 'verify'];
  const missing = required.filter((key) => !provider || !provider[key]);
  if (missing.length) {
    throw new PaymentError(
      `Invalid payment provider, missing: ${missing.join(', ')}`,
      { code: 'invalid_provider', status: 500 },
    );
  }
  return provider;
};
