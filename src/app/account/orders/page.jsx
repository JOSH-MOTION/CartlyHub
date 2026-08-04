"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  ShoppingBag,
  ChevronRight,
  Loader2,
  Store,
  MessageCircle,
  CreditCard,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import { getCustomerOrders } from "@/utils/marketplaceData";
import { formatCurrency } from "@/services/payments/money";
import {
  ORDER_CHANNELS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS,
} from "@/services/marketplace/constants";

const STATUS_TONES = {
  [ORDER_STATUS.DELIVERED]: "bg-emerald-50 text-emerald-600 border-emerald-100",
  [ORDER_STATUS.SHIPPED]: "bg-blue-50 text-blue-600 border-blue-100",
  [ORDER_STATUS.PROCESSING]: "bg-orange-50 text-orange-600 border-orange-100",
  [ORDER_STATUS.CONFIRMED]: "bg-black text-white border-black",
  [ORDER_STATUS.CANCELLED]: "bg-red-50 text-red-500 border-red-100",
  [ORDER_STATUS.REFUNDED]: "bg-red-50 text-red-500 border-red-100",
};

/** Every order this customer has placed, across every vendor. */
export default function MyOrdersPage() {
  const { user, isLoading: authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/account/signin");
  }, [user, authLoading, router]);

  const customerId = user?.id || user?.uid;

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["customer", "orders", customerId],
    queryFn: () => getCustomerOrders(customerId),
    enabled: Boolean(customerId),
  });

  if (authLoading || (user && isLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-10 pb-24 space-y-10">
        <header className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 block">
            Your account
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tighter">My orders</h1>
        </header>

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-[2rem] p-16 text-center space-y-6">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tighter">No orders yet</h2>
              <p className="text-gray-500 text-sm">
                When you place an order it will show up here with live tracking.
              </p>
            </div>
            <button
              onClick={() => router.push("/products")}
              className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all"
            >
              Start shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => router.push(`/orders/${order.orderNumber}`)}
                className="w-full text-left bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg hover:border-gray-200 transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-black" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase tracking-tight truncate">
                        {order.orderNumber}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1 flex items-center gap-1.5 truncate">
                        <Store className="h-3 w-3 shrink-0" />
                        {order.vendorStoreName}
                        <span className="text-gray-200">•</span>
                        {order.createdAt?.toLocaleDateString?.() || ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1 flex items-center justify-end gap-1">
                        {order.channel === ORDER_CHANNELS.WHATSAPP ? (
                          <MessageCircle className="h-3 w-3" />
                        ) : (
                          <CreditCard className="h-3 w-3" />
                        )}
                        {order.paymentStatus === PAYMENT_STATUS.PAID ? "Paid" : "Unpaid"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-50 flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      STATUS_TONES[order.status] || "bg-gray-50 text-gray-500 border-gray-100"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {(order.items || []).reduce(
                      (count, item) => count + Number(item.quantity || 0),
                      0,
                    )}{" "}
                    item(s)
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
