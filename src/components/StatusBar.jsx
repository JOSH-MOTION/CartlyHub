"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, ChevronLeft, ChevronRight, MessageCircle, Store, Plus, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";

/** Ephemeral seller status strip — live 24h, gone after (and permanently deleted server-side). */
export default function StatusBar() {
  const router = useRouter();
  const { user, sellerProfile } = useApp();
  const [openSellerIndex, setOpenSellerIndex] = useState(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const { data: sellers = [] } = useQuery({
    queryKey: ["statuses", "active"],
    queryFn: async () => (await apiFetch("/api/statuses")).sellers,
    refetchInterval: 60000,
  });

  if (sellers.length === 0 && !sellerProfile) return null;

  const openSeller = openSellerIndex !== null ? sellers[openSellerIndex] : null;
  const status = openSeller?.statuses?.[statusIndex];

  const openViewer = (index) => {
    setOpenSellerIndex(index);
    setStatusIndex(0);
  };

  const closeViewer = () => setOpenSellerIndex(null);

  const next = () => {
    if (!openSeller) return;
    if (statusIndex < openSeller.statuses.length - 1) {
      setStatusIndex(statusIndex + 1);
    } else if (openSellerIndex < sellers.length - 1) {
      setOpenSellerIndex(openSellerIndex + 1);
      setStatusIndex(0);
    } else {
      closeViewer();
    }
  };

  const prev = () => {
    if (statusIndex > 0) {
      setStatusIndex(statusIndex - 1);
    } else if (openSellerIndex > 0) {
      const prevSeller = sellers[openSellerIndex - 1];
      setOpenSellerIndex(openSellerIndex - 1);
      setStatusIndex(prevSeller.statuses.length - 1);
    }
  };

  const handleMessageSeller = async () => {
    if (!user) {
      router.push("/account/signin");
      return;
    }
    setIsStartingChat(true);
    try {
      const { id } = await apiFetch("/api/messages/start", { method: "POST", body: { statusId: status.id } });
      router.push(`/messages/${id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsStartingChat(false);
    }
  };

  const whatsappHref = status?.whatsappNumber
    ? `https://wa.me/${status.whatsappNumber.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
        `Hi! I saw your status on Cartly Hub${status.caption ? ` — "${status.caption}"` : ""}. Still available?`,
      )}`
    : null;

  return (
    <>
      <div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {sellerProfile && (
            <button
              onClick={() => router.push("/seller/status")}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="h-16 w-16 rounded-full border-2 border-dashed border-gray-300 group-hover:border-black flex items-center justify-center bg-gray-50 transition-colors">
                <Plus className="h-6 w-6 text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wide group-hover:text-black transition-colors">
                Add status
              </span>
            </button>
          )}

          {sellers.map((seller, index) => (
            <button
              key={seller.sellerId}
              onClick={() => openViewer(index)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500">
                <div className="h-full w-full rounded-full border-2 border-white overflow-hidden bg-gray-100 flex items-center justify-center">
                  {seller.storeLogo ? (
                    <img src={seller.storeLogo} alt={seller.storeName} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </div>
              <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wide max-w-[64px] truncate group-hover:text-black transition-colors">
                {seller.storeName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {status && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 z-10">
            {openSeller.statuses.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full bg-white ${i <= statusIndex ? "w-full" : "w-0"}`} />
              </div>
            ))}
          </div>

          <button
            onClick={closeViewer}
            className="absolute top-8 right-4 z-10 h-9 w-9 bg-black/40 text-white rounded-full flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            onClick={prev}
            className="absolute left-2 sm:left-6 z-10 h-10 w-10 bg-black/40 text-white rounded-full flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-6 z-10 h-10 w-10 bg-black/40 text-white rounded-full flex items-center justify-center"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="max-w-md w-full h-full sm:h-auto sm:max-h-[85vh] flex flex-col">
            <img src={status.image} alt={status.caption} className="w-full h-full sm:h-auto sm:max-h-[70vh] object-contain" />
            <div className="bg-black/80 p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{status.storeName}</p>
              {status.caption && <p className="text-sm text-white font-medium leading-relaxed">{status.caption}</p>}
              {status.price && <p className="text-lg font-black text-white">{formatCurrency(status.price)}</p>}

              {status.sellerId !== user?.id && (
                <div className="flex gap-2">
                  <button
                    onClick={handleMessageSeller}
                    disabled={isStartingChat}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {isStartingChat ? "Opening…" : "Message seller"}
                  </button>
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shrink-0"
                      aria-label="Message on WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
