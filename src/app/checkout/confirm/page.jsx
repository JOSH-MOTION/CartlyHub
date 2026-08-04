"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Package,
  ArrowRight,
  Receipt,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import useCart from "@/store/useCart";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";

/**
 * Where the payment gateway returns the customer.
 *
 * Deliberately NOT a WhatsApp redirect: the customer gets a proper order
 * confirmation and can track the order from their account. Vendors reachable
 * on WhatsApp are offered as a chat button on the order page instead.
 */
function CheckoutConfirmContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { clearCart } = useCart();

  const reference = params.get("reference") || params.get("trxref");
  const [state, setState] = useState("verifying");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const verified = useRef(false);

  useEffect(() => {
    if (!reference) {
      setState("error");
      setError("We could not find a payment reference to confirm.");
      return;
    }

    // Guard against React re-running the effect and double-posting.
    if (verified.current) return;
    verified.current = true;

    const verify = async () => {
      try {
        const data = await apiFetch("/api/payments/verify", {
          method: "POST",
          body: { reference },
        });
        setResult(data);
        setState("success");
        clearCart();
      } catch (verifyError) {
        setError(verifyError.message);
        setState("error");
      }
    };

    verify();
  }, [reference, clearCart]);

  if (state === "verifying") {
    return (
      <Shell>
        <div className="text-center space-y-6 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-black mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-tighter">
              Confirming your payment
            </h1>
            <p className="text-gray-500 text-sm">
              Hold on a moment — we&apos;re checking with the payment provider.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  if (state === "error") {
    return (
      <Shell>
        <div className="text-center space-y-6 py-20">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
            <AlertTriangle className="h-9 w-9 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-tighter">
              Payment not confirmed
            </h1>
            <p className="text-gray-500 text-sm max-w-md mx-auto">{error}</p>
            {reference && (
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 pt-2">
                Reference {reference}
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            If money left your account, keep this reference — your order will be confirmed
            automatically once the provider notifies us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => router.push("/account/orders")}
              className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
              View my orders
            </button>
            <button
              onClick={() => router.push("/cart")}
              className="bg-gray-100 text-gray-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
              Back to bag
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const orders = result?.orders || [];

  return (
    <Shell>
      <div className="space-y-10 py-10">
        <div className="text-center space-y-5">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Payment successful
            </h1>
            <p className="text-gray-500 text-sm">
              Your order is confirmed. We&apos;ve let{" "}
              {orders.length === 1 ? "the vendor" : "each vendor"} know.
            </p>
          </div>
        </div>

        <div className="bg-black text-white rounded-[2rem] p-8 grid sm:grid-cols-3 gap-6">
          <Stat
            label="Amount paid"
            value={formatCurrency(result?.amount, result?.currency)}
          />
          <Stat label="Reference" value={result?.reference} mono />
          <Stat label="Orders" value={String(orders.length)} />
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Your orders
          </h2>

          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => router.push(`/orders/${order.orderNumber}`)}
              className="w-full text-left bg-white border border-gray-100 rounded-3xl p-6 flex items-center justify-between gap-4 hover:shadow-lg hover:border-gray-200 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-11 w-11 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-black" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-tight truncate">
                    {order.orderNumber}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5 truncate">
                    {order.vendorStoreName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm font-black">
                  {formatCurrency(order.totalAmount, result?.currency)}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push("/account/orders")}
            className="flex-1 bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
          >
            <Receipt className="h-4 w-4" />
            Track my orders
          </button>
          <button
            onClick={() => router.push("/products")}
            className="flex-1 bg-gray-100 text-gray-600 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
          >
            Continue shopping
          </button>
        </div>
      </div>
    </Shell>
  );
}

const Shell = ({ children }) => (
  <div className="min-h-screen bg-white font-sans">
    <Navbar />
    <main className="max-w-3xl mx-auto px-4 pt-28 pb-24">{children}</main>
  </div>
);

const Stat = ({ label, value, mono }) => (
  <div className="space-y-1.5">
    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500">{label}</p>
    <p className={`text-lg font-black tracking-tight break-all ${mono ? "font-mono" : ""}`}>
      {value || "—"}
    </p>
  </div>
);

export default function CheckoutConfirmPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="py-24 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        </Shell>
      }
    >
      <CheckoutConfirmContent />
    </Suspense>
  );
}
