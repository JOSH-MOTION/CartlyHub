import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { formatCurrency } from '../payments/money';

/**
 * Transactional email for paid orders.
 *
 * Sits alongside the in-app notifications rather than replacing them — a
 * vendor gets the bell badge *and* the email, because most vendors are not
 * sitting in the dashboard when an order lands.
 *
 * Every function here is best-effort. A mail failure must never roll back a
 * payment that already succeeded, so callers get `{ sent, error }` back
 * instead of an exception.
 */

const FROM_NAME = 'Cartly Hub';
const LOGO_CID = 'cartlyhub-logo';

/**
 * The logo is embedded as a CID attachment rather than a hosted <img src>,
 * because most mail clients block remote images by default — a linked logo
 * would show as a broken box on first open. Read from disk once per process,
 * not once per email.
 */
let logoCache;

const logoAttachment = () => {
  if (logoCache !== undefined) return logoCache;

  try {
    const file = path.join(process.cwd(), 'public', 'cartly logo.png');
    logoCache = fs.existsSync(file)
      ? { filename: 'cartly-hub.png', content: fs.readFileSync(file), cid: LOGO_CID }
      : null;
  } catch (error) {
    console.error('[email] could not read logo', error?.message);
    logoCache = null;
  }

  return logoCache;
};

/**
 * Delivery.
 *
 * Resend is used when RESEND_API_KEY is set, and Gmail SMTP is the fallback.
 *
 * The distinction matters for the inbox, not for volume. Gmail SMTP sends
 * *from a @gmail.com address*, and receiving servers heavily penalise
 * transactional mail from free webmail — it is the classic phishing shape, and
 * nothing signs the mail as genuinely from cartlyhubgh.com. Resend sends from
 * your own verified domain with SPF and DKIM, which is what actually keeps
 * these out of spam.
 */
const usingResend = () => Boolean(process.env.RESEND_API_KEY);

/** e.g. `Cartly Hub <orders@cartlyhubgh.com>` */
const fromAddress = () =>
  process.env.EMAIL_FROM ||
  (usingResend()
    ? `${FROM_NAME} <onboarding@resend.dev>`
    : `"${FROM_NAME}" <${process.env.EMAIL_USER}>`);

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://cartlyhubgh.com').replace(/\/+$/, '');

/**
 * Resend attachments are not addressable by cid, so on that path the logo is
 * loaded from the site over https instead of embedded.
 */
export const logoSrc = () =>
  usingResend() ? `${siteUrl()}/cartly-logo-email.png` : `cid:${LOGO_CID}`;

const sendViaResend = async ({ to, subject, html }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromAddress(), to: [to], subject, html }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.id;
};

const sendViaGmail = async ({ to, subject, html }) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) throw new Error('not configured');

  const mailer = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  const logo = logoAttachment();

  const info = await mailer.sendMail({
    from: fromAddress(),
    to,
    subject,
    html,
    attachments: logo ? [logo] : [],
  });

  return info.messageId;
};

const send = async ({ to, subject, html }) => {
  if (!to) return { sent: false, error: 'no recipient' };

  if (!usingResend() && !process.env.EMAIL_USER) {
    console.warn('[email] no provider configured — skipping', subject);
    return { sent: false, error: 'not configured' };
  }

  try {
    const messageId = usingResend()
      ? await sendViaResend({ to, subject, html })
      : await sendViaGmail({ to, subject, html });

    return { sent: true, messageId };
  } catch (error) {
    console.error('[email] failed to send', subject, error?.message);
    return { sent: false, error: error?.message };
  }
};

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

/**
 * The masthead shows the real logo, with the brand name as the image's alt
 * text and again in the footer — so the email still reads as Cartly Hub even
 * in a client that strips images entirely.
 */
const masthead = () =>
  usingResend() || logoAttachment()
    ? `<img src="${logoSrc()}" alt="Cartly Hub" width="150"
         style="display:block;margin:0 auto;width:150px;max-width:60%;height:auto;border:0;" />`
    : `<p style="margin:0;text-align:center;color:#0f172a;font-size:20px;font-weight:800;letter-spacing:-0.5px;">
         Cartly<span style="color:#2563eb;">Hub</span>
       </p>`;

const shell = (heading, subheading, body) => `
<div style="background:#f8fafc;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#ffffff;padding:28px 28px 20px;border-bottom:1px solid #e2e8f0;">
      ${masthead()}
    </div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;">${heading}</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#64748b;">${subheading}</p>
      ${body}
    </div>
    <div style="padding:18px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0f172a;">Cartly Hub</p>
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        Your Effortless Shop in Ghana · You're receiving this because of activity on your Cartly Hub account.
      </p>
    </div>
  </div>
</div>`;

const row = (label, value, strong) => `
  <tr>
    <td style="padding:8px 0;font-size:12px;color:#64748b;">${label}</td>
    <td style="padding:8px 0;font-size:${strong ? '15px' : '13px'};font-weight:${strong ? '800' : '600'};color:#0f172a;text-align:right;">${value}</td>
  </tr>`;

