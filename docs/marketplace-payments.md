# Cartly Hub — payments, orders and vendor wallets

How money moves through the marketplace, and where to change things.

## The shape of it

```
src/app/api/*                    HTTP: auth, request shapes, error envelopes
  └── src/services/marketplace   business rules: orders, stock, commission,
                                 wallets, withdrawals, notifications
        └── src/services/payments gateway adapters (Paystack today)
```

Business rules never import a gateway. They ask `services/payments` for the
configured provider and work with normalised results. That is the whole point
of the split: adding Stripe, Flutterwave or Hubtel touches one new file and one
line of the registry, and nothing about orders, stock, commission or wallets
changes.

## Vendor selling modes

Set during onboarding and editable in Store Settings. Validated in one place —
`services/marketplace/selling-preferences.js` — which onboarding, settings and
the API all call.

| Mode | WhatsApp number | Online payments | Customer sees |
| --- | --- | --- | --- |
| `whatsapp` | required | no | **Order on WhatsApp** |
| `online` | optional | yes | **Pay Now** |
| `both` (recommended) | required | yes | **Pay Now** + chat link on the order |

A suspended vendor drops out of checkout entirely, whatever their mode.

## Online payments

Cartly Hub runs **one central Paystack account**. Customers always pay Cartly
Hub. There are no vendor subaccounts and no split settlement — vendors are paid
from their Cartly Hub wallet.

1. `POST /api/checkout/quote` re-prices the cart from Firestore and groups it by
   vendor. Nothing the browser holds is trusted.
2. `POST /api/checkout/online` creates one `awaiting_payment` order per vendor
   (sharing a `groupId` and a payment reference), writes a `payments` audit
   record, and asks the provider for a checkout session.
3. The customer pays and returns to `/checkout/confirm`, which calls
   `POST /api/payments/verify`.
4. `fulfilPaidOrders()` verifies with the gateway and then, per order: marks it
   paid, deducts stock, credits the vendor wallet net of commission, and
   notifies both the vendor and the customer.

`POST /api/payments/webhook/paystack` runs the exact same code path, so a
customer who closes the tab still gets their order. Both routes are idempotent
— whichever arrives first does the work.

Two protections worth knowing about:

- **Underpayment.** If the gateway reports less than the orders total, the
  payment is marked failed and nothing is fulfilled.
- **Double fulfilment.** An order that is already `paid` and `walletCredited` is
  skipped, and wallet credits are keyed on `orderId`.

## WhatsApp orders

`POST /api/checkout/whatsapp` saves the order in Firestore **first**, fires the
vendor's in-app notification, and only then returns a `wa.me` link with the
order details pre-filled. The vendor sees the order in their dashboard whether
or not the customer ever presses send.

Customers are **never** redirected to WhatsApp after a successful online
payment. They get the confirmation page, and — if the vendor enabled WhatsApp —
an optional "Chat with vendor" button on the order page.

## Commission and wallets

```
Customer pays        GHS 500.00
Commission (5%)      GHS  25.00   → Cartly Hub
Vendor wallet        GHS 475.00   → available balance
```

The rate comes from `settings/marketplace` and is **stamped onto each order at
creation**, so changing it never rewrites a vendor's past earnings. Commission
is computed in minor units and the vendor gets the remainder, so the two always
add back to exactly what was paid.

Wallet fields: `availableBalance`, `pendingBalance`, `totalEarnings`,
`totalWithdrawals`. Every mutation runs inside a Firestore transaction and
writes a `walletTransactions` ledger row with the balance after it.

## Withdrawals

MTN Mobile Money, Telecel Cash, AirtelTigo Money, or a bank account.

```
request  → available −X, pending +X      (vendor cannot request it twice)
approve  → vendor notified, funds stay held
pay      → pending −X, totalWithdrawals +X
reject   → pending −X, available +X
```

Reviewed by the platform at `/admin/withdrawals`. Automating it later means
calling the same `markWithdrawalPaid()` from a payout provider callback instead
of from that screen — `autoProcessWithdrawals` in marketplace settings is the
flag for it. The accounting does not change.

## Data model

| Collection | Holds |
| --- | --- |
| `orders` | one per vendor per checkout; `groupId` ties a multi-vendor checkout together |
| `payments` | one per online checkout attempt, keyed by reference |
| `wallets` | one per vendor, doc id = vendor uid |
| `walletTransactions` | append-only ledger |
| `withdrawals` | payout requests and their review state |
| `notifications` | in-app feed for vendors and customers |
| `sellers` | vendor profile, including selling mode and suspension |
| `settings/marketplace` | commission, minimum withdrawal, active provider |

