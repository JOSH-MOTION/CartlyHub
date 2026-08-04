import paystack from './paystack';
import { PaymentError, assertProviderShape } from './provider';

/**
 * Payment provider registry.
 *
 * To add Stripe / Flutterwave / Hubtel later:
 *   1. write src/services/payments/<name>.js exporting the provider contract
 *      described in ./provider.js,
 *   2. add it to the map below.
 *
 * Order, stock, wallet, commission and notification logic stay untouched.
 */
const registry = new Map([[paystack.id, assertProviderShape(paystack)]]);

export const DEFAULT_PROVIDER_ID = 'paystack';

export const registerPaymentProvider = (provider) => {
  registry.set(provider.id, assertProviderShape(provider));
  return provider;
};

export const listPaymentProviders = () =>
  Array.from(registry.values()).map((provider) => ({
    id: provider.id,
    displayName: provider.displayName,
    currencies: provider.currencies || [],
    configured: provider.isConfigured ? provider.isConfigured() : true,
  }));

export const getPaymentProvider = (id = DEFAULT_PROVIDER_ID) => {
  const provider = registry.get(id);
  if (!provider) {
    throw new PaymentError(`Unknown payment provider: ${id}`, {
      code: 'unknown_provider',
      status: 400,
    });
  }
  return provider;
};

export { PaymentError };
export * from './money';
