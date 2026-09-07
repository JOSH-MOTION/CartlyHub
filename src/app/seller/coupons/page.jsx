"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Ticket, Trash2, X } from "lucide-react";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";
import { PageHeader, Panel, Pill, EmptyState, LoadingState, Table, Cell } from "@/components/marketplace/dashboard-ui";

// Mirrors COUPON_TYPES in services/marketplace/coupon-service.js — kept as a
// plain constant here rather than imported, because that service pulls in
// firebase-admin (Node-only) and this is a client component.
const COUPON_TYPES = { PERCENT: "PERCENT", FIXED: "FIXED" };

const EMPTY_FORM = { code: "", type: COUPON_TYPES.PERCENT, value: "", minOrderAmount: "", maxUses: "", expiresAt: "" };

export default function SellerCouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["seller", "coupons"],
    queryFn: async () => (await apiFetch("/api/seller/coupons")).coupons,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiFetch("/api/seller/coupons", {
        method: "POST",
        body: {
          code: form.code,
          type: form.type,
          value: Number(form.value),
          minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt || null,
        },
      });
      toast.success(`Coupon ${form.code.toUpperCase()} created`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["seller", "coupons"] });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await apiFetch(`/api/seller/coupons/${coupon.id}`, {
        method: "PATCH",
        body: { isActive: !coupon.isActive },
      });
      queryClient.invalidateQueries({ queryKey: ["seller", "coupons"] });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (coupon) => {
    if (!confirm(`Delete coupon ${coupon.code}? This can't be undone.`)) return;
    try {
      await apiFetch(`/api/seller/coupons/${coupon.id}`, { method: "DELETE" });
      toast.success(`Coupon ${coupon.code} deleted`);
      queryClient.invalidateQueries({ queryKey: ["seller", "coupons"] });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Coupons"
        description="Discount codes only your store's buyers can use — the cost comes out of your own earnings, not Cartly Hub's commission."
        actions={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 px-4 py-3 rounded-xl text-xs font-bold transition-colors"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "New coupon"}
          </button>
        }
      />

      {showForm && (
        <Panel title="Create a coupon">
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <FormField label="Code *">
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-black transition-all"
              />
            </FormField>

            <FormField label="Discount type *">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-black transition-all"
              >
                <option value={COUPON_TYPES.PERCENT}>Percentage off</option>
                <option value={COUPON_TYPES.FIXED}>Fixed amount off (GHS)</option>
              </select>
            </FormField>

            <FormField label={form.type === COUPON_TYPES.PERCENT ? "Percent off *" : "Amount off (GHS) *"}>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === COUPON_TYPES.PERCENT ? "10" : "20"}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-black transition-all"
              />
            </FormField>

            <FormField label="Minimum order (GHS)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                placeholder="Optional"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-black transition-all"
              />
            </FormField>

            <FormField label="Max uses">
              <input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="Unlimited"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-black transition-all"
              />
            </FormField>

            <FormField label="Expires on">
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-black transition-all"
              />
            </FormField>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-black text-white hover:bg-gray-800 px-6 py-3.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSaving ? "Creating…" : "Create coupon"}
              </button>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="Your coupons">
        {isLoading ? (
          <LoadingState />
        ) : coupons.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No coupons yet"
            description="Create a code and share it with customers — it only discounts orders from your store."
          />
        ) : (
          <Table head={["Code", "Discount", "Min. order", "Used", "Status", ""]}>
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <Cell className="font-black">{coupon.code}</Cell>
                <Cell>
                  {coupon.type === COUPON_TYPES.PERCENT
                    ? `${coupon.value}% off`
                    : `${formatCurrency(coupon.value)} off`}
                </Cell>
                <Cell>{coupon.minOrderAmount ? formatCurrency(coupon.minOrderAmount) : "—"}</Cell>
                <Cell>
                  {coupon.usedCount}
                  {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                </Cell>
                <Cell>
                  <button onClick={() => handleToggle(coupon)}>
                    <Pill
                      tone={coupon.isActive ? "emerald" : "neutral"}
                      label={coupon.isActive ? "Active" : "Paused"}
                    />
                  </button>
                </Cell>
                <Cell>
                  <button
                    onClick={() => handleDelete(coupon)}
                    className="h-8 w-8 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition-colors"
                    aria-label={`Delete ${coupon.code}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Cell>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}

const FormField = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">
      {label}
    </label>
    {children}
  </div>
);
