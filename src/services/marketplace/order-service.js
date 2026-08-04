import {
  db,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  query,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from '../../lib/firestore-server';
import {
  acceptsOnlinePayments,
  acceptsWhatsappOrders,
  COLLECTIONS,
  DEFAULT_CURRENCY,
  ORDER_CHANNELS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  SELLING_MODES,
} from './constants';
import { getMarketplaceSettings } from './settings-service';
import { creditOrderEarnings } from './wallet-service';
import {
  notifyCustomerOfPaidOrder,
  notifyCustomerOfStatusChange,
  notifyVendorOfPaidOrder,
  notifyVendorOfWhatsappOrder,
} from './notification-service';
import { buildOrderWhatsappLink } from './whatsapp';
import {
  sendCustomerOrderEmail,
  sendVendorOrderEmail,
  sendVendorWhatsappOrderEmail,
} from './email-service';
import { getPaymentProvider } from '../payments';
import { round2, splitCommission, toMinor } from '../payments/money';

/**
 * Orders.
 *
 * A single checkout can contain items from several vendors, so it becomes one
 * order per vendor sharing a `groupId`. That keeps commission, wallet credit
 * and vendor dashboards clean, and it is what lets a WhatsApp-only vendor and
 * an online vendor coexist in the same cart.
 *
 * Prices, stock and vendor identity are always re-read from Firestore here —
 * whatever the browser posted is treated as a request, never as a fact.
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const randomSuffix = (length = 5) =>
  Array.from(
    { length },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
  ).join('');

export const generateOrderNumber = () => {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `CH-${stamp}-${randomSuffix()}`;
};

export const generatePaymentReference = () =>
  `CHP-${Date.now().toString(36).toUpperCase()}-${randomSuffix(4)}`;

/** Products listed by Cartly Hub itself rather than by a vendor. */
const HOUSE_VENDOR = {
  id: 'cartly-hub',
  storeName: 'Cartly Hub',
  sellingMode: SELLING_MODES.ONLINE,
  whatsappNumber: null,
  isPlatform: true,
};

const loadVendor = async (vendorId, cache) => {
  if (!vendorId) return HOUSE_VENDOR;
  if (cache.has(vendorId)) return cache.get(vendorId);

  const snap = await getDoc(doc(db, COLLECTIONS.SELLERS, vendorId));
  const vendor = snap.exists()
    ? { id: snap.id, ...snap.data() }
    : { ...HOUSE_VENDOR, id: vendorId };

  cache.set(vendorId, vendor);
  return vendor;
};

const findVariant = (product, variantId) => {
  const variants = product.variants || [];
  if (!variants.length) return null;
  const index = variants.findIndex((variant) => variant.id === variantId);
  return index === -1
    ? { variant: variants[0], index: 0 }
    : { variant: variants[index], index };
};

/**
 * Turns a client cart into authoritative per-vendor groups.
 * Throws if a product is missing, inactive or out of stock.
 */
export const buildOrderGroups = async (cartItems) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Your cart is empty');
  }

  const vendorCache = new Map();
  const groups = new Map();

  for (const raw of cartItems) {
    const productId = raw.productId || raw.product?.id;
    const variantId = raw.variantId || raw.variant?.id;
    const quantity = Math.max(1, Math.floor(Number(raw.quantity) || 1));

    if (!productId) throw new Error('A cart item is missing its product');

    const productSnap = await getDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    if (!productSnap.exists()) throw new Error('A product in your cart no longer exists');

    const product = { id: productSnap.id, ...productSnap.data() };
    if (product.isActive === false) {
      throw new Error(`${product.name} is no longer available`);
    }

    const match = findVariant(product, variantId);
    if (!match) throw new Error(`${product.name} has no purchasable option`);

    const { variant, index } = match;
    const available = Number(variant.stock ?? 0);
    if (available < quantity) {
      throw new Error(
        `Only ${available} left of ${product.name}${variant.size ? ` (${variant.size})` : ''}`,
      );
    }

    // `price` is always the payable amount, discounted or not, so commission
    // and wallet credit need no discount awareness. `compareAtPrice` is kept
    // only as a record of what the item normally sells for.
    const unitPrice = round2(Number(variant.price || product.basePrice || 0));
    if (unitPrice <= 0) throw new Error(`${product.name} is not priced correctly`);

    const listPrice = Number(variant.compareAtPrice || product.compareAtPrice || 0);
    const compareAtPrice = listPrice > unitPrice ? round2(listPrice) : null;

    const vendor = await loadVendor(product.sellerId, vendorCache);
    if (vendor.isSuspended) {
      throw new Error(`${vendor.storeName || 'This vendor'} is not accepting orders right now`);
    }

    const item = {
      productId: product.id,
      productName: product.name || 'Item',
      productImage: variant.images?.[0] || product.images?.[0] || null,
      variantId: variant.id || null,
      variantIndex: index,
      quantity,
      price: unitPrice,
      compareAtPrice,
      savedAmount: compareAtPrice ? round2((compareAtPrice - unitPrice) * quantity) : 0,
      lineTotal: round2(unitPrice * quantity),
      selections: raw.selections || [],
      variantInfo: {
        size: variant.size || null,
        color: variant.colorName || variant.color || null,
        hexColor: variant.hexColor || null,
      },
    };

    const key = vendor.id;
    if (!groups.has(key)) {
      groups.set(key, {
        vendor,
        vendorId: vendor.id,
        vendorStoreName: vendor.storeName || 'Cartly Hub',
        vendorWhatsapp: vendor.whatsappNumber || null,
        // Captured at order time so fulfilment can email the vendor without
        // a second lookup, and so the address is the one they had then.
        vendorEmail: vendor.contactEmail || vendor.email || null,
        supportsOnline: vendor.isPlatform ? true : acceptsOnlinePayments(vendor),
        supportsWhatsapp: acceptsWhatsappOrders(vendor),
        items: [],
        subtotal: 0,
      });
    }

    const group = groups.get(key);
    group.items.push(item);
    group.subtotal = round2(group.subtotal + item.lineTotal);
  }

  return Array.from(groups.values());
};

