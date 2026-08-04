"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Percent, Loader2, Save, Truck, Banknote, Plug } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";
import {
  PageHeader,
  Panel,
  StatCard,
  Pill,
  LoadingState,
} from "@/components/marketplace/dashboard-ui";

/**
 * Marketplace configuration.
 *
 * The commission percentage set here applies to every online order created
 * from now on. Existing orders keep the rate they were created with, so
 * changing it never rewrites history or a vendor's past earnings.
 */
export default function AdminMarketplaceSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "marketplace"],
    queryFn: () => apiFetch("/api/admin/marketplace"),
  });

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (data?.settings && !form) setForm(data.settings);
  }, [data, form]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch("/api/admin/marketplace", {
        method: "PUT",
        body: {
          commissionPercent: Number(form.commissionPercent),
          minWithdrawalAmount: Number(form.minWithdrawalAmount),
          estimatedDeliveryDays: Number(form.estimatedDeliveryDays),
          activePaymentProvider: form.activePaymentProvider,
          autoProcessWithdrawals: Boolean(form.autoProcessWithdrawals),
        },
      }),
    onSuccess: () => {
      toast.success("Marketplace settings saved");
      queryClient.invalidateQueries({ queryKey: ["admin", "marketplace"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading || !form) return <LoadingState label="Loading settings" />;

  const example = 500;
  const exampleCommission = (example * Number(form.commissionPercent || 0)) / 100;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Configuration"
        title="Marketplace settings"
        description="Commission, payout rules and which gateway takes payments."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <Panel title="Commission &amp; payouts" className="lg:col-span-3">
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
          >
            <NumberField
              icon={Percent}
              label="Marketplace commission (%)"
              hint="Deducted from every online order before the vendor is credited."
              value={form.commissionPercent}
              min={0}
              max={100}
              step={0.5}
              onChange={(commissionPercent) => setForm({ ...form, commissionPercent })}
            />

            <NumberField
              icon={Banknote}
              label="Minimum withdrawal"
              hint="Vendors cannot request a payout smaller than this."
              value={form.minWithdrawalAmount}
              min={0}
              step={1}
              onChange={(minWithdrawalAmount) => setForm({ ...form, minWithdrawalAmount })}
            />

            <NumberField
              icon={Truck}
              label="Estimated delivery (days)"
              hint="Shown to customers on the order confirmation."
              value={form.estimatedDeliveryDays}
              min={0}
              step={1}
              onChange={(estimatedDeliveryDays) => setForm({ ...form, estimatedDeliveryDays })}
            />

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Plug className="h-3 w-3" />
                Active payment provider
              </label>
              <select
                value={form.activePaymentProvider}
                onChange={(event) =>
                  setForm({ ...form, activePaymentProvider: event.target.value })
                }
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
              >
                {/* An unconfigured provider stays selectable — disabling it
                    would make the current value unpickable and block saving. */}
                {(data.providers || []).map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.displayName}
                    {provider.configured ? "" : " — missing API key"}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                New providers appear here as soon as an adapter is registered — no changes to
                order, wallet or commission logic are needed.
              </p>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(form.autoProcessWithdrawals)}
                onChange={(event) =>
                  setForm({ ...form, autoProcessWithdrawals: event.target.checked })
                }
                className="mt-0.5 h-4 w-4 accent-black"
              />
              <span>
                <span className="block text-xs font-black uppercase tracking-tight">
                  Automate withdrawals
                </span>
                <span className="block text-[10px] text-gray-500 mt-1 leading-relaxed">
                  Reserved for when a payout provider is wired up. While this is off,
                  withdrawals stay in the manual review queue.
                </span>
              </span>
            </label>

            <button
              type="submit"
              disabled={save.isPending}
              className="w-full md:w-auto bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {save.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save settings
                </>
              )}
            </button>
          </form>
        </Panel>

        <div className="lg:col-span-2 space-y-6">
          <Panel title="Worked example">
            <div className="space-y-4">
              <Line label="Customer pays" value={formatCurrency(example)} />
              <Line
                label={`Commission (${form.commissionPercent}%)`}
                value={`− ${formatCurrency(exampleCommission)}`}
                tone="text-amber-600"
              />
              <div className="pt-4 border-t border-gray-100">
                <Line
                  label="Vendor wallet"
                  value={formatCurrency(example - exampleCommission)}
                  tone="text-emerald-600"
                  strong
                />
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Orders already placed keep the rate they were created with.
              </p>
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Vendors" value={data.vendors?.length || 0} />
            <StatCard
              label="Owed to vendors"
              value={formatCurrency(
                (data.totals?.availableBalance || 0) + (data.totals?.pendingBalance || 0),
              )}
              tone="dark"
            />
          </div>

          <Panel title="Providers">
            <div className="flex flex-wrap gap-2">
              {(data.providers || []).map((provider) => (
                <Pill
                  key={provider.id}
                  tone={provider.configured ? "emerald" : "neutral"}
                  label={`${provider.displayName}${provider.configured ? "" : " — not configured"}`}
                />
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

const Line = ({ label, value, tone = "text-gray-900", strong }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
      {label}
    </span>
    <span className={`${strong ? "text-xl" : "text-sm"} font-black ${tone}`}>{value}</span>
  </div>
);

const NumberField = ({ icon: Icon, label, hint, value, onChange, ...rest }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
      <Icon className="h-3 w-3" />
      {label}
    </label>
    <input
      type="number"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-black text-lg"
      {...rest}
    />
    {hint && <p className="text-[10px] text-gray-400 leading-relaxed">{hint}</p>}
  </div>
);
