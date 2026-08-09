"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

/**
 * True once the image is known to have failed.
 *
 * `onError` alone is not enough: the markup is server-rendered, so an image
 * can finish failing before React hydrates and attaches the handler — the
 * event fires into the void and the broken image stays on screen. Checking
 * `complete && naturalWidth === 0` on mount catches exactly that case.
 */
const useImageFailed = () => {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const image = ref.current;
    if (image && image.complete && image.naturalWidth === 0) setFailed(true);
  }, []);

  return { ref, failed, markFailed: () => setFailed(true) };
};

/**
 * Accepted payment methods.
 *
 * Each method renders its official logo when the file is present in /public,
 * and falls back to a legible text badge when it is not. That fallback is the
 * point: the previous version hardcoded an <img> for a file that did not
 * exist, so it rendered a broken image, and the card brands were 6px grey text
 * on a grey box — present in the markup but invisible on screen.
 *
 * Brand marks are trademarked, so the image files are not committed here. Drop
 * the official assets in /public using the `logo` names below and each badge
 * upgrades itself with no code change. Sources:
 *   Paystack     https://paystack.com/press
 *   Visa         https://usa.visa.com/run-your-business/small-business-tools/payment-technology.html
 *   Mastercard   https://brand.mastercard.com
 *   MTN MoMo     from your MTN merchant pack
 */
const METHODS = [
  { id: "visa", label: "Visa", logo: "/payments/visa.svg" },
  { id: "mastercard", label: "Mastercard", logo: "/payments/mastercard.svg" },
  { id: "mtn-momo", label: "MTN MoMo", logo: "/payments/mtn-momo.svg" },
  { id: "telecel", label: "Telecel Cash", logo: "/payments/telecel.svg" },
  { id: "airteltigo", label: "AirtelTigo", logo: "/payments/airteltigo.svg" },
];

const Badge = ({ method }) => {
  const { ref, failed, markFailed } = useImageFailed();

  if (failed || !method.logo) {
    return (
      <span
        className="px-2.5 h-7 inline-flex items-center rounded-md bg-white border border-gray-200 text-[10px] font-bold text-gray-600 whitespace-nowrap"
        title={method.label}
      >
        {method.label}
      </span>
    );
  }

  return (
    <img
      ref={ref}
      src={method.logo}
      alt={method.label}
      className="h-7 w-auto rounded-md border border-gray-200 bg-white p-1"
      onError={markFailed}
    />
  );
};

export default function PaymentMethods({ className = "" }) {
  const {
    ref: paystackRef,
    failed: paystackFailed,
    markFailed: markPaystackFailed,
  } = useImageFailed();

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-4 ${className}`}>
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        Secured by
        {paystackFailed ? (
          <span className="text-gray-700">Paystack</span>
        ) : (
          <img
            ref={paystackRef}
            src="/payments/paystack.svg"
            alt="Paystack"
            className="h-4 w-auto"
            onError={markPaystackFailed}
          />
        )}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {METHODS.map((method) => (
          <Badge key={method.id} method={method} />
        ))}
      </div>
    </div>
  );
}
