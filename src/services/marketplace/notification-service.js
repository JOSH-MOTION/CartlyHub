import {
  db,
  addDoc,
  collection,
  doc,
  getDocs,
  limit as fsLimit,
  query,
  updateDoc,
  where,
  Timestamp,
} from '../../lib/firestore-server';
import {
  AUDIENCES,
  COLLECTIONS,
  NOTIFICATION_TYPES,
  ORDER_STATUS_LABELS,
} from './constants';
import { formatCurrency } from '../payments/money';

/**
 * In-app notifications. Every notification carries a call-to-action so the
 * bell menu can render a "View order" / "View withdrawal" button without the
 * UI needing to know anything about notification types.
 */
export const createNotification = async ({
  userId,
  audience,
  type,
  title,
  message,
  data,
  ctaLabel,
  ctaHref,
}) => {
  if (!userId) return null;

  const payload = {
    userId,
    audience: audience || AUDIENCES.CUSTOMER,
    type: type || 'generic',
    title,
    message: message || '',
    data: data || {},
    ctaLabel: ctaLabel || null,
    ctaHref: ctaHref || null,
    read: false,
    createdAt: Timestamp.now(),
  };

  const ref = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), payload);
  return { id: ref.id, ...payload };
};

const orderLines = (order) => {
  const count = (order.items || []).reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );
  return `${count} item${count === 1 ? '' : 's'}`;
};

/** Vendor-side "you have a new paid order" notification. */
export const notifyVendorOfPaidOrder = (order) =>
  createNotification({
    userId: order.vendorId,
    audience: AUDIENCES.VENDOR,
    type: NOTIFICATION_TYPES.ORDER_PAID_VENDOR,
    title: 'New paid order',
    message:
      `${order.customerName || 'A customer'} paid ${formatCurrency(order.totalAmount, order.currency)} ` +
      `for order ${order.orderNumber} (${orderLines(order)}). ` +
      `${formatCurrency(order.vendorEarnings, order.currency)} has been added to your wallet.`,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountPaid: order.totalAmount,
      vendorEarnings: order.vendorEarnings,
      commissionAmount: order.commissionAmount,
      customerName: order.customerName || null,
      customerPhone: order.customerPhone || null,
      customerEmail: order.customerEmail || null,
    },
    ctaLabel: 'View order',
    ctaHref: `/seller/orders/${order.id}`,
  });

/** Customer-side payment receipt. */
export const notifyCustomerOfPaidOrder = (order) =>
  createNotification({
    userId: order.customerId,
    audience: AUDIENCES.CUSTOMER,
    type: NOTIFICATION_TYPES.ORDER_PAID_CUSTOMER,
    title: 'Payment successful — order confirmed',
    message:
      `Order ${order.orderNumber} is confirmed. ` +
      `${formatCurrency(order.totalAmount, order.currency)} paid. ` +
      `Estimated delivery ${order.estimatedDeliveryLabel || 'within a few days'}.`,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountPaid: order.totalAmount,
      estimatedDeliveryAt: order.estimatedDeliveryAt || null,
      vendorStoreName: order.vendorStoreName || null,
    },
    ctaLabel: 'View order',
    ctaHref: `/orders/${order.orderNumber}`,
  });

/** Vendor-side "a customer started a WhatsApp order" notification. */
export const notifyVendorOfWhatsappOrder = (order) =>
  createNotification({
    userId: order.vendorId,
    audience: AUDIENCES.VENDOR,
    type: NOTIFICATION_TYPES.ORDER_WHATSAPP_VENDOR,
    title: 'New WhatsApp order',
    message:
      `${order.customerName || 'A customer'} placed order ${order.orderNumber} ` +
      `(${orderLines(order)}, ${formatCurrency(order.totalAmount, order.currency)}) via WhatsApp. ` +
      'Confirm the details in your chat.',
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      customerName: order.customerName || null,
      customerPhone: order.customerPhone || null,
    },
    ctaLabel: 'View order',
    ctaHref: `/seller/orders/${order.id}`,
  });

export const notifyCustomerOfStatusChange = (order, status) =>
  createNotification({
    userId: order.customerId,
    audience: AUDIENCES.CUSTOMER,
    type: NOTIFICATION_TYPES.ORDER_STATUS_CUSTOMER,
    title: `Order ${order.orderNumber} — ${ORDER_STATUS_LABELS[status] || status}`,
    message: `${order.vendorStoreName || 'The vendor'} updated your order status.`,
    data: { orderId: order.id, orderNumber: order.orderNumber, status },
    ctaLabel: 'Track order',
    ctaHref: `/orders/${order.orderNumber}`,
  });

export const listNotifications = async (userId, { limit = 50 } = {}) => {
  if (!userId) return [];

  // Ordering is done in memory so this works without a composite index.
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      fsLimit(200),
    ),
  );

  return snapshot.docs
    .map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
};

export const markNotificationRead = (notificationId) =>
  updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
    read: true,
    readAt: Timestamp.now(),
  });

export const markAllNotificationsRead = async (userId) => {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      where('read', '==', false),
      fsLimit(200),
    ),
  );

  await Promise.all(
    snapshot.docs.map((entry) =>
      updateDoc(entry.ref, { read: true, readAt: Timestamp.now() }),
    ),
  );

  return snapshot.size;
};
