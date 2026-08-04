"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Store, ShieldCheck, ShieldOff, MessageCircle, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";
import { SELLING_MODES } from "@/services/marketplace/constants";
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

const MODE_META = {
  [SELLING_MODES.WHATSAPP]: { label: "WhatsApp only", tone: "green", icon: MessageCircle },
  [SELLING_MODES.ONLINE]: { label: "Online payments", tone: "emerald", icon: CreditCard },
  [SELLING_MODES.BOTH]: { label: "Both", tone: "black", icon: Sparkles },
};

/** All vendors on the marketplace, with their wallet and suspension controls. */
export default function AdminVendorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "marketplace"],
    queryFn: () => apiFetch("/api/admin/marketplace"),
  });

  const setSuspended = useMutation({
    mutationFn: ({ vendorId, action, reason }) =>
      apiFetch(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        body: { action, reason },
      }),
    onSuccess: (_result, variables) => {
      toast.success(
        variables.action === "suspend" ? "Vendor suspended" : "Vendor reinstated",
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "marketplace"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) return <LoadingState label="Loading vendors" />;

  const vendors = (data?.vendors || []).filter((vendor) =>
    `${vendor.storeName || ""} ${vendor.ownerName || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const suspended = (data?.vendors || []).filter((vendor) => vendor.isSuspended).length;
  const online = (data?.vendors || []).filter((vendor) => vendor.onlinePaymentsEnabled).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Marketplace"
        title="Vendors"
        description="Every store on Cartly Hub, how they sell, and what they're owed."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Vendors" value={data?.vendors?.length || 0} icon={Store} />
        <StatCard label="Taking online payments" value={online} icon={CreditCard} />
        <StatCard label="Suspended" value={suspended} icon={ShieldOff} />
        <StatCard
          label="Owed to vendors"
          value={formatCurrency(
            (data?.totals?.availableBalance || 0) + (data?.totals?.pendingBalance || 0),
          )}
          hint="Available + pending"
          tone="dark"
        />
      </div>

      <Panel
        title="Vendor list"
        action={
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search vendors"
            className="px-4 py-2 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none text-xs font-bold w-48"
          />
        }
      >
        {vendors.length === 0 ? (
          <EmptyState icon={Store} title="No vendors found" />
        ) : (
          <Table head={["Store", "Selling mode", "WhatsApp", "Wallet", "Status", "Action"]}>
            {vendors.map((vendor) => {
              const mode = MODE_META[vendor.sellingMode] || MODE_META[SELLING_MODES.WHATSAPP];
              const ModeIcon = mode.icon;

              return (
                <tr key={vendor.id}>
                  <Cell>
                    <span className="font-black text-black">{vendor.storeName || "—"}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                      {vendor.ownerName || "Unknown owner"}
                    </span>
                  </Cell>
                  <Cell>
                    <Pill tone={mode.tone} label={mode.label} icon={<ModeIcon className="h-3 w-3" />} />
                  </Cell>
                  <Cell className="text-xs text-gray-500 font-medium">
                    {vendor.whatsappNumber || "—"}
                  </Cell>
                  <Cell>
                    <span className="font-black text-black">
                      {formatCurrency(vendor.wallet?.availableBalance ?? 0)}
                    </span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      {formatCurrency(vendor.wallet?.pendingBalance ?? 0)} pending
                    </span>
                  </Cell>
                  <Cell>
                    {vendor.isSuspended ? (
                      <Pill tone="red" label="Suspended" />
                    ) : vendor.isVerified ? (
                      <Pill tone="emerald" label="Verified" icon={<ShieldCheck className="h-3 w-3" />} />
                    ) : (
                      <Pill tone="amber" label="Unverified" />
                    )}
                  </Cell>
                  <Cell>
                    <button
                      disabled={setSuspended.isPending}
                      onClick={() => {
                        if (vendor.isSuspended) {
                          setSuspended.mutate({ vendorId: vendor.id, action: "reinstate" });
                          return;
                        }
                        const reason = window.prompt(
                          `Why are you suspending ${vendor.storeName}?`,
                        );
                        if (reason === null) return;
                        setSuspended.mutate({ vendorId: vendor.id, action: "suspend", reason });
                      }}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
                        vendor.isSuspended
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-red-50 text-red-500 hover:bg-red-100"
                      }`}
                    >
                      {vendor.isSuspended ? "Reinstate" : "Suspend"}
                    </button>
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
