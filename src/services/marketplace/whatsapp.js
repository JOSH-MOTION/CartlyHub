import { formatCurrency } from '../payments/money';

/**
 * WhatsApp deep links.
 *
 * wa.me needs a bare international number: no +, spaces or dashes. Ghanaian
 * vendors often save their number as 024… so we normalise a leading 0 to the
 * country code.
 */
export const normaliseWhatsappNumber = (raw, defaultCountryCode = '233') => {
  if (!raw) return null;

  let digits = String(raw).replace(/[^\d+]/g, '');

  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `${defaultCountryCode}${digits.slice(1)}`;

  return digits.length >= 8 ? digits : null;
};

export const buildWhatsappLink = (number, message) => {
  const target = normaliseWhatsappNumber(number);
  if (!target) return null;
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
};

const describeItem = (item) => {
  const parts = [`🛍 ${item.productName || 'Item'}`];
  if (item.variantInfo?.size) parts.push(`📏 Size: ${item.variantInfo.size}`);
  if (item.variantInfo?.color) parts.push(`🎨 Colour: ${item.variantInfo.color}`);
  parts.push(`📦 Qty: ${item.quantity}`);
  parts.push(`💵 ${formatCurrency(Number(item.price || 0) * Number(item.quantity || 1))}`);
  return parts.join('\n');
};

/** The pre-filled message a customer sends when ordering on WhatsApp. */
export const buildOrderMessage = (order) => {
  const items = (order.items || []).map(describeItem).join('\n\n');
  const address = [order.deliveryAddress?.city, order.deliveryAddress?.details]
    .filter(Boolean)
    .join(', ');

  return [
    `Hello ${order.vendorStoreName || 'there'} 👋`,
    '',
    `I placed an order on Cartly Hub.`,
    '',
    `🧾 Order number: ${order.orderNumber}`,
    `👤 Name: ${order.customerName || '—'}`,
    order.customerPhone ? `📞 Phone: ${order.customerPhone}` : null,
    address ? `📍 Delivery: ${address}` : null,
    '',
    'Items:',
    items,
    '',
    `💰 Order total: ${formatCurrency(order.totalAmount, order.currency)}`,
    '',
    'Please confirm availability and the delivery fee. Thank you!',
  ]
    .filter((line) => line !== null)
    .join('\n');
};

/** Shorter message for the "Chat with vendor" button on an existing order. */
export const buildOrderEnquiryMessage = (order) =>
  [
    `Hello ${order.vendorStoreName || 'there'} 👋`,
    '',
    `I'd like to ask about my Cartly Hub order ${order.orderNumber}.`,
    order.customerName ? `My name is ${order.customerName}.` : null,
  ]
    .filter(Boolean)
    .join('\n');

export const buildOrderWhatsappLink = (order) =>
  buildWhatsappLink(order.vendorWhatsapp, buildOrderMessage(order));

export const buildEnquiryWhatsappLink = (order) =>
  buildWhatsappLink(order.vendorWhatsapp, buildOrderEnquiryMessage(order));
