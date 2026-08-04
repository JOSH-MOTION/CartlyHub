"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet, Clock, TrendingUp, Banknote } from "lucide-react";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";
import {
  PageHeader,
  Panel,
  StatCard,
  Table,
  Cell,
  EmptyState,
  LoadingState,
} from "@/components/marketplace/dashboard-ui";

/** What Cartly Hub currently owes each vendor. */
export default function AdminWalletsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "marketplace"],
    queryFn: () => apiFetch("/api/admin/marketplace"),
  });

  if (isLoading) return <LoadingState label="Loading wallets" />;

  const vendorNames = new Map(
    (data?.vendors || []).map((vendor) => [vendor.id, vendor.storeName]),
  );

  const wallets = [...(data?.wallets || [])].sort(
    (a, b) => Number(b.availableBalance || 0) - Number(a.availableBalance || 0),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Treasury"
        title="Wallet balances"
        description="Money collected into Cartly Hub's Paystack account and attributed to vendors. Available plus pending is your outstanding payout liability."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Available across vendors"
          value={formatCurrency(data?.totals?.availableBalance || 0)}
          icon={Wallet}
          tone="dark"
        />
        <StatCard
          label="Pending withdrawals"
          value={formatCurrency(data?.totals?.pendingBalance || 0)}
          icon={Clock}
        />
        <StatCard
          label="Lifetime vendor earnings"
          value={formatCurrency(data?.totals?.totalEarnings || 0)}
          icon={TrendingUp}
        />
        <StatCard
          label="Lifetime payouts"
          value={formatCurrency(data?.totals?.totalWithdrawals || 0)}
          icon={Banknote}
        />
      </div>

      <Panel title="Per vendor">
        {wallets.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No wallets yet"
            description="A wallet is created the first time a vendor earns from a paid order."
          />
        ) : (
          <Table head={["Vendor", "Available", "Pending", "Total earnings", "Withdrawn", "Updated"]}>
            {wallets.map((wallet) => (
              <tr key={wallet.vendorId}>
                <Cell className="font-black text-black">
                  {vendorNames.get(wallet.vendorId) || wallet.vendorId}
                </Cell>
                <Cell className="font-black text-black">
                  {formatCurrency(wallet.availableBalance, wallet.currency)}
                </Cell>
                <Cell className="text-amber-600">
                  {formatCurrency(wallet.pendingBalance, wallet.currency)}
                </Cell>
                <Cell>{formatCurrency(wallet.totalEarnings, wallet.currency)}</Cell>
                <Cell>{formatCurrency(wallet.totalWithdrawals, wallet.currency)}</Cell>
                <Cell className="text-xs text-gray-400">
                  {wallet.updatedAt ? new Date(wallet.updatedAt).toLocaleDateString() : "—"}
                </Cell>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}