const itemsTable = (order) => `
  <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
    ${(order.items || [])
      .map(
        (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">
          ${item.productName}
          <span style="display:block;font-size:11px;color:#94a3b8;margin-top:2px;">
            Qty ${item.quantity}${item.variantInfo?.size ? ` · ${item.variantInfo.size}` : ''}${item.variantInfo?.color ? ` · ${item.variantInfo.color}` : ''}
          </span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#0f172a;text-align:right;white-space:nowrap;">
          ${formatCurrency(item.lineTotal ?? item.price * item.quantity, order.currency)}
        </td>
      </tr>`,
      )
      .join('')}
  </table>`;

const button = (href, label) => `
  <a href="${href}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:10px;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">
    ${label}
  </a>`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * New customer: welcome.
 *
 * Deliberately plain — no offers, no marketing. A welcome email is
 * transactional because the person just signed up and expects it, and keeping
 * promotional content out of it is part of why it reaches the inbox.
 */
export const sendWelcomeEmail = async ({ email, name }) => {
  const body = `
    <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">
      Your Cartly Hub account is ready. You can now buy from verified Ghanaian
      sellers, track every order from your account, and save items you like for later.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
      ${row('Signed up with', email)}
    </table>
    ${button(`${siteUrl()}/products`, 'Start shopping')}
    <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
      Selling something? You can open a store from your account at any time.
    </p>`;

  return send({
    to: email,
    subject: 'Welcome to Cartly Hub',
    html: shell(
      `Welcome${name ? `, ${String(name).split(' ')[0]}` : ''}`,
      'Your account is ready',
      body,
    ),
  });
};

/** Vendor: you have a new paid order. */
export const sendVendorOrderEmail = async (order, vendorEmail) => {
  const href = `${siteUrl()}/seller/orders/${order.id}`;

  const body = `
    ${itemsTable(order)}
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
      ${row('Order number', order.orderNumber, true)}
      ${row('Customer', order.customerName || 'Guest')}
      ${row('Phone', order.customerPhone || '—')}
      ${row('Email', order.customerEmail || '—')}
      ${row('Delivery', [order.deliveryAddress?.details, order.deliveryAddress?.city].filter(Boolean).join(', ') || '—')}
      ${row('Amount paid', formatCurrency(order.totalAmount, order.currency))}
      ${row(`Commission (${order.commissionRate || 0}%)`, `− ${formatCurrency(order.commissionAmount, order.currency)}`)}
      ${row('Added to your wallet', formatCurrency(order.vendorEarnings, order.currency), true)}
    </table>
    ${button(href, 'View the order')}`;

  return send({
    to: vendorEmail,
    subject: `New paid order ${order.orderNumber} — ${formatCurrency(order.totalAmount, order.currency)}`,
    html: shell(
      'You have a new paid order',
      `${order.customerName || 'A customer'} has paid. Your earnings are already in your wallet.`,
      body,
    ),
  });
};

/** Customer: payment received, order confirmed. */
export const sendCustomerOrderEmail = async (order) => {
  const href = `${siteUrl()}/orders/${order.orderNumber}`;

  const delivery = order.estimatedDeliveryAt
    ? new Date(order.estimatedDeliveryAt).toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : 'within a few days';

  const body = `
    ${itemsTable(order)}
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
      ${row('Order number', order.orderNumber, true)}
      ${row('Sold by', order.vendorStoreName || 'Cartly Hub')}
      ${row('Total paid', formatCurrency(order.totalAmount, order.currency), true)}
      ${row('Estimated delivery', delivery)}
    </table>
    ${button(href, 'Track your order')}`;

  return send({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} confirmed — thank you`,
    html: shell(
      'Payment successful',
      `Your order from ${order.vendorStoreName || 'Cartly Hub'} is confirmed.`,
      body,
    ),
  });
};

/** Vendor: a WhatsApp order was saved against your store. */
export const sendVendorWhatsappOrderEmail = async (order, vendorEmail) => {
  const href = `${siteUrl()}/seller/orders/${order.id}`;

  const body = `
    ${itemsTable(order)}
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
      ${row('Order number', order.orderNumber, true)}
      ${row('Customer', order.customerName || 'Guest')}
      ${row('Phone', order.customerPhone || '—')}
      ${row('Order total', formatCurrency(order.totalAmount, order.currency), true)}
    </table>
    <p style="margin:0 0 20px;font-size:13px;color:#64748b;line-height:1.6;">
      This order came through WhatsApp, so payment is collected by you directly —
      nothing has been added to your wallet.
    </p>
    ${button(href, 'View the order')}`;

  return send({
    to: vendorEmail,
    subject: `New WhatsApp order ${order.orderNumber}`,
    html: shell(
      'New WhatsApp order',
      `${order.customerName || 'A customer'} placed an order via WhatsApp.`,
      body,
    ),
  });
};
