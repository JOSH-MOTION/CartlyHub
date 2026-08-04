"use client";

import { formatCurrency } from "@/services/payments/money";

/**
 * Price display.
 *
 * When an item is on sale the original is struck through and the customer
 * always reads the payable figure first. Everything comes from resolvePricing
 * so a discount looks identical wherever it appears.
 */
const SIZES = {
  sm: { price: "text-sm", compare: "text-[11px]", badge: "text-[8px] px-1.5 py-0.5" },
  md: { price: "text-lg", compare: "text-xs", badge: "text-[9px] px-2 py-0.5" },
  lg: { price: "text-3xl", compare: "text-sm", badge: "text-[10px] px-2 py-1" },
};

export default function Price({
  pricing,
  currency = "GHS",
  size = "md",
  showBadge = true,
  className = "",
}) {
  const scale = SIZES[size] || SIZES.md;

  if (!pricing?.isDiscounted) {
    return (
      <span className={`font-black tracking-tight ${scale.price} ${className}`}>
        {formatCurrency(pricing?.price, currency)}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-baseline flex-wrap gap-x-2 gap-y-1 ${className}`}>
      <span className={`font-black tracking-tight text-red-600 ${scale.price}`}>
        {formatCurrency(pricing.price, currency)}
      </span>

      <span className={`text-gray-400 line-through font-bold ${scale.compare}`}>
        {formatCurrency(pricing.compareAtPrice, currency)}
      </span>

      {showBadge && (
        <span
          className={`font-black uppercase tracking-widest rounded-full bg-red-50 text-red-600 ${scale.badge}`}
        >
          -{pricing.percentOff}%
        </span>
      )}
    </span>
  );
}

/** "You save GH₵25.00" line, for cart and product pages. */
export const Saving = ({ pricing, currency = "GHS", className = "" }) => {
  if (!pricing?.isDiscounted) return null;

  return (
    <span
      className={`text-[10px] font-black uppercase tracking-widest text-emerald-600 ${className}`}
    >
      You save {formatCurrency(pricing.saving, currency)}
    </span>
  );
};
