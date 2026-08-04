"use client";

import { formatCurrency } from "@/services/payments/money";

/**
 * Live feedback under a discount input.
 *
 * Sellers get told what the shopper will see before saving, and are warned
 * when the figure they typed will simply be ignored — a discount at or above
 * the normal price is dropped rather than stored.
 */
export default function DiscountHint({ original, discount }) {
  const normal = Number(original);
  const sale = Number(discount);

  if (!discount || discount === "") return null;

  if (!Number.isFinite(sale) || sale <= 0) {
    return <Hint tone="warn">Enter an amount above zero, or leave this blank.</Hint>;
  }

  if (!Number.isFinite(normal) || normal <= 0) {
    return <Hint tone="warn">Set the selling price first.</Hint>;
  }

  if (sale >= normal) {
    return (
      <Hint tone="warn">
        Must be below {formatCurrency(normal)} — this discount will be ignored.
      </Hint>
    );
  }

  const percent = Math.round((1 - sale / normal) * 100);

  return (
    <Hint tone="ok">
      Shoppers see {formatCurrency(sale)} with {formatCurrency(normal)} crossed out —{" "}
      {percent}% off.
    </Hint>
  );
}

const Hint = ({ tone, children }) => (
  <p
    className={`text-[10px] font-bold leading-relaxed ${
      tone === "warn" ? "text-amber-600" : "text-emerald-600"
    }`}
  >
    {children}
  </p>
);
