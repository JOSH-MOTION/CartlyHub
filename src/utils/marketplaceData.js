import {
  collection,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/services/marketplace/constants';

/**
 * Read-only Firestore helpers for the dashboards.
 *
 * Anything that *moves money* goes through the API (src/utils/apiClient) so it
 * runs inside the marketplace services. These are just listings.
 *
 * Sorting is done in memory rather than with orderBy so none of these queries
 * need a composite index to be created first.
 */

const hydrateOrder = (entry) => {
  const data = entry.data();
  const toDate = (value) =>
    value?.toDate ? value.toDate() : value ? new Date(value) : null;

  return {
    id: entry.id,
    ...data,
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt),
    paidAt: toDate(data.paidAt),
    estimatedDeliveryAt: toDate(data.estimatedDeliveryAt),
  };
};

const newestFirst = (a, b) => b.createdAt - a.createdAt;

export const getVendorOrders = async (vendorId) => {
  if (!vendorId) return [];
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.ORDERS), where('vendorId', '==', vendorId)),
  );
  return snapshot.docs.map(hydrateOrder).sort(newestFirst);
};

export const getCustomerOrders = async (customerId) => {
  if (!customerId) return [];
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.ORDERS), where('customerId', '==', customerId)),
  );
  return snapshot.docs.map(hydrateOrder).sort(newestFirst);
};

export const getAllOrders = async () => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
  return snapshot.docs.map(hydrateOrder).sort(newestFirst);
};

export const getAllPayments = async () => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
  return snapshot.docs
    .map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    })
    .sort(newestFirst);
};

/** Aggregates a vendor's paid orders into a customer list. */
export const getVendorCustomers = async (vendorId) => {
  const orders = await getVendorOrders(vendorId);
  const customers = new Map();

  for (const order of orders) {
    const key = order.customerPhone || order.customerEmail || order.customerName || order.id;
    if (!customers.has(key)) {
      customers.set(key, {
        id: key,
        name: order.customerName || 'Guest',
        phone: order.customerPhone || null,
        email: order.customerEmail || null,
        orderCount: 0,
        totalSpend: 0,
        lastOrderAt: order.createdAt,
      });
    }

    const customer = customers.get(key);
    customer.orderCount += 1;
    if (order.paymentStatus === 'paid') {
      customer.totalSpend += Number(order.totalAmount || 0);
    }
    if (order.createdAt > customer.lastOrderAt) customer.lastOrderAt = order.createdAt;
  }

  return Array.from(customers.values()).sort((a, b) => b.totalSpend - a.totalSpend);
};

/** Live notification feed for the bell menu. */
export const subscribeToNotifications = (userId, callback) => {
  if (!userId) return () => {};

  return onSnapshot(
    query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      fsLimit(100),
    ),
    (snapshot) => {
      const notifications = snapshot.docs
        .map((entry) => {
          const data = entry.data();
          return {
            id: entry.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          };
        })
        .sort(newestFirst);

      callback(notifications);
    },
    (error) => console.error('Notification stream error:', error),
  );
};
