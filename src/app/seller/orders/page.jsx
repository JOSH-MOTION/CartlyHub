"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, MessageCircle, CreditCard, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getVendorOrders } from "@/utils/marketplaceData";
import { formatCurrency } from "@/services/payments/money";
import {
  ORDER_CHANNELS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS,
} from "@/services/marketplace/constants";
import {
  PageHeader,
  Panel,
  Table,
  Cell,
  Pill,
  EmptyState,
  LoadingState,
  StatCard,
} from "@/components/marketplace/dashboard-ui";

const STATUS_TONES = {
  [ORDER_STATUS.AWAITING_PAYMENT]: "amber",
  [ORDER_STATUS.AWAITING_VENDOR]: "green",
  [ORDER_STATUS.CONFIRMED]: "black",
  [ORDER_STATUS.PROCESSING]: "amber",
  [ORDER_STATUS.SHIPPED]: "blue",
  [ORDER_STATUS.DELIVERED]: "emerald",
  [ORDER_STATUS.CANCELLED]: "red",
  [ORDER_STATUS.REFUNDED]: "red",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "open", label: "To fulfil" },
];

/** Every order placed with this vendor, online and WhatsApp alike. */
export default function SellerOrdersPage() {
  const { sellerProfile } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller", "orders", sellerProfile?.uid],
    queryFn: () => getVendorOrders(sellerProfile?.uid),
    enabled: Boolean(sellerProfile?.uid),
  });

  const stats = useMemo(() => {
    const paid = orders.filter((order) => order.paymentStatus === PAYMENT_STATUS.PAID);
    return {
      total: orders.length,
      paidCount: paid.length,
      revenue: paid.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
      earnings: paid.reduce((sum, order) => sum + Number(order.vendorEarnings || 0), 0),
    };
  }, [orders]);

  const visible = useMemo(() => {
    switch (filter) {
      case "paid":
        return orders.filter((order) => order.paymentStatus === PAYMENT_STATUS.PAID);
      case "whatsapp":
        return orders.filter((order) => order.channel === ORDER_CHANNELS.WHATSAPP);
      case "open":
        return orders.filter(
          (order) =>
            ![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(
              order.status,
            ),
        );
      default:
        return orders;
    }
  }, [orders, filter]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Online payments settle into your wallet automatically. WhatsApp orders are saved here so nothing gets lost in the chat."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Orders" value={stats.total} icon={ShoppingBag} />
        <StatCard label="Paid orders" value={stats.paidCount} icon={CreditCard} />
        <StatCard label="Gross sales" value={formatCurrency(stats.revenue)} />
        <StatCard
          label="Your earnings"
          value={formatCurrency(stats.earnings)}
          hint="After marketplace commission"
          tone="dark"
        />
      </div>

      <Panel
        title="Order history"
        action={
          <div className="flex gap-1.5">
            {FILTERS.map((entry) => (
              <button
                key={entry.value}
                onClick={() => setFilter(entry.value)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                  filter === entry.value
                    ? "bg-black text-white"
                    : "bg-gray-50 text-gray-400 hover:text-black"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        }
      >
        {isLoading ? (
          <LoadingState label="Loading orders" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders here yet"
            description="Orders appear the moment a customer pays or sends you a WhatsApp order."
          />
        ) : (
          <Table head={["Order", "Customer", "Channel", "Status", "Total", "You earn", ""]}>
            {visible.map((order) => (
              <tr
                key={order.id}
                onClick={() => router.push(`/seller/orders/${order.id}`)}
                className="cursor-pointer hover:bg-gray-50/60 transition-colors"
              >
                <Cell>
                  <span className="font-black">{order.orderNumber}</span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                    {order.createdAt?.toLocaleDateString?.()}
                  </span>
                </Cell>
                <Cell>
                  {order.customerName || "Guest"}
                  <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                    {order.customerPhone || "—"}
                  </span>
                </Cell>
                <Cell>
                  <Pill
                    tone={order.channel === ORDER_CHANNELS.WHATSAPP ? "green" : "emerald"}
                    icon={
                      order.channel === ORDER_CHANNELS.WHATSAPP ? (
                        <MessageCircle className="h-3 w-3" />
                      ) : (
                        <CreditCard className="h-3 w-3" />
                      )
                    }
                    label={
                      order.channel === ORDER_CHANNELS.WHATSAPP
                        ? "WhatsApp"
                        : order.paymentStatus === PAYMENT_STATUS.PAID
                          ? "Paid online"
                          : "Unpaid"
                    }
                  />
                </Cell>
                <Cell>
                  <Pill
                    tone={STATUS_TONES[order.status] || "neutral"}
                    label={ORDER_STATUS_LABELS[order.status] || order.status}
                  />
                </Cell>
                <Cell className="font-black text-black">
                  {formatCurrency(order.totalAmount, order.currency)}
                </Cell>
                <Cell className="text-emerald-600 font-black">
                  {order.paymentStatus === PAYMENT_STATUS.PAID
                    ? formatCurrency(order.vendorEarnings, order.currency)
                    : "—"}
                </Cell>
                <Cell>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </Cell>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}
