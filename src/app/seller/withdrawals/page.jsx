"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Smartphone, Landmark, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";
import {
  WITHDRAWAL_METHODS,
  WITHDRAWAL_STATUS,
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

const STATUS_TONES = {
  [WITHDRAWAL_STATUS.PENDING]: "amber",
  [WITHDRAWAL_STATUS.APPROVED]: "blue",
  [WITHDRAWAL_STATUS.PAID]: "emerald",
  [WITHDRAWAL_STATUS.REJECTED]: "red",
};

/** Request a payout to mobile money or a bank account, and track past ones. */
export default function SellerWithdrawalsPage() {
  const queryClient = useQueryClient();

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["seller", "wallet"],
    queryFn: () => apiFetch("/api/wallet"),
  });

  const { data: withdrawalData, isLoading: listLoading } = useQuery({
    queryKey: ["seller", "withdrawals"],
    queryFn: () => apiFetch("/api/withdrawals"),
  });

  const [form, setForm] = useState({
    amount: "",
    method: WITHDRAWAL_METHODS[0].value,
    accountName: "",
    accountNumber: "",
    bankName: "",
    branch: "",
  });

  const selectedMethod = WITHDRAWAL_METHODS.find((entry) => entry.value === form.method);
  const isBank = selectedMethod?.kind === "bank";

  const wallet = walletData?.wallet || {};
  const currency = wallet.currency || "GHS";
  const minimum = walletData?.minWithdrawalAmount ?? 0;

  const requestWithdrawal = useMutation({
    mutationFn: () =>
      apiFetch("/api/withdrawals", {
        method: "POST",
        body: {
          amount: Number(form.amount),
          method: form.method,
          destination: {
            accountName: form.accountName,
            accountNumber: form.accountNumber,
            bankName: isBank ? form.bankName : null,
            branch: isBank ? form.branch : null,
          },
        },
      }),
    onSuccess: (data) => {
      toast.success(
        `Withdrawal of ${formatCurrency(data.withdrawal.amount, currency)} submitted for review`,
      );
      setForm({ ...form, amount: "" });
      queryClient.invalidateQueries({ queryKey: ["seller", "withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["seller", "wallet"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (walletLoading) return <LoadingState label="Loading wallet" />;

  const withdrawals = withdrawalData?.withdrawals || [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Payouts"
        title="Withdrawals"
        description="Requests are reviewed by the Cartly Hub team before the money is sent. The amount leaves your available balance straight away so it cannot be spent twice."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Available"
          value={formatCurrency(wallet.availableBalance, currency)}
          icon={Banknote}
          tone="dark"
        />
        <StatCard label="Pending" value={formatCurrency(wallet.pendingBalance, currency)} />
        <StatCard
          label="Minimum withdrawal"
          value={formatCurrency(minimum, currency)}
          hint="Set by the marketplace"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Panel title="New withdrawal" className="lg:col-span-2">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              requestWithdrawal.mutate();
            }}
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Amount ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                placeholder="0.00"
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-black text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Withdraw to
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WITHDRAWAL_METHODS.map((method) => {
                  const Icon = method.kind === "bank" ? Landmark : Smartphone;
                  const active = form.method === method.value;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setForm({ ...form, method: method.value })}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        active ? "bg-black text-white" : "bg-gray-50 text-gray-500 hover:text-black"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-left leading-tight">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Account name
              </label>
              <input
                required
                value={form.accountName}
                onChange={(event) => setForm({ ...form, accountName: event.target.value })}
                placeholder="Name on the account"
                className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {isBank ? "Account number" : "Mobile money number"}
              </label>
              <input
                required
                value={form.accountNumber}
                onChange={(event) => setForm({ ...form, accountNumber: event.target.value })}
                placeholder={isBank ? "0123456789" : "0241234567"}
                className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
              />
            </div>

            {isBank && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Bank
                  </label>
                  <input
                    required
                    value={form.bankName}
                    onChange={(event) => setForm({ ...form, bankName: event.target.value })}
                    className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Branch
                  </label>
                  <input
                    value={form.branch}
                    onChange={(event) => setForm({ ...form, branch: event.target.value })}
                    className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={requestWithdrawal.isPending}
              className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {requestWithdrawal.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Request withdrawal"
              )}
            </button>
          </form>
        </Panel>

        <Panel title="Your requests" className="lg:col-span-3">
          {listLoading ? (
            <LoadingState label="Loading requests" />
          ) : withdrawals.length === 0 ? (
            <EmptyState
              icon={History}
              title="No withdrawals yet"
              description="Once you request a payout it will show up here with its review status."
            />
          ) : (
            <Table head={["Requested", "Method", "Destination", "Amount", "Status"]}>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <Cell className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(withdrawal.requestedAt).toLocaleDateString()}
                  </Cell>
                  <Cell className="text-xs">{withdrawal.methodLabel}</Cell>
                  <Cell className="text-xs text-gray-500 font-medium">
                    {withdrawal.destination?.accountName}
                    <span className="block text-[10px] text-gray-400">
                      {withdrawal.destination?.accountNumber}
                    </span>
                  </Cell>
                  <Cell className="font-black text-black whitespace-nowrap">
                    {formatCurrency(withdrawal.amount, withdrawal.currency)}
                  </Cell>
                  <Cell>
                    <Pill
                      tone={STATUS_TONES[withdrawal.status] || "neutral"}
                      label={withdrawal.status}
                    />
                    {withdrawal.adminNote && (
                      <span className="block text-[10px] text-gray-400 mt-1 font-medium">
                        {withdrawal.adminNote}
                      </span>
                    )}
                  </Cell>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </div>
  );
}
