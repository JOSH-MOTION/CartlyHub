"use client";

import { Check, MessageCircle, CreditCard, Sparkles, Info } from "lucide-react";
import { SELLING_MODE_OPTIONS } from "@/services/marketplace/constants";

const ICONS = {
  whatsapp: MessageCircle,
  online: CreditCard,
  both: Sparkles,
};

/**
 * Selling & Payment Preferences.
 *
 * Used both during vendor onboarding and in Store Settings so a vendor sees
 * exactly the same choices in both places. The WhatsApp number field appears
 * only for the options that need it.
 */
export default function SellingPreferences({
  value,
  onChange,
  countryCode = "+233",
  onCountryCodeChange,
  whatsappNumber = "",
  onWhatsappNumberChange,
  disabled = false,
}) {
  const selected = SELLING_MODE_OPTIONS.find((option) => option.value === value);
  const needsWhatsapp = Boolean(selected?.requiresWhatsapp);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="font-black text-sm uppercase tracking-tight text-gray-900">
          Selling &amp; Payment Preferences
        </h3>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
          How do you want customers to buy from you?
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {SELLING_MODE_OPTIONS.map((option) => {
          const Icon = ICONS[option.value] || CreditCard;
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`relative text-left p-5 rounded-2xl border-2 transition-all disabled:opacity-50 ${
                isActive
                  ? "border-black bg-black text-white shadow-xl shadow-black/10"
                  : "border-gray-100 bg-gray-50 hover:border-gray-300"
              }`}
            >
              {option.recommended && (
                <span
                  className={`absolute top-3 right-3 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    isActive ? "bg-white/15 text-emerald-300" : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  Recommended
                </span>
              )}

              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center mb-4 ${
                  isActive ? "bg-white/10 text-white" : "bg-white text-black border border-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <p className="text-[11px] font-black uppercase tracking-tight leading-tight">
                {option.label}
              </p>
              <p
                className={`text-[10px] mt-2 leading-relaxed ${
                  isActive ? "text-gray-300" : "text-gray-500"
                }`}
              >
                {option.summary}
              </p>

              {isActive && (
                <div className="flex items-center gap-1.5 mt-4 text-[8px] font-black uppercase tracking-widest text-emerald-300">
                  <Check className="h-3 w-3" />
                  <span>Selected</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {needsWhatsapp && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
            <MessageCircle className="h-3 w-3" />
            <span>WhatsApp Number *</span>
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              disabled={disabled}
              onChange={(event) => onCountryCodeChange?.(event.target.value)}
              className="px-3 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold w-[90px] flex-shrink-0 text-sm"
            >
              <option value="+233">GH (+233)</option>
              <option value="+234">NG (+234)</option>
            </select>
            <input
              required
              type="tel"
              disabled={disabled}
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
              placeholder="E.g. 241234567"
              value={whatsappNumber}
              onChange={(event) => onWhatsappNumberChange?.(event.target.value)}
            />
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            Customers reach you on this number and their orders arrive pre-filled.
          </p>
        </div>
      )}

      {selected?.enablesOnline && (
        <div className="flex gap-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
          <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Customers pay <strong>Cartly Hub</strong> securely through our Paystack
            checkout. Your share lands in your Cartly Hub Wallet the moment the payment
            clears, and you withdraw it whenever you like.
          </p>
        </div>
      )}

      {selected && !selected.enablesOnline && (
        <div className="flex gap-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Shoppers will see an <strong>Order on WhatsApp</strong> button instead of Pay
            Now. Orders still land in your dashboard, but you collect payment yourself
            and nothing is added to your wallet.
          </p>
        </div>
      )}
    </div>
  );
}
