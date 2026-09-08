"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Check, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import { subscribeToNotifications } from "@/utils/marketplaceData";
import { apiFetch } from "@/utils/apiClient";

/** Order updates as they happen — payment confirmations, shipping status. */
export default function AccountNotificationsPage() {
  const { user, isLoading: authLoading } = useApp();
  const router = useRouter();
  const [notifications, setNotifications] = useState(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/account/signin");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.id) return undefined;
    return subscribeToNotifications(user.id, setNotifications);
  }, [user?.id]);

  const markAll = async () => {
    setMarking(true);
    try {
      await apiFetch("/api/notifications", { method: "PATCH", body: {} });
      toast.success("All caught up");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setMarking(false);
    }
  };

  const open = async (notification) => {
    try {
      if (!notification.read) {
        await apiFetch("/api/notifications", {
          method: "PATCH",
          body: { notificationId: notification.id },
        });
      }
    } catch {
      // Reading a notification should never block navigating to it.
    }
    if (notification.ctaHref) router.push(notification.ctaHref);
  };

  if (authLoading || notifications === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  const unread = notifications.filter((entry) => !entry.read).length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-10 pb-24 space-y-8">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 block">
              Your account
            </span>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Notifications</h1>
          </div>
          {unread > 0 && (
            <button
              onClick={markAll}
              disabled={marking}
              className="bg-white border border-gray-200 text-gray-600 px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </header>

        {notifications.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-[2rem] p-16 text-center space-y-6">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto">
              <BellOff className="h-8 w-8 text-gray-300" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tighter">Nothing here yet</h2>
              <p className="text-gray-500 text-sm">
                We'll tell you the moment there's an update on an order.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-[2rem] divide-y divide-gray-50">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => open(notification)}
                className="w-full text-left p-5 sm:p-6 flex gap-4 group first:rounded-t-[2rem] last:rounded-b-[2rem] hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    notification.read ? "bg-gray-50 text-gray-300" : "bg-black text-white"
                  }`}
                >
                  <Bell className="h-4 w-4" />
                </div>

                <div className="flex-grow min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black uppercase tracking-tight">{notification.title}</p>
                    {!notification.read && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{notification.message}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>

                {notification.ctaLabel && (
                  <span className="hidden sm:flex items-center gap-1.5 self-center text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors whitespace-nowrap">
                    {notification.ctaLabel}
                    <ChevronRight className="h-3 w-3" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
