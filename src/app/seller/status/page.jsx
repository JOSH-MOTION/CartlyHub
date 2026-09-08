"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, Trash2 } from "lucide-react";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";
import { PageHeader, Panel, EmptyState, LoadingState } from "@/components/marketplace/dashboard-ui";
import StatusComposer, { MAX_ACTIVE_STATUSES as MAX_ACTIVE } from "@/components/StatusComposer";

const timeLeft = (expiresAt) => {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expiring…";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
};

export default function SellerStatusPage() {
  const queryClient = useQueryClient();

  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ["seller", "statuses"],
    queryFn: async () => (await apiFetch("/api/seller/status")).statuses,
  });

  const activeCount = statuses.filter((s) => new Date(s.expiresAt).getTime() > Date.now()).length;

  const handleDelete = async (status) => {
    if (!confirm("Remove this status now?")) return;
    try {
      await apiFetch(`/api/seller/status/${status.id}`, { method: "DELETE" });
      toast.success("Status removed");
      queryClient.invalidateQueries({ queryKey: ["seller", "statuses"] });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="Status"
        description="A quick photo on the homepage for 24 hours, then it's gone — image and record both permanently deleted. No listing, no stock needed, just a flash post."
      />

      <Panel title={`Post a status (${activeCount}/${MAX_ACTIVE} active)`}>
        <StatusComposer
          activeCount={activeCount}
          onPosted={() => queryClient.invalidateQueries({ queryKey: ["seller", "statuses"] })}
        />
      </Panel>

      <Panel title="Your statuses">
        {isLoading ? (
          <LoadingState />
        ) : statuses.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No statuses yet"
            description="Post a photo above — it goes live on the homepage right away."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statuses.map((status) => {
              const isActive = new Date(status.expiresAt).getTime() > Date.now();
              return (
                <div key={status.id} className="rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="relative h-32">
                    <img src={status.image} alt="" className="w-full h-full object-cover" />
                    {!isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Expired</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1.5">
                    {status.caption && <p className="text-xs font-bold truncate">{status.caption}</p>}
                    {status.price && <p className="text-xs text-gray-500">{formatCurrency(status.price)}</p>}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {isActive ? timeLeft(status.expiresAt) : "Gone"}
                      </span>
                      {isActive && (
                        <button
                          onClick={() => handleDelete(status)}
                          className="h-7 w-7 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition-colors"
                          aria-label="Delete status"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
