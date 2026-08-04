"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  CreditCard,
  User,
  MapPin,
  Wallet,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/utils/apiClient";
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
  Pill,
  LoadingState,
  StatCard,
} from "@/components/marketplace/dashboard-ui";

/** Statuses a vendor can set themselves, in the order they normally happen. */
const VENDOR_ACTIONS = [
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
];

export default function SellerOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch(`/api/orders/${id}`)
      .then((data) => !cancelled && setOrder(data.order))
      .catch((error) => !cancelled && toast.error(error.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleStatus = async (status) => {
    setSaving(status);
    try {
      await apiFetch(`/api/orders/${id}`, { method: "PATCH", body: { status } });
      setOrder((current) => ({ ...current, status }));
      toast.success(`Order marked ${ORDER_STATUS_LABELS[status].toLowerCase()}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <LoadingState label="Loading order" />;
  if (!order) return null;

  const isPaid = order.paymentStatus === PAYMENT_STATUS.PAID;

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.push("/seller/orders")}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All orders
      </button>

      <PageHeader
        eyebrow={order.createdAt ? new Date(order.createdAt).toLocaleString() : "Order"}
        title={order.orderNumber}
        actions={
          <div className="flex flex-wrap gap-2">
            <Pill
              tone={order.channel === ORDER_CHANNELS.WHATSAPP ? "green" : "emerald"}
              icon={
                order.channel === ORDER_CHANNELS.WHATSAPP ? (
                  <MessageCircle className="h-3 w-3" />
                ) : (
                  <CreditCard className="h-3 w-3" />
                )
              }
              label={order.channel === ORDER_CHANNELS.WHATSAPP ? "WhatsApp order" : "Online order"}
            />
            <Pill
              tone={isPaid ? "emerald" : "amber"}
              label={isPaid ? "Paid" : "Awaiting payment"}
            />
            <Pill
              tone="black"
              label={ORDER_STATUS_LABELS[order.status] || order.status}
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Order total" value={formatCurrency(order.totalAmount, order.currency)} />
        <StatCard
          label={`Commission (${order.commissionRate || 0}%)`}
          value={formatCurrency(order.commissionAmount, order.currency)}
          icon={Percent}
        />
        <StatCard
          label="Your earnings"
          value={formatCurrency(order.vendorEarnings, order.currency)}
          hint={order.walletCredited ? "Credited to your wallet" : "Credited once paid"}
          icon={Wallet}
          tone="dark"
        />
        <StatCard
          label="Items"
          value={(order.items || []).reduce((count, item) => count + item.quantity, 0)}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Items" className="lg:col-span-2">
          <div className="space-y-5">
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
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Customer">
            <div className="space-y-4 text-sm font-bold text-gray-700">
              <div className="flex gap-3">
                <User className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                <div>
                  <p>{order.customerName || "Guest"}</p>
                  <p className="text-gray-400 font-medium text-xs mt-0.5">
                    {order.customerPhone || "No phone"}
                  </p>
                  <p className="text-gray-400 font-medium text-xs">
                    {order.customerEmail || "No email"}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                <p className="text-gray-500 font-medium text-xs leading-relaxed">
                  {[order.deliveryAddress?.details, order.deliveryAddress?.city]
                    .filter(Boolean)
                    .join(", ") || "No address supplied"}
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Update status">
            <div className="grid grid-cols-2 gap-2">
              {VENDOR_ACTIONS.map((status) => (
                <button
                  key={status}
                  disabled={saving === status || order.status === status}
                  onClick={() => handleStatus(status)}
                  className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40 ${
                    status === ORDER_STATUS.CANCELLED
                      ? "bg-red-50 text-red-500 hover:bg-red-100"
                      : "bg-gray-50 text-gray-600 hover:bg-black hover:text-white"
                  }`}
                >
                  {ORDER_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-4 leading-relaxed">
              The customer is notified in the app each time you change this.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
