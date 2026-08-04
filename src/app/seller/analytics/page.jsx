"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  MessageCircle,
  CreditCard,
  Percent,
  Trophy,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getVendorOrders } from "@/utils/marketplaceData";
import { formatCurrency } from "@/services/payments/money";
import { ORDER_CHANNELS, PAYMENT_STATUS } from "@/services/marketplace/constants";
import {
  PageHeader,
  Panel,
  StatCard,
  Table,
  Cell,
  EmptyState,
  LoadingState,
} from "@/components/marketplace/dashboard-ui";

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

/** Sales performance derived from this vendor's own orders. */
export default function SellerAnalyticsPage() {
  const { sellerProfile } = useApp();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller", "orders", sellerProfile?.uid],
    queryFn: () => getVendorOrders(sellerProfile?.uid),
    enabled: Boolean(sellerProfile?.uid),
  });

  const analytics = useMemo(() => {
    const paid = orders.filter((order) => order.paymentStatus === PAYMENT_STATUS.PAID);

    const revenue = paid.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const earnings = paid.reduce((sum, order) => sum + Number(order.vendorEarnings || 0), 0);
    const commission = paid.reduce((sum, order) => sum + Number(order.commissionAmount || 0), 0);

    const months = new Map();
    for (const order of paid) {
      const key = monthKey(order.createdAt);
      months.set(key, (months.get(key) || 0) + Number(order.totalAmount || 0));
    }

    const products = new Map();
    for (const order of paid) {
      for (const item of order.items || []) {
        const entry = products.get(item.productId) || {
          name: item.productName,
          units: 0,
          revenue: 0,
        };
        entry.units += Number(item.quantity || 0);
        entry.revenue += Number(item.lineTotal || item.price * item.quantity || 0);
        products.set(item.productId, entry);
      }
    }

    return {
      revenue,
      earnings,
      commission,
      paidCount: paid.length,
      averageOrder: paid.length ? revenue / paid.length : 0,
      whatsappCount: orders.filter((order) => order.channel === ORDER_CHANNELS.WHATSAPP).length,
      onlineCount: orders.filter((order) => order.channel === ORDER_CHANNELS.ONLINE).length,
      months: Array.from(months.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6),
      topProducts: Array.from(products.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    };
  }, [orders]);

  if (isLoading) return <LoadingState label="Crunching your numbers" />;

  const peak = Math.max(...analytics.months.map(([, value]) => value), 1);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Performance"
        title="Analytics"
        description="How your store is doing, based on orders that were actually paid for."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gross sales"
          value={formatCurrency(analytics.revenue)}
          icon={TrendingUp}
        />
        <StatCard
          label="Your earnings"
          value={formatCurrency(analytics.earnings)}
          hint="After commission"
          tone="dark"
        />
        <StatCard
          label="Commission paid"
          value={formatCurrency(analytics.commission)}
          icon={Percent}
        />
        <StatCard
          label="Average order"
          value={formatCurrency(analytics.averageOrder)}
          icon={BarChart3}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Panel title="Sales over the last 6 months" className="lg:col-span-3">
          {analytics.months.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Not enough data yet"
              description="Your monthly trend appears once you have paid orders."
            />
          ) : (
            <div className="flex items-end gap-3 h-52">
              {analytics.months.map(([month, value]) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-3">
                  <span className="text-[9px] font-black text-gray-400">
                    {formatCurrency(value).replace(/\.00$/, "")}
                  </span>
                  <div
                    className="w-full bg-black rounded-t-xl transition-all min-h-[4px]"
                    style={{ height: `${Math.max(4, (value / peak) * 100)}%` }}
                  />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    {month.slice(5)}/{month.slice(2, 4)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Order channels" className="lg:col-span-2">
          <div className="space-y-5">
            <ChannelRow
              icon={CreditCard}
              label="Online payments"
              count={analytics.onlineCount}
              total={orders.length}
              tone="bg-black"
            />
            <ChannelRow
              icon={MessageCircle}
              label="WhatsApp orders"
              count={analytics.whatsappCount}
              total={orders.length}
              tone="bg-[#25D366]"
            />
          </div>
        </Panel>
      </div>

      <Panel title="Best sellers">
        {analytics.topProducts.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No sales yet"
            description="Your top products by revenue will be listed here."
          />
        ) : (
          <Table head={["Product", "Units sold", "Revenue"]}>
            {analytics.topProducts.map((product) => (
              <tr key={product.name}>
                <Cell className="font-black text-black">{product.name}</Cell>
                <Cell>{product.units}</Cell>
                <Cell className="font-black">{formatCurrency(product.revenue)}</Cell>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}

const ChannelRow = ({ icon: Icon, label, count, total, tone }) => {
  const share = total ? Math.round((count / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="flex items-center gap-2 text-gray-500">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="text-black">
          {count} · {share}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${tone} rounded-full`} style={{ width: `${share}%` }} />
      </div>
    </div>
  );
};