const estimateDelivery = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 3));
  return date;
};

const buildOrderDocument = ({
  group,
  channel,
  customer,
  delivery,
  groupId,
  settings,
  paymentReference,
}) => {
  const { commissionRate, commissionAmount, vendorEarnings } = splitCommission(
    group.subtotal,
    group.vendor.isPlatform ? 100 : settings.commissionPercent,
  );

  const estimatedDeliveryAt = estimateDelivery(settings.estimatedDeliveryDays);

  return {
    orderNumber: generateOrderNumber(),
    groupId,
    channel,

    vendorId: group.vendorId,
    vendorStoreName: group.vendorStoreName,
    vendorWhatsapp: group.vendorWhatsapp,
    vendorEmail: group.vendorEmail || null,

    customerId: customer.id || null,
    customerName: customer.name || null,
    customerEmail: customer.email || null,
    customerPhone: customer.phone || null,

    deliveryAddress: {
      city: delivery?.city || null,
      details: delivery?.details || null,
      region: delivery?.region || null,
    },
    deliveryNotes: delivery?.notes || null,

    items: group.items,
    subtotal: group.subtotal,
    deliveryFee: 0,
    totalAmount: group.subtotal,
    currency: settings.currency || DEFAULT_CURRENCY,

    commissionRate,
    commissionAmount,
    vendorEarnings,

    status:
      channel === ORDER_CHANNELS.ONLINE
        ? ORDER_STATUS.AWAITING_PAYMENT
        : ORDER_STATUS.AWAITING_VENDOR,
    paymentStatus:
      channel === ORDER_CHANNELS.ONLINE ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.UNPAID,
    payment:
      channel === ORDER_CHANNELS.ONLINE
        ? { provider: settings.activePaymentProvider, reference: paymentReference }
        : { provider: null, reference: null },

    stockDeducted: false,
    walletCredited: false,

    estimatedDeliveryAt: Timestamp.fromDate(estimatedDeliveryAt),
    statusHistory: [
      {
        status:
          channel === ORDER_CHANNELS.ONLINE
            ? ORDER_STATUS.AWAITING_PAYMENT
            : ORDER_STATUS.AWAITING_VENDOR,
        at: new Date().toISOString(),
        note: channel === ORDER_CHANNELS.ONLINE ? 'Checkout started' : 'Order sent to vendor on WhatsApp',
      },
    ],

    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
};

const hydrate = (id, data) => ({
  id,
  ...data,
  createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
  updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
  estimatedDeliveryAt: data.estimatedDeliveryAt?.toDate
    ? data.estimatedDeliveryAt.toDate()
    : null,
  paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : null,
});

/**
 * WhatsApp order: saved in Cartly Hub first, then handed to WhatsApp.
 * The vendor sees it in their dashboard and gets an in-app notification even
 * if the customer never presses send.
 */
export const createWhatsappOrder = async ({ group, customer, delivery, groupId }) => {
  if (!group.supportsWhatsapp) {
    throw new Error(`${group.vendorStoreName} is not set up for WhatsApp orders`);
  }

  const settings = await getMarketplaceSettings();
  const payload = buildOrderDocument({
    group,
    channel: ORDER_CHANNELS.WHATSAPP,
    customer,
    delivery,
    groupId,
    settings,
    paymentReference: null,
  });

  const ref = await addDoc(collection(db, COLLECTIONS.ORDERS), payload);
  const order = hydrate(ref.id, payload);

  await notifyVendorOfWhatsappOrder(order);

  if (order.vendorEmail) {
    await sendVendorWhatsappOrderEmail(order, order.vendorEmail).catch((error) =>
      console.error('[orders] WhatsApp order email failed', error),
    );
  }

  return { order, whatsappUrl: buildOrderWhatsappLink(order) };
};

/**
 * Online checkout: creates the awaiting-payment orders and asks the configured
 * provider for a checkout session. Nothing is fulfilled until the payment is
 * verified server-side.
 */
export const startOnlineCheckout = async ({ groups, customer, delivery, callbackUrl }) => {
  const payable = groups.filter((group) => group.supportsOnline);
  if (!payable.length) {
    throw new Error('None of the vendors in your cart accept online payments');
  }

  const settings = await getMarketplaceSettings();
  const provider = getPaymentProvider(settings.activePaymentProvider);
  const groupId = generatePaymentReference();
  const reference = groupId;

  const created = [];
  for (const group of payable) {
    const payload = buildOrderDocument({
      group,
      channel: ORDER_CHANNELS.ONLINE,
      customer,
      delivery,
      groupId,
      settings,
      paymentReference: reference,
    });
    const ref = await addDoc(collection(db, COLLECTIONS.ORDERS), payload);
    created.push(hydrate(ref.id, payload));
  }

  const totalAmount = round2(
    created.reduce((total, order) => total + Number(order.totalAmount || 0), 0),
  );

  // Audit record for the payment attempt, independent of the orders.
  await setDoc(doc(db, COLLECTIONS.PAYMENTS, reference), {
    reference,
    provider: provider.id,
    amount: totalAmount,
    currency: settings.currency || DEFAULT_CURRENCY,
    status: PAYMENT_STATUS.PENDING,
    groupId,
    orderIds: created.map((order) => order.id),
    orderNumbers: created.map((order) => order.orderNumber),
    customerId: customer.id || null,
    customerEmail: customer.email || null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const session = await provider.initialize({
    reference,
    amount: totalAmount,
    currency: settings.currency || DEFAULT_CURRENCY,
    email: customer.email,
    callbackUrl,
    metadata: {
      groupId,
      orderNumbers: created.map((order) => order.orderNumber).join(', '),
      customerName: customer.name || null,
      customerPhone: customer.phone || null,
    },
  });

  return { orders: created, reference, totalAmount, session, provider: provider.id };
};

/** Deducts stock for one order. Guarded by the order's own stockDeducted flag. */
const deductStockForOrder = async (order) => {
  for (const item of order.items || []) {
    const productRef = doc(db, COLLECTIONS.PRODUCTS, item.productId);
    const snap = await getDoc(productRef);
    if (!snap.exists()) continue;

    const product = snap.data();
    const variants = product.variants || [];

    const index =
      variants.findIndex((variant) => variant.id === item.variantId) !== -1
        ? variants.findIndex((variant) => variant.id === item.variantId)
        : item.variantIndex ?? -1;

    if (index < 0 || !variants[index]) continue;

    const updated = variants.map((variant, position) =>
      position === index
        ? { ...variant, stock: Math.max(0, Number(variant.stock || 0) - Number(item.quantity || 0)) }
        : variant,
    );

    await updateDoc(productRef, { variants: updated, updatedAt: Timestamp.now() });
  }
};

const ordersForReference = async (reference) => {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.ORDERS),
      where('payment.reference', '==', reference),
      fsLimit(50),
    ),
  );
  return snapshot.docs.map((entry) => hydrate(entry.id, entry.data()));
};

