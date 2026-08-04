"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Check, X, Send, Inbox } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";
import { WITHDRAWAL_STATUS } from "@/services/marketplace/constants";
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

const FILTERS = [
  { value: WITHDRAWAL_STATUS.PENDING, label: "Pending" },
  { value: WITHDRAWAL_STATUS.APPROVED, label: "Approved" },
  { value: WITHDRAWAL_STATUS.PAID, label: "Paid" },
  { value: WITHDRAWAL_STATUS.REJECTED, label: "Rejected" },
  { value: "all", label: "All" },
];

/**
 * Withdrawal review queue.
 *
 * Approve → the vendor is told it's on the way. Mark paid → the money clears
 * out of their pending balance. Reject → it goes straight back to available.
 */
export default function AdminWithdrawalsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState(WITHDRAWAL_STATUS.PENDING);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "marketplace"],
    queryFn: () => apiFetch("/api/admin/marketplace"),
  });

  const review = useMutation({
    mutationFn: ({ id, action, note, payoutReference }) =>
      apiFetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        body: { action, note, payoutReference },
      }),
    onSuccess: (_result, variables) => {
      toast.success(`Withdrawal ${variables.action === "pay" ? "marked paid" : `${variables.action}d`}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "marketplace"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) return <LoadingState label="Loading withdrawals" />;

  const all = data?.withdrawals || [];
  const visible = filter === "all" ? all : all.filter((entry) => entry.status === filter);

  const pendingValue = all
    .filter((entry) => entry.status === WITHDRAWAL_STATUS.PENDING)
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Payouts"
        title="Withdrawals"
        description="Review vendor payout requests. Funds are already held against the vendor's wallet, so rejecting a request simply returns them."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Awaiting review"
          value={all.filter((entry) => entry.status === WITHDRAWAL_STATUS.PENDING).length}
          icon={Inbox}
          tone="dark"
        />
        <StatCard label="Value awaiting review" value={formatCurrency(pendingValue)} icon={Banknote} />
        <StatCard
          label="Approved, unpaid"
          value={all.filter((entry) => entry.status === WITHDRAWAL_STATUS.APPROVED).length}
        />
        <StatCard
          label="Paid out (lifetime)"
          value={formatCurrency(data?.totals?.totalWithdrawals || 0)}
        />
      </div>

      <Panel
        title="Requests"
        action={
          <div className="flex flex-wrap gap-1.5">
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
        {visible.length === 0 ? (
          <EmptyState icon={Inbox} title="Nothing in this queue" />
        ) : (
          <Table head={["Requested", "Vendor", "Destination", "Amount", "Status", "Actions"]}>
            {visible.map((withdrawal) => (
              <tr key={withdrawal.id}>
                <Cell className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(withdrawal.requestedAt).toLocaleDateString()}
                </Cell>
                <Cell className="font-black text-black">
                  {withdrawal.vendorStoreName || withdrawal.vendorId}
                </Cell>
                <Cell className="text-xs text-gray-500 font-medium">
                  {withdrawal.methodLabel}
                  <span className="block text-[10px] text-gray-400 mt-0.5">
                    {withdrawal.destination?.accountName} · {withdrawal.destination?.accountNumber}
                    {withdrawal.destination?.bankName ? ` · ${withdrawal.destination.bankName}` : ""}
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
                </Cell>
                <Cell>
                  <div className="flex flex-wrap gap-1.5">
                    {withdrawal.status === WITHDRAWAL_STATUS.PENDING && (
                      <ActionButton
                        tone="emerald"
                        icon={Check}
                        label="Approve"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: withdrawal.id, action: "approve" })}
                      />
                    )}
                    {withdrawal.status !== WITHDRAWAL_STATUS.PAID &&
                      withdrawal.status !== WITHDRAWAL_STATUS.REJECTED && (
                        <ActionButton
                          tone="black"
                          icon={Send}
                          label="Mark paid"
                          disabled={review.isPending}
                          onClick={() => {
                            const payoutReference = window.prompt(
                              "Payout reference (optional)",
                              "",
                            );
                            if (payoutReference === null) return;
                            review.mutate({
                              id: withdrawal.id,
                              action: "pay",
                              payoutReference,
                            });
                          }}
                        />
                      )}
                    {withdrawal.status !== WITHDRAWAL_STATUS.PAID &&
                      withdrawal.status !== WITHDRAWAL_STATUS.REJECTED && (
                        <ActionButton
                          tone="red"
                          icon={X}
                          label="Reject"
                          disabled={review.isPending}
                          onClick={() => {
                            const note = window.prompt("Reason for rejecting?");
                            if (note === null) return;
                            review.mutate({ id: withdrawal.id, action: "reject", note });
                          }}
                        />
                      )}
                  </div>
                </Cell>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}

const TONES = {
  emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
  red: "bg-red-50 text-red-500 hover:bg-red-100",
  black: "bg-black text-white hover:bg-gray-800",
};

const ActionButton = ({ icon: Icon, label, tone, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${TONES[tone]}`}
  >
    <Icon className="h-3 w-3" />
    {label}
  </button>
);