## Environment variables

| Variable | Needed for |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | **required** — server-side Firestore writes (see below) |
| `PAYSTACK_SECRET_KEY` | initialising and verifying payments, webhook signatures |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | already present; also used to verify ID tokens server-side |

Point the Paystack dashboard webhook at
`https://<your-domain>/api/payments/webhook/paystack`.

### Email delivery, and why mail lands in spam

`src/services/marketplace/email-service.js` sends through **Resend** when
`RESEND_API_KEY` is set, and falls back to Gmail SMTP otherwise.

Gmail SMTP is why mail goes to spam. It sends *from a `@gmail.com` address*,
and receiving servers penalise transactional mail from free webmail heavily —
it is the shape phishing takes, and nothing in the message proves it came from
cartlyhubgh.com. No amount of template work fixes that; the From domain is the
problem.

To fix it:

1. Create a Resend account and add `cartlyhubgh.com` as a domain.
2. Add the DNS records Resend gives you — an **SPF** TXT record and a **DKIM**
   CNAME/TXT record — at your domain registrar. Verification is usually minutes.
3. Set both variables:

```
RESEND_API_KEY=re_...
EMAIL_FROM=Cartly Hub <orders@cartlyhubgh.com>
```

`EMAIL_FROM` must be on the domain you verified, or Resend rejects the send.

Optional but worth doing once SPF and DKIM pass: add a DMARC record
(`_dmarc.cartlyhubgh.com` TXT `v=DMARC1; p=none; rua=mailto:you@cartlyhubgh.com`).
It tells receivers you authenticate your mail and gives you reports on who is
sending as you.

Without `RESEND_API_KEY` everything still sends via Gmail — it works, it just
keeps landing in spam.

The Resend free tier is 3,000 emails/month with a **100/day cap**. Each paid
order sends two (vendor and customer), so that is roughly 50 orders a day.

The logo is embedded as a `cid:` attachment on the Gmail path, but Resend
cannot address attachments by cid, so on that path it is loaded from
`/cartly-logo-email.png` over https. Add that file to `public/` — a ~40KB
version of the logo — or the masthead will show a broken image.

### FIREBASE_SERVICE_ACCOUNT

`firestore.rules` makes every money collection read-only from a browser and
orders updatable only by an admin. The API therefore has to reach Firestore
with the Admin SDK, which bypasses rules — a route handler has no signed-in
user, so the web SDK would be denied on every write.

Firebase console → Project settings → Service accounts → Generate new private
key. Put the JSON in the variable, either raw or base64-encoded — both are
accepted:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...", ...}
```

Never commit it, and never expose it with a `NEXT_PUBLIC_` prefix.

Without it the app still boots — `src/lib/firestore-server.js` falls back to
the web SDK so local UI work is possible — but checkout, payment fulfilment,
wallet credits, withdrawals and marketplace settings will all be rejected by
the security rules. `isAdminSdk` from that module tells you which mode you are
in.

## Adding a payment provider

1. Write `src/services/payments/<name>.js` exporting the contract documented in
   `src/services/payments/provider.js` (`initialize`, `verify`, optionally
   `verifyWebhook` / `parseWebhook`).
2. Register it in `src/services/payments/index.js`.
3. Select it in **Admin → Marketplace settings**.

The existing webhook route already dispatches on the provider slug, so
`/api/payments/webhook/<name>` works immediately.

## Server-side Firestore access

`src/lib/firestore-server.js` is the only way the marketplace services reach
Firestore. It re-exposes the slice of the web SDK surface those services use
(`doc`, `getDoc`, `getDocs`, `query`, `where`, `runTransaction`, `Timestamp`, …)
backed by the **Admin SDK**, whose API is shaped differently
(`db.collection(x).doc(y).get()`). Keeping the web SDK's shape means the
service code reads the same either way and nothing had to be rewritten.

Two consequences worth knowing:

- Service modules import Firestore from `@/lib/firestore-server`, **not** from
  `firebase/firestore`. Importing the latter in a service would silently go
  back to the denied-by-rules path.
- Client code (`src/utils/marketplaceData.js`, `AppContext`) keeps using the
  real web SDK, because there the user *is* authenticated and rules should
  apply.

## Ownership fields in `firestore.rules`

Two field names are load-bearing and easy to trip over:

- **Orders** carry `customerId` and `vendorId` (marketplace) and, on older
  records, `userId`. The rules allow all three, and any non-admin query must
  filter on one of them — an unfiltered `orders` list is admin-only.
- **Notifications** are written by two producers: the mobile chat service uses
  `recipientId`, the marketplace notification service uses `userId`. The rules
  honour both.
