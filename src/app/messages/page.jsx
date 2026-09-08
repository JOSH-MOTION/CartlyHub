"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, ChevronRight } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import ThreadThumbnail from "@/components/ThreadThumbnail";

export default function MessagesListPage() {
  const { user, isLoading: authLoading } = useApp();
  const router = useRouter();
  const [asCustomer, setAsCustomer] = useState([]);
  const [asSeller, setAsSeller] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/account/signin");
  }, [user, authLoading, router]);

  // Live listeners — a thread's own updates (new last message) show up here
  // without a repeating fetch of every thread on a timer.
  useEffect(() => {
    if (!user) return undefined;

    const unsubCustomer = onSnapshot(
      query(collection(db, "messageThreads"), where("customerId", "==", user.id)),
      (snap) => {
        setAsCustomer(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
        setIsLoading(false);
      },
    );
    const unsubSeller = onSnapshot(
      query(collection(db, "messageThreads"), where("sellerId", "==", user.id)),
      (snap) => {
        setAsSeller(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
        setIsLoading(false);
      },
    );

    return () => {
      unsubCustomer();
      unsubSeller();
    };
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  const currentUserId = user?.id;
  const threads = [...asCustomer, ...asSeller].sort(
    (a, b) => (b.lastMessageAt?.toMillis?.() || 0) - (a.lastMessageAt?.toMillis?.() || 0),
  );

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
                  <ThreadThumbnail src={thread.statusImage} className="h-11 w-11 rounded-2xl shrink-0" />
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
