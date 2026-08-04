/**
 * Marketplace domain services.
 *
 * Layering, outermost first:
 *
 *   app/api/*              HTTP, auth checks, request shapes
 *   services/marketplace   business rules — orders, stock, commission,
 *                          wallets, withdrawals, notifications
 *   services/payments      gateway adapters (Paystack today, others later)
 *
 * Business rules never import a gateway module directly; they ask
 * services/payments for the configured provider. That is what makes adding
 * Stripe / Flutterwave / Hubtel a drop-in change.
 */

export * from './constants';
export * from './selling-preferences';
export * from './settings-service';
export * from './notification-service';
export * from './wallet-service';
export * from './withdrawal-service';
export * from './vendor-service';
export * from './order-service';
export * from './whatsapp';
