"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Wallet, Clock, TrendingUp, Banknote, ArrowUpRight, Receipt } from "lucide-react";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";
import { WALLET_TRANSACTION_TYPES } from "@/services/marketplace/constants";
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

const TYPE_LABELS = {
  [WALLET_TRANSACTION_TYPES.EARNING]: "Order earnings",
  [WALLET_TRANSACTION_TYPES.WITHDRAWAL_HOLD]: "Withdrawal requested",
  [WALLET_TRANSACTION_TYPES.WITHDRAWAL_PAID]: "Withdrawal paid",
  [WALLET_TRANSACTION_TYPES.WITHDRAWAL_REVERSAL]: "Withdrawal returned",
  [WALLET_TRANSACTION_TYPES.ADJUSTMENT]: "Adjustment",
  [WALLET_TRANSACTION_TYPES.REFUND]: "Refund",
};

/**
 * Vendor wallet.
 *
 * Money sits here until the vendor asks for it — available is withdrawable
 * now, pending is held against a request the platform is reviewing.
 */
export default function SellerWalletPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["seller", "wallet"],
    queryFn: () => apiFetch("/api/wallet"),
  });

  if (isLoading) return <LoadingState label="Loading wallet" />;

  const wallet = data?.wallet || {};
  const transactions = data?.transactions || [];
  const currency = wallet.currency || "GHS";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Earnings"
        title="Wallet"
        description={`Cartly Hub keeps ${data?.commissionPercent ?? 5}% of each online order. The rest lands here the moment a payment clears.`}
        actions={
          <button
            onClick={() => router.push("/seller/withdrawals")}
            className="bg-black text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            <ArrowUpRight className="h-4 w-4" />
            Withdraw
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Available balance"
          value={formatCurrency(wallet.availableBalance, currency)}
          hint="Ready to withdraw"
          icon={Wallet}
          tone="dark"
        />
        <StatCard
          label="Pending balance"
          value={formatCurrency(wallet.pendingBalance, currency)}
          hint="Held against a request"
          icon={Clock}
        />
        <StatCard
          label="Total earnings"
          value={formatCurrency(wallet.totalEarnings, currency)}
          hint="Lifetime, after commission"
          icon={TrendingUp}
        />
        <StatCard
          label="Total withdrawals"
          value={formatCurrency(wallet.totalWithdrawals, currency)}
          hint="Lifetime paid out"
          icon={Banknote}
        />
      </div>

      <Panel title="Transaction history">
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Every paid order and every withdrawal shows up here with a running balance."
          />
        ) : (
          <Table head={["Date", "Type", "Description", "Amount", "Balance after"]}>
            {transactions.map((entry) => {
              const isCredit = entry.direction === "credit";
              return (
                <tr key={entry.id}>
                  <Cell className="whitespace-nowrap text-gray-400 text-xs">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </Cell>
                  <Cell>
                    <Pill
                      tone={isCredit ? "emerald" : "amber"}
                      label={TYPE_LABELS[entry.type] || entry.type}
                    />
                  </Cell>
                  <Cell className="text-gray-500 font-medium text-xs">
                    {entry.description}
                    {entry.orderNumber && (
                      <span className="block text-[10px] text-gray-400 mt-0.5">
                        {entry.orderNumber}
                        {entry.commissionAmount
                          ? ` • commission ${formatCurrency(entry.commissionAmount, currency)}`
                          : ""}
                      </span>
                    )}
                  </Cell>
                  <Cell className={isCredit ? "text-emerald-600" : "text-gray-900"}>
                    {isCredit ? "+" : "−"}
                    {formatCurrency(entry.amount, currency)}
                  </Cell>
                  <Cell className="text-gray-400 text-xs">
                    {formatCurrency(entry.balanceAfter, currency)}
                  </Cell>
                </tr>
              );
            })}
          </Table>
        )}
      </Panel>
    </div>
  );
}
