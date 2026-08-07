"use client";

import { useState } from "react";
import { Layers, Check } from "lucide-react";

/**
 * "One price for every option".
 *
 * Most sellers price all sizes of a product the same, and editing each row by
 * hand is the tedious part of updating a price. This sets every variant at
 * once. Individual rows stay editable afterwards, so a seller can still charge
 * more for XXL.
 */
export default function BulkPriceBar({ variantCount, onApply }) {
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [applied, setApplied] = useState(false);

  const canApply = Number(price) > 0;

  const apply = () => {
    if (!canApply) return;
    onApply({ price, discountPrice });
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <Layers className="h-4 w-4 text-gray-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-tight">
            Same price for every option
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Sets all {variantCount} {variantCount === 1 ? "option" : "options"} at once.
            You can still change any of them after.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5">
        <input
          type="number"
          min="0"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Price for all"
          className="px-4 py-3 bg-white rounded-xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
        />
        <input
          type="number"
          min="0"
          value={discountPrice}
          onChange={(event) => setDiscountPrice(event.target.value)}
          placeholder="Discount (optional)"
          className="px-4 py-3 bg-white rounded-xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
        />
        <button
          type="button"
          onClick={apply}
          disabled={!canApply}
          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            applied
              ? "bg-emerald-500 text-white"
              : "bg-black text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          }`}
        >
          {applied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Applied
            </>
          ) : (
            "Apply to all"
          )}
        </button>
      </div>
    </div>
  );
}
