"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { subscribeToNotifications } from "@/utils/marketplaceData";
import { apiFetch } from "@/utils/apiClient";
import {
  PageHeader,
  Panel,
  EmptyState,
  LoadingState,
  Pill,
} from "@/components/marketplace/dashboard-ui";

/** In-app notification feed — new paid orders, WhatsApp orders, payouts. */
export default function SellerNotificationsPage() {
  const { user } = useApp();
  const router = useRouter();
  const [notifications, setNotifications] = useState(null);
  const [marking, setMarking] = useState(false);

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

  if (notifications === null) return <LoadingState label="Loading notifications" />;

  const unread = notifications.filter((entry) => !entry.read).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Paid orders, WhatsApp orders and payout updates as they happen."
        actions={
          unread > 0 && (
            <button
              onClick={markAll}
              disabled={marking}
              className="bg-gray-100 text-gray-600 px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )
        }
      />

      <Panel title={unread > 0 ? `${unread} unread` : "All caught up"}>
        {notifications.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="Nothing here yet"
            description="We'll tell you the moment a customer pays or sends an order."
          />
        ) : (
          <ul className="divide-y divide-gray-50 -my-2">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  onClick={() => open(notification)}
                  className="w-full text-left py-5 flex gap-4 group"
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
                      <p className="text-sm font-black uppercase tracking-tight">
                        {notification.title}
                      </p>
                      {!notification.read && <Pill tone="emerald" label="New" />}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {notification.ctaLabel && (
                    <span className="hidden sm:flex items-center gap-1.5 self-center text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors whitespace-nowrap">
                      {notification.ctaLabel}
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
