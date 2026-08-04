/** Shared vocabulary for the marketplace order / payment / wallet flow. */

/** What a vendor chose during onboarding. */
export const SELLING_MODES = {
  WHATSAPP: 'whatsapp',
  ONLINE: 'online',
  BOTH: 'both',
};

export const SELLING_MODE_OPTIONS = [
  {
    value: SELLING_MODES.WHATSAPP,
    label: 'WhatsApp Only',
    summary: 'Customers order by chatting with you. No online payments.',
    requiresWhatsapp: true,
    enablesOnline: false,
  },
  {
    value: SELLING_MODES.ONLINE,
    label: 'Online Payments',
    summary: 'Customers pay Cartly Hub securely. Earnings land in your wallet.',
    requiresWhatsapp: false,
    enablesOnline: true,
  },
  {
    value: SELLING_MODES.BOTH,
    label: 'Both WhatsApp and Online Payments',
    summary: 'Get paid online and keep chatting with customers on WhatsApp.',
    requiresWhatsapp: true,
    enablesOnline: true,
    recommended: true,
  },
];

export const acceptsOnlinePayments = (vendor) => {
  if (!vendor) return false;
  if (vendor.isSuspended) return false;
  const mode = vendor.sellingMode || SELLING_MODES.WHATSAPP;
  return mode === SELLING_MODES.ONLINE || mode === SELLING_MODES.BOTH;
};

export const acceptsWhatsappOrders = (vendor) => {
  if (!vendor) return false;
  if (vendor.isSuspended) return false;
  const mode = vendor.sellingMode || SELLING_MODES.WHATSAPP;
  return (
    Boolean(vendor.whatsappNumber) &&
    (mode === SELLING_MODES.WHATSAPP || mode === SELLING_MODES.BOTH)
  );
};

/** How the order reached us. */
export const ORDER_CHANNELS = {
  ONLINE: 'online',
  WHATSAPP: 'whatsapp',
};

/** Fulfilment state, shown to customer and vendor. */
export const ORDER_STATUS = {
  AWAITING_PAYMENT: 'awaiting_payment',
  AWAITING_VENDOR: 'awaiting_vendor',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.AWAITING_PAYMENT]: 'Awaiting payment',
  [ORDER_STATUS.AWAITING_VENDOR]: 'Awaiting vendor',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
  [ORDER_STATUS.REFUNDED]: 'Refunded',
};

/** Money state, kept separate from fulfilment on purpose. */
export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const WALLET_TRANSACTION_TYPES = {
  EARNING: 'earning',
  WITHDRAWAL_HOLD: 'withdrawal_hold',
  WITHDRAWAL_PAID: 'withdrawal_paid',
  WITHDRAWAL_REVERSAL: 'withdrawal_reversal',
  ADJUSTMENT: 'adjustment',
  REFUND: 'refund',
};

export const WITHDRAWAL_METHODS = [
  { value: 'mtn_momo', label: 'MTN Mobile Money', kind: 'mobile_money' },
  { value: 'telecel_cash', label: 'Telecel Cash', kind: 'mobile_money' },
  { value: 'airteltigo_money', label: 'AirtelTigo Money', kind: 'mobile_money' },
  { value: 'bank_account', label: 'Bank Account', kind: 'bank' },
];

export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  REJECTED: 'rejected',
};

export const NOTIFICATION_TYPES = {
  ORDER_PAID_VENDOR: 'order.paid.vendor',
  ORDER_PAID_CUSTOMER: 'order.paid.customer',
  ORDER_WHATSAPP_VENDOR: 'order.whatsapp.vendor',
  ORDER_STATUS_CUSTOMER: 'order.status.customer',
  WITHDRAWAL_REQUESTED: 'withdrawal.requested',
  WITHDRAWAL_APPROVED: 'withdrawal.approved',
  WITHDRAWAL_REJECTED: 'withdrawal.rejected',
  WITHDRAWAL_PAID: 'withdrawal.paid',
  VENDOR_SUSPENDED: 'vendor.suspended',
  VENDOR_REINSTATED: 'vendor.reinstated',
};

export const AUDIENCES = {
  VENDOR: 'vendor',
  CUSTOMER: 'customer',
  ADMIN: 'admin',
};

export const COLLECTIONS = {
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  WALLETS: 'wallets',
  WALLET_TRANSACTIONS: 'walletTransactions',
  WITHDRAWALS: 'withdrawals',
  NOTIFICATIONS: 'notifications',
  SELLERS: 'sellers',
  PRODUCTS: 'products',
  SETTINGS: 'settings',
};

export const DEFAULT_CURRENCY = 'GHS';