/**
 * The one place a payment turns into fulfilled orders.
 *
 * Verifies with the gateway, then per order: marks paid, deducts stock,
 * credits the vendor wallet net of commission, and notifies both sides.
 * Safe to call repeatedly — the verify endpoint, the browser callback and the
 * webhook all land here.
 */
export const fulfilPaidOrders = async (reference, { providerId } = {}) => {
  const settings = await getMarketplaceSettings();
  const provider = getPaymentProvider(providerId || settings.activePaymentProvider);

  const verification = await provider.verify(reference);
  const paymentRef = doc(db, COLLECTIONS.PAYMENTS, reference);
  const paymentSnap = await getDoc(paymentRef);
  const paymentRecord = paymentSnap.exists() ? paymentSnap.data() : null;

  if (!verification.paid) {
    if (paymentSnap.exists()) {
      await updateDoc(paymentRef, {
        status: PAYMENT_STATUS.FAILED,
        gatewayStatus: verification.status,
        updatedAt: Timestamp.now(),
      });
    }
    return { paid: false, verification, orders: [] };
  }

  const orders = await ordersForReference(reference);
  if (!orders.length) {
    throw new Error(`No orders found for payment reference ${reference}`);
  }

  const expectedTotal = round2(
    orders.reduce((total, order) => total + Number(order.totalAmount || 0), 0),
  );

  // Underpayment protection: never fulfil for less than the order is worth.
  if (toMinor(verification.amount) < toMinor(expectedTotal)) {
    await updateDoc(paymentRef, {
      status: PAYMENT_STATUS.FAILED,
      failureReason: 'amount_mismatch',
      amountPaid: verification.amount,
      amountExpected: expectedTotal,
      updatedAt: Timestamp.now(),
    });
    throw new Error(
      `Payment ${reference} was for ${verification.amount} but the orders total ${expectedTotal}`,
    );
  }

  const fulfilled = [];

  for (const order of orders) {
    // Idempotency: a second verify/webhook for the same order does nothing.
    if (order.paymentStatus === PAYMENT_STATUS.PAID && order.walletCredited) {
      fulfilled.push(order);
      continue;
    }

    const paidOrder = {
      ...order,
      status: ORDER_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PAID,
      payment: {
        provider: verification.provider,
        reference: verification.reference,
        transactionId: verification.transactionId,
        channel: verification.channel,
        paidAt: verification.paidAt,
      },
    };

    if (!order.stockDeducted) {
      await deductStockForOrder(order);
    }

    await updateDoc(doc(db, COLLECTIONS.ORDERS, order.id), {
      status: paidOrder.status,
      paymentStatus: paidOrder.paymentStatus,
      payment: paidOrder.payment,
      stockDeducted: true,
      paidAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      statusHistory: [
        ...(order.statusHistory || []),
        {
          status: ORDER_STATUS.CONFIRMED,
          at: new Date().toISOString(),
          note: `Payment confirmed via ${verification.provider}`,
        },
      ],
    });

    // Platform-owned stock has no vendor wallet to credit.
    if (order.vendorId && order.vendorId !== HOUSE_VENDOR.id && !order.walletCredited) {
      await creditOrderEarnings({
        vendorId: order.vendorId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: order.vendorEarnings,
        commissionAmount: order.commissionAmount,
        grossAmount: order.totalAmount,
        currency: order.currency,
      });

      await updateDoc(doc(db, COLLECTIONS.ORDERS, order.id), {
        walletCredited: true,
        updatedAt: Timestamp.now(),
      });
    }

    const notifiable = {
      ...paidOrder,
      estimatedDeliveryLabel: order.estimatedDeliveryAt
        ? order.estimatedDeliveryAt.toLocaleDateString()
        : null,
    };

    if (order.vendorId && order.vendorId !== HOUSE_VENDOR.id) {
      await notifyVendorOfPaidOrder(notifiable);
    }
    if (order.customerId) {
      await notifyCustomerOfPaidOrder(notifiable);
    }

    // Email sits alongside the in-app notification, never instead of it, and
    // is best-effort — the payment has already succeeded, so a mail failure
    // must not surface as a failed order.
    await Promise.all([
      order.vendorEmail && order.vendorId !== HOUSE_VENDOR.id
        ? sendVendorOrderEmail(notifiable, order.vendorEmail)
        : Promise.resolve(),
      order.customerEmail ? sendCustomerOrderEmail(notifiable) : Promise.resolve(),
    ]).catch((error) => console.error('[orders] notification email failed', error));

    fulfilled.push({ ...paidOrder, walletCredited: true, stockDeducted: true });
  }

  await setDoc(
    paymentRef,
    {
      ...(paymentRecord || {}),
      reference,
      provider: verification.provider,
      status: PAYMENT_STATUS.PAID,
      amount: verification.amount,
      currency: verification.currency,
      transactionId: verification.transactionId,
      paidAt: verification.paidAt,
      channel: verification.channel,
      orderIds: fulfilled.map((order) => order.id),
      orderNumbers: fulfilled.map((order) => order.orderNumber),
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );

  return { paid: true, verification, orders: fulfilled };
};

export const getOrderById = async (orderId) => {
  const snap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
  return snap.exists() ? hydrate(snap.id, snap.data()) : null;
};

export const getOrderByNumber = async (orderNumber) => {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.ORDERS),
      where('orderNumber', '==', orderNumber),
      fsLimit(1),
    ),
  );
  if (snapshot.empty) return null;
  const entry = snapshot.docs[0];
  return hydrate(entry.id, entry.data());
};

export const getOrdersByGroup = async (groupId) => {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.ORDERS), where('groupId', '==', groupId), fsLimit(50)),
  );
  return snapshot.docs.map((entry) => hydrate(entry.id, entry.data()));
};

/** Vendor moves an order along; the customer is told about it. */
export const updateOrderStatus = async (orderId, status, { actorId, note } = {}) => {
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');

  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw new Error(`Unknown order status: ${status}`);
  }

  await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
    status,
    updatedAt: Timestamp.now(),
    statusHistory: [
      ...(order.statusHistory || []),
      { status, at: new Date().toISOString(), note: note || null, actorId: actorId || null },
    ],
  });

  if (order.customerId) {
    await notifyCustomerOfStatusChange(order, status);
  }

  return { ...order, status };
};

export { hydrate as hydrateOrder, HOUSE_VENDOR };
