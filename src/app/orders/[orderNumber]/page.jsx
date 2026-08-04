"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  AlertTriangle,
  MessageCircle,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS,
} from "@/services/marketplace/constants";

const TRACK = [
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
];

const TRACK_ICONS = {
  [ORDER_STATUS.CONFIRMED]: CheckCircle2,
  [ORDER_STATUS.PROCESSING]: Clock,
  [ORDER_STATUS.SHIPPED]: Truck,
  [ORDER_STATUS.DELIVERED]: CheckCircle2,
};

/**
 * Customer-facing order detail and tracking.
 *
 * Reachable by order number from the confirmation page, the account order list
 * or an email link. The "Chat with vendor on WhatsApp" button only appears when
 * the vendor actually enabled WhatsApp — it is a convenience, never the way an
 * online order is completed.
 */
export default function OrderTrackingPage() {
  const { orderNumber } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiFetch(`/api/orders/${orderNumber}`);
        if (!cancelled) setOrder(data.order);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <Shell>
        <div className="py-32 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
        </div>
      </Shell>
    );
  }

  if (error || !order) {
    return (
      <Shell>
        <div className="py-24 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
            <AlertTriangle className="h-9 w-9 text-red-500" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Order not found</h1>
          <p className="text-gray-500 text-sm">{error || "We could not load this order."}</p>
          <button
            onClick={() => router.push("/account/orders")}
            className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
          >
            My orders
          </button>
        </div>
      </Shell>
    );
  }

  const isPaid = order.paymentStatus === PAYMENT_STATUS.PAID;
  const currentIndex = TRACK.indexOf(order.status);
  const cancelled =
    order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED;

  return (
    <Shell>
      <div className="space-y-10">
        <header className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 block">
            Order {order.orderNumber}
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={isPaid ? "emerald" : "amber"}
              icon={<CreditCard className="h-3 w-3" />}
              label={isPaid ? "Paid" : "Payment pending"}
            />
            <Badge
              tone="gray"
              icon={<Store className="h-3 w-3" />}
              label={order.vendorStoreName}
            />
            {order.channel === "whatsapp" && (
              <Badge
                tone="green"
                icon={<MessageCircle className="h-3 w-3" />}
                label="WhatsApp order"
              />
            )}
          </div>
        </header>

        {!cancelled && (
          <section className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
            <div className="grid grid-cols-4 gap-2">
              {TRACK.map((status, index) => {
                const Icon = TRACK_ICONS[status];
                const reached = currentIndex >= index;

                return (
                  <div key={status} className="flex flex-col items-center text-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                        reached ? "bg-black text-white" : "bg-gray-50 text-gray-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest ${
                        reached ? "text-black" : "text-gray-300"
                      }`}
                    >
                      {ORDER_STATUS_LABELS[status]}
                    </span>
                  </div>
                );
              })}
            </div>

            {order.estimatedDeliveryAt && order.status !== ORDER_STATUS.DELIVERED && (
              <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 mt-8 pt-6 border-t border-gray-50">
                Estimated delivery{" "}
                <span className="text-black">
                  {new Date(order.estimatedDeliveryAt).toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </p>
            )}
          </section>
        )}

        <section className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white border border-gray-100 rounded-[2rem] p-8 space-y-6 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Items
            </h2>

            {(order.items || []).map((item, index) => (
              <div key={`${item.productId}-${index}`} className="flex justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black truncate">{item.productName}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                      Qty {item.quantity}
                      {item.variantInfo?.size ? ` • ${item.variantInfo.size}` : ""}
                      {item.variantInfo?.color ? ` • ${item.variantInfo.color}` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black whitespace-nowrap">
                  {formatCurrency(item.lineTotal ?? item.price * item.quantity, order.currency)}
                </span>
              </div>
            ))}

            <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Total
              </span>
              <span className="text-2xl font-black tracking-tighter">
                {formatCurrency(order.totalAmount, order.currency)}
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 space-y-4 shadow-sm">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Delivery
              </h2>
              <div className="flex gap-3">
                <MapPin className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                <div className="text-sm font-bold text-gray-700 leading-relaxed">
                  <p>{order.customerName}</p>
                  <p className="text-gray-500 font-medium">
                    {[order.deliveryAddress?.details, order.deliveryAddress?.city]
                      .filter(Boolean)
                      .join(", ") || "Address confirmed with vendor"}
                  </p>
                </div>
              </div>
            </div>

            {order.chatUrl && (
              <a
                href={order.chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#1da851] transition-all flex items-center justify-center gap-3"
              >
                <MessageCircle className="h-4 w-4" />
                Chat with vendor on WhatsApp
              </a>
            )}

            <button
              onClick={() => router.push("/account/orders")}
              className="w-full bg-gray-100 text-gray-600 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
            >
              All my orders
            </button>
          </div>
        </section>

        {(order.statusHistory || []).length > 0 && (
          <section className="bg-white border border-gray-100 rounded-[2rem] p-8 space-y-5 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              History
            </h2>
            <ol className="space-y-4">
              {[...order.statusHistory].reverse().map((entry, index) => (
                <li key={index} className="flex gap-4">
                  <div className="h-2 w-2 rounded-full bg-black mt-2 shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">
                      {ORDER_STATUS_LABELS[entry.status] || entry.status}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(entry.at).toLocaleString()}
                      {entry.note ? ` • ${entry.note}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </Shell>
  );
}

const Shell = ({ children }) => (
  <div className="min-h-screen bg-gray-50 font-sans">
    <Navbar />
    <main className="max-w-5xl mx-auto px-4 pt-10 pb-24">{children}</main>
  </div>
);

const Badge = ({ label, icon, tone = "gray" }) => {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-[#25D366]/10 text-[#128C7E]",
    gray: "bg-gray-100 text-gray-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${tones[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
};
