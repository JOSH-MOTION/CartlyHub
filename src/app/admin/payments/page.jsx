"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Receipt, Percent, MessageCircle, ShoppingBag } from "lucide-react";
import { getAllOrders, getAllPayments } from "@/utils/marketplaceData";
import { formatCurrency } from "@/services/payments/money";
import {
  ORDER_CHANNELS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS,
} from "@/services/marketplace/constants";
import {
  PageHeader,
  Panel,
  StatCard,
  Table,
  Cell,
  Pill,
  EmptyState,
  LoadingState,
} from "@/components/marketplace/dashboard-ui";

const PAYMENT_TONES = {
  [PAYMENT_STATUS.PAID]: "emerald",
  [PAYMENT_STATUS.PENDING]: "amber",
  [PAYMENT_STATUS.FAILED]: "red",
  [PAYMENT_STATUS.REFUNDED]: "red",
  [PAYMENT_STATUS.UNPAID]: "neutral",
};

/** Every payment taken into Cartly Hub's account, and every order behind them. */
export default function AdminPaymentsPage() {
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: getAllPayments,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: getAllOrders,
  });

  const totals = useMemo(() => {
    const paid = orders.filter((order) => order.paymentStatus === PAYMENT_STATUS.PAID);
    return {
      collected: paid.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
      commission: paid.reduce((sum, order) => sum + Number(order.commissionAmount || 0), 0),
      whatsapp: orders.filter((order) => order.channel === ORDER_CHANNELS.WHATSAPP).length,
      online: orders.filter((order) => order.channel === ORDER_CHANNELS.ONLINE).length,
    };
  }, [orders]);

  if (paymentsLoading || ordersLoading) return <LoadingState label="Loading payments" />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Money"
        title="Payments &amp; orders"
        description="Customers always pay Cartly Hub. This is everything that came in, and every order it created."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Collected"
          value={formatCurrency(totals.collected)}
          hint="Paid orders, gross"
          icon={CreditCard}
          tone="dark"
        />
        <StatCard
          label="Marketplace commission"
          value={formatCurrency(totals.commission)}
          icon={Percent}
        />
        <StatCard label="Online orders" value={totals.online} icon={ShoppingBag} />
        <StatCard label="WhatsApp orders" value={totals.whatsapp} icon={MessageCircle} />
      </div>

      <Panel title="Payments">
        {payments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No payments yet"
            description="Each online checkout creates one payment record, whatever it produced in orders."
          />
        ) : (
          <Table head={["Reference", "Provider", "Amount", "Status", "Orders", "Date"]}>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <Cell className="font-mono text-xs font-black text-black">
                  {payment.reference}
                </Cell>
                <Cell className="text-xs capitalize">{payment.provider}</Cell>
                <Cell className="font-black text-black whitespace-nowrap">
                  {formatCurrency(payment.amount, payment.currency)}
                </Cell>
                <Cell>
                  <Pill
                    tone={PAYMENT_TONES[payment.status] || "neutral"}
                    label={payment.status}
                  />
                  {payment.failureReason && (
                    <span className="block text-[10px] text-red-400 mt-1">
                      {payment.failureReason}
                    </span>
                  )}
                </Cell>
                <Cell className="text-xs text-gray-500 font-medium">
                  {(payment.orderNumbers || []).join(", ") || "—"}
                </Cell>
                <Cell className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </Cell>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <Panel title="All orders">
        {orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No orders yet" />
        ) : (
          <Table
            head={["Order", "Vendor", "Customer", "Channel", "Total", "Commission", "Status"]}
          >
            {orders.map((order) => (
              <tr key={order.id}>
                <Cell className="font-black text-black whitespace-nowrap">
                  {order.orderNumber || order.id.slice(0, 8)}
                </Cell>
                <Cell className="text-xs">{order.vendorStoreName || "—"}</Cell>
                <Cell className="text-xs text-gray-500 font-medium">
                  {order.customerName || "Guest"}
                </Cell>
                <Cell>
                  <Pill
                    tone={order.channel === ORDER_CHANNELS.WHATSAPP ? "green" : "emerald"}
                    label={order.channel || "—"}
                  />
                </Cell>
                <Cell className="font-black text-black whitespace-nowrap">
                  {formatCurrency(order.totalAmount, order.currency)}
                </Cell>
                <Cell className="text-xs">
                  {formatCurrency(order.commissionAmount, order.currency)}
                </Cell>
                <Cell>
                  <Pill
                    tone={order.paymentStatus === PAYMENT_STATUS.PAID ? "emerald" : "amber"}
                    label={ORDER_STATUS_LABELS[order.status] || order.status || "—"}
                  />
                </Cell>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}
