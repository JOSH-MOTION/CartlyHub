"use client";

import { useEffect, useRef, useState } from "react";
import { X, Tag, PhoneCall, MessageCircle } from "lucide-react";
import { buildWhatsappLink, normaliseWhatsappNumber } from "@/services/marketplace/whatsapp";
import { formatCurrency } from "@/services/payments/money";

/**
 * "Make an offer" and "Request call back".
 *
 * Both hand off to WhatsApp with a pre-filled message, which is how every
 * other buyer-to-vendor conversation on Cartly Hub already works — no new
 * inbox for vendors to remember to check. Nothing is written to Firestore:
 * these are conversations, not orders.
 */
export default function SellerContactModal({
  mode,
  product,
  pricing,
  sellerInfo,
  onClose,
}) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  // Held in a ref so the effect below depends on `mode` alone. Callers pass an
  // inline arrow for onClose, which is a new identity every render — as a
  // dependency it would re-run the effect constantly, and each re-run would
  // record the already-locked "hidden" as the value to restore.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Hooks run before the `if (!mode) return null` below, so this must no-op
  // when the modal is closed. Without the guard, simply rendering a closed
  // modal locked scrolling on the whole page.
  useEffect(() => {
    if (!mode) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => event.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [mode]);

  if (!mode) return null;

  const isOffer = mode === "offer";
  const whatsappNumber =
    sellerInfo?.whatsappNumber || product?.sellerPhone || sellerInfo?.contactPhone;
  const canWhatsapp = Boolean(normaliseWhatsappNumber(whatsappNumber));
  const storeName = sellerInfo?.storeName || product?.sellerName || "the seller";
  const productUrl = typeof window !== "undefined" ? window.location.href : "";

  const offerValid = Number(amount) > 0;
  const callbackValid = name.trim().length > 1 && phone.trim().length >= 9;
  const canSubmit = isOffer ? offerValid : callbackValid;

  const send = () => {
    if (!canSubmit || !canWhatsapp) return;

    const message = isOffer
      ? `Hello ${storeName} 👋

I'd like to make an offer on this item:

🛍 ${product?.name}
💰 Listed at ${formatCurrency(pricing?.price, product?.currency || "GHS")}
🤝 My offer: ${formatCurrency(Number(amount), product?.currency || "GHS")}
${note.trim() ? `\n📝 ${note.trim()}\n` : ""}
🔗 ${productUrl}

Would you accept this?`
      : `Hello ${storeName} 👋

Please call me back about this item:

🛍 ${product?.name}
👤 ${name.trim()}
📞 ${phone.trim()}
${note.trim() ? `\n📝 ${note.trim()}\n` : ""}
🔗 ${productUrl}

Thank you.`;

    window.open(buildWhatsappLink(whatsappNumber, message), "_blank", "noopener");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <button
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-200"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
              {isOffer ? (
                <Tag className="h-4 w-4 text-black" />
              ) : (
                <PhoneCall className="h-4 w-4 text-emerald-600" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black uppercase tracking-tight">
                {isOffer ? "Make an offer" : "Request a call back"}
              </h2>
              <p className="text-[11px] text-gray-400 truncate">{product?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {!canWhatsapp ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              {storeName} hasn&apos;t added a WhatsApp number, so this can&apos;t be sent
              here.
            </p>
            {product?.sellerPhone && (
              <a
                href={`tel:${product.sellerPhone}`}
                className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
              >
                <PhoneCall className="h-4 w-4" />
                Call {product.sellerPhone}
              </a>
            )}
          </div>
        ) : (
          <>
            {isOffer ? (
              <div className="space-y-4">
                <Field label={`Your offer (listed at ${formatCurrency(pricing?.price)})`}>
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    min="1"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                  />
                </Field>
                {pricing?.price > 0 && Number(amount) > 0 && (
                  <p className="text-[11px] font-bold text-gray-400">
                    {Number(amount) >= pricing.price
                      ? "That's at or above the asking price."
                      : `${Math.round((1 - Number(amount) / pricing.price) * 100)}% below asking.`}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Your name">
                  <input
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Kofi Mensah"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                  />
                </Field>
                <Field label="Your phone">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="024 123 4567"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                  />
                </Field>
              </div>
            )}

            <Field label="Add a note (optional)">
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={isOffer ? "I can collect today…" : "Best time to call…"}
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm min-h-[80px] resize-none"
              />
            </Field>

            <button
              onClick={send}
              disabled={!canSubmit}
              className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              Send on WhatsApp
            </button>

            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Opens WhatsApp with your message ready to send. Cartly Hub doesn&apos;t
              handle offers or callbacks — you arrange it with the seller directly.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, children }) => (
  <label className="block space-y-2">
    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
      {label}
    </span>
    {children}
  </label>
);
