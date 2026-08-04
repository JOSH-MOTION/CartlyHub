"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Loader2,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MessageCircle,
  Store,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import LocationSearch from "@/components/LocationSearch";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";

/**
 * Marketplace checkout.
 *
 * The cart can hold items from several vendors with different Selling &
 * Payment Preferences, so the page is built around what each vendor accepts:
 *
 *   online vendors     → one "Pay Now" for the combined total, paid to Cartly
 *                        Hub's central Paystack account
 *   WhatsApp-only      → an "Order on WhatsApp" button per vendor, which saves
 *                        the order here first and then opens the chat
 *
 * The totals, prices and vendor modes come from /api/checkout/quote, never
 * from localStorage, so nothing the browser holds can change what is charged.
 */
export default function MarketplaceCheckout({ cart, userProfile, onCancel, onOrdered }) {
  const [step, setStep] = useState(1);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [quoteError, setQuoteError] = useState(null);
  const [payingOnline, setPayingOnline] = useState(false);
  const [whatsappBusyVendor, setWhatsappBusyVendor] = useState(null);

  const [form, setForm] = useState({
    name: userProfile?.name || userProfile?.fullName || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || "",
    city: userProfile?.city || "",
    details: "",
  });

  const payload = useMemo(
    () =>
      (cart || []).map((item) => ({
        productId: item.product?.id || item.productId,
        variantId: item.variant?.id || item.variantId,
        quantity: item.quantity,
        selections: item.selections || [],
      })),
    [cart],
  );

  useEffect(() => {
    let cancelled = false;

    const loadQuote = async () => {
      setLoadingQuote(true);
      setQuoteError(null);
      try {
        const data = await apiFetch("/api/checkout/quote", {
          method: "POST",
          body: { items: payload },
        });
        if (!cancelled) setQuote(data);
      } catch (error) {
        if (!cancelled) setQuoteError(error.message);
      } finally {
        if (!cancelled) setLoadingQuote(false);
      }
    };

    if (payload.length) loadQuote();
    else setLoadingQuote(false);

    return () => {
      cancelled = true;
    };
  }, [payload]);

  const deliveryReady =
    form.name.trim() && form.phone.trim() && form.city.trim() && form.details.trim();
  const onlineReady = deliveryReady && form.email.trim();

  const customer = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
  };
  const delivery = { city: form.city.trim(), details: form.details.trim() };

  const handlePayOnline = async () => {
    setPayingOnline(true);
    try {
      const data = await apiFetch("/api/checkout/online", {
        method: "POST",
        body: { items: payload, customer, delivery },
      });

      // Hand off to the gateway. Fulfilment happens when we come back to
      // /checkout/confirm, or via the webhook if the customer closes the tab.
      window.location.href = data.authorizationUrl;
    } catch (error) {
      toast.error(error.message);
      setPayingOnline(false);
    }
  };

  const handleWhatsappOrder = async (group) => {
    setWhatsappBusyVendor(group.vendorId);
    try {
      const data = await apiFetch("/api/checkout/whatsapp", {
        method: "POST",
        body: { items: payload, vendorId: group.vendorId, customer, delivery },
      });

      toast.success(`Order ${data.order.orderNumber} sent to ${group.vendorStoreName}`);
      onOrdered?.(data.order);

      if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setWhatsappBusyVendor(null);
    }
  };

  if (loadingQuote) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (quoteError) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter">
          We could not price your bag
        </h2>
        <p className="text-gray-500 text-sm">{quoteError}</p>
        <button
          onClick={onCancel}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
        >
          Back to bag
        </button>
      </div>
    );
  }

  if (!quote) return null;

  const onlineGroups = quote.groups.filter((group) => group.supportsOnline);
  const whatsappGroups = quote.groups.filter(
    (group) => !group.supportsOnline && group.supportsWhatsapp,
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      <button
        onClick={onCancel}
        className="group flex items-center gap-3 text-gray-400 hover:text-black mb-10 font-black text-[10px] uppercase tracking-[0.3em] transition-all"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to bag
      </button>

      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-10">
          <div className="flex items-center gap-6">
            {[
              { number: 1, label: "Delivery" },
              { number: 2, label: "Payment" },
            ].map((entry, index) => (
              <div key={entry.number} className="flex items-center gap-4">
                {index > 0 && <div className="w-12 h-px bg-gray-100" />}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step >= entry.number ? "bg-black text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {entry.number}
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    step === entry.number ? "text-black" : "text-gray-400"
                  }`}
                >
                  {entry.label}
                </span>
              </div>
            ))}
          </div>

          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <h2 className="text-3xl font-black uppercase tracking-tighter">
                Where should we deliver?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field
                  icon={<User size={16} />}
                  label="Full name *"
                  value={form.name}
                  onChange={(value) => setForm({ ...form, name: value })}
                  placeholder="Kofi Mensah"
                />
                <Field
                  icon={<Phone size={16} />}
                  label="Phone number *"
                  type="tel"
                  value={form.phone}
                  onChange={(value) => setForm({ ...form, phone: value })}
                  placeholder="024 XXX XXXX"
                />
              </div>

              <Field
                icon={<Mail size={16} />}
                label={
                  quote.hasOnline ? "Email address * (receipt & order updates)" : "Email address"
                }
                type="email"
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
                placeholder="kofi@example.com"
              />

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">
                  City / Location *
                </label>
                <LocationSearch
                  value={form.city}
                  onChange={(value) => setForm({ ...form, city: value })}
                  placeholder="Enter your location..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">
                  Street &amp; landmarks *
                </label>
                <textarea
                  className="w-full p-5 border-2 border-gray-50 bg-gray-50/60 rounded-3xl outline-none focus:border-black focus:bg-white transition-all min-h-[120px] text-sm font-bold"
                  placeholder="House number, street name, nearby landmark..."
                  value={form.details}
                  onChange={(event) => setForm({ ...form, details: event.target.value })}
                />
              </div>

              <button
                disabled={!deliveryReady}
                onClick={() => setStep(2)}
                className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300 transition-all"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-3xl font-black uppercase tracking-tighter">
                How you&apos;ll order
              </h2>

              {onlineGroups.length > 0 && (
                <div className="rounded-[2rem] border border-gray-100 bg-white p-8 space-y-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight">
                        Pay Cartly Hub securely
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        {onlineGroups.length === 1
                          ? `${onlineGroups[0].vendorStoreName} accepts online payment.`
                          : `${onlineGroups.length} vendors in your bag accept online payment.`}{" "}
                        You pay once — we settle each vendor into their wallet.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between border-t border-gray-100 pt-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Amount to pay
                    </span>
                    <span className="text-3xl font-black tracking-tighter">
                      {formatCurrency(quote.onlineTotal, quote.currency)}
                    </span>
                  </div>

                  <button
                    disabled={!onlineReady || payingOnline}
                    onClick={handlePayOnline}
                    className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-800 transition-all disabled:bg-gray-100 disabled:text-gray-300 flex items-center justify-center gap-3"
                  >
                    {payingOnline ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Pay now</span>
                      </>
                    )}
                  </button>

                  {!onlineReady && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 text-center">
                      Add your email address to pay online
                    </p>
                  )}
                </div>
              )}

              {whatsappGroups.map((group) => (
                <div
                  key={group.vendorId}
                  className="rounded-[2rem] border border-gray-100 bg-white p-8 space-y-6 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-[#25D366]/10 text-[#128C7E] flex items-center justify-center shrink-0">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight">
                        {group.vendorStoreName}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        This vendor takes orders on WhatsApp. We save your order here first,
                        then open the chat with the details filled in.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between border-t border-gray-100 pt-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Order total
                    </span>
                    <span className="text-2xl font-black tracking-tighter">
                      {formatCurrency(group.subtotal, quote.currency)}
                    </span>
                  </div>

                  <button
                    disabled={whatsappBusyVendor === group.vendorId}
                    onClick={() => handleWhatsappOrder(group)}
                    className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-[#1da851] transition-all disabled:opacity-60 flex items-center justify-center gap-3"
                  >
                    {whatsappBusyVendor === group.vendorId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        <span>Order on WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              ))}

              {quote.unavailableVendors?.length > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 flex gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {quote.unavailableVendors.join(", ")} cannot take orders right now. Remove
                    those items to continue.
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep(1)}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                Edit delivery details
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 sticky top-28 space-y-8">
            <h3 className="text-xl font-black uppercase tracking-tighter">Your bag</h3>

            {quote.groups.map((group) => (
              <div key={group.vendorId} className="space-y-4">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <Store className="h-3 w-3" />
                  <span>{group.vendorStoreName}</span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded-full ${
                      group.supportsOnline
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-[#25D366]/10 text-[#128C7E]"
                    }`}
                  >
                    {group.supportsOnline ? "Pay online" : "WhatsApp"}
                  </span>
                </div>

                {group.items.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="flex justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-14 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate">{item.productName}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          Qty {item.quantity}
                          {item.variantInfo?.size ? ` • ${item.variantInfo.size}` : ""}
                          {item.variantInfo?.color ? ` • ${item.variantInfo.color}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black whitespace-nowrap">
                      {formatCurrency(item.lineTotal, quote.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            <div className="pt-6 border-t border-gray-200 space-y-3">
              {quote.hasOnline && (
                <Row label="Paying online" value={formatCurrency(quote.onlineTotal, quote.currency)} />
              )}
              {quote.hasWhatsapp && (
                <Row
                  label="Ordering on WhatsApp"
                  value={formatCurrency(quote.whatsappTotal, quote.currency)}
                />
              )}
              <div className="flex justify-between items-center pt-4 text-2xl font-black tracking-tighter">
                <span>Total</span>
                <span>{formatCurrency(quote.cartTotal, quote.currency)}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">
                Delivery is confirmed with the vendor after your order is placed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
    <span>{label}</span>
    <span className="text-black">{value}</span>
  </div>
);

const Field = ({ label, value, onChange, placeholder, type = "text", icon }) => (
  <div className="space-y-2 group">
    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full ${icon ? "pl-14 pr-5" : "px-5"} py-4 border-2 border-gray-50 bg-gray-50/60 focus:bg-white rounded-2xl outline-none focus:border-black transition-all text-sm font-bold placeholder:text-gray-300`}
      />
    </div>
  </div>
);
