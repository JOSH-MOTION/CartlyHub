"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/utils/apiClient";

export default function MessagesListPage() {
  const { user, isLoading: authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/account/signin");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", "threads"],
    queryFn: () => apiFetch("/api/messages"),
    enabled: !!user,
    refetchInterval: 15000,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  const threads = data?.threads || [];
  const currentUserId = data?.currentUserId;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-10 pb-24 space-y-8">
        <header className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 block">
            Your account
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Messages</h1>
        </header>

        {threads.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-[2rem] p-16 text-center space-y-6">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto">
              <MessageCircle className="h-8 w-8 text-gray-300" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tighter">No messages yet</h2>
              <p className="text-gray-500 text-sm">
                Message a seller from one of their statuses and the conversation shows up here.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-[2rem] divide-y divide-gray-50">
            {threads.map((thread) => {
              const isSeller = currentUserId === thread.sellerId;
              const otherName = isSeller ? thread.customerName : thread.sellerStoreName;
              return (
                <button
                  key={thread.id}
                  onClick={() => router.push(`/messages/${thread.id}`)}
                  className="w-full text-left p-5 sm:p-6 flex items-center gap-4 group first:rounded-t-[2rem] last:rounded-b-[2rem] hover:bg-gray-50 transition-colors"
                >
                  <div className="h-11 w-11 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                    {thread.statusImage && <img src={thread.statusImage} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate">{otherName}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {thread.lastMessage || "Say hello"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-black transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
