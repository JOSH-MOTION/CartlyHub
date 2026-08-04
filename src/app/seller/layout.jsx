"use client";

import { useApp } from "@/context/AppContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getSellerReviews } from "@/utils/firebaseData";
import {
  LayoutDashboard,
  Package,
  Settings,
  Loader2,
  MessageCircle,
  ShoppingBag,
  Boxes,
  Users,
  Wallet,
  Banknote,
  Bell,
  BarChart3,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { subscribeToNotifications } from "@/utils/marketplaceData";
import { SellerNavContent } from "@/components/marketplace/seller-nav";

/**
 * Seller portal shell.
 *
 * Navigation is declared once and rendered twice — a persistent sidebar on
 * desktop, and the same content in a slide-out drawer on mobile. Eleven
 * sections is too many for a bottom tab bar, so the drawer is the single way
 * in on small screens; only the notification bell stays outside it, because an
 * unread count has to be visible without opening anything.
 */
export default function SellerLayout({ children }) {
  const { user, sellerProfile, isLoading, signOut } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Live badge — a vendor should see a paid order land without refreshing.
  useEffect(() => {
    if (!user?.id) return undefined;
    return subscribeToNotifications(user.id, (notifications) =>
      setUnreadCount(notifications.filter((entry) => !entry.read).length),
    );
  }, [user?.id]);

  const { data: reviews } = useQuery({
    queryKey: ["seller", "reviews", sellerProfile?.storeName],
    queryFn: () => getSellerReviews(sellerProfile?.storeName),
    enabled: !!sellerProfile?.storeName,
  });

  useEffect(() => {
    if (!isLoading && (!user || !sellerProfile) && pathname !== "/seller/onboarding") {
      router.push("/seller/onboarding");
    }
  }, [user, sellerProfile, isLoading, pathname, router]);

  // Navigating must never leave the drawer covering the page.
  useEffect(() => setDrawerOpen(false), [pathname]);

  // While the drawer is open it owns the screen: lock the page behind it and
  // let Escape dismiss it.
  useEffect(() => {
    if (!drawerOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-8">
        <div className="text-3xl font-black tracking-tighter text-black uppercase animate-pulse">
          cartly<span className="text-gray-400">Hub</span>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (pathname === "/seller/onboarding") return <>{children}</>;

  if (!sellerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    );
  }

  const groups = [
    {
      label: "Main",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, href: "/seller" },
        { name: "Orders", icon: ShoppingBag, href: "/seller/orders" },
        {
          name: "Notifications",
          icon: Bell,
          href: "/seller/notifications",
          badge: unreadCount,
        },
      ],
    },
    {
      label: "Catalogue",
      items: [
        { name: "Products", icon: Package, href: "/seller/products" },
        { name: "Inventory", icon: Boxes, href: "/seller/inventory" },
      ],
    },
    {
      label: "Money",
      items: [
        { name: "Wallet", icon: Wallet, href: "/seller/wallet" },
        { name: "Withdrawals", icon: Banknote, href: "/seller/withdrawals" },
      ],
    },
    {
      label: "Insights",
      items: [
        { name: "Customers", icon: Users, href: "/seller/customers" },
        {
          name: "Reviews",
          icon: MessageCircle,
          href: "/seller/feedback",
          badge: reviews?.length || 0,
        },
        { name: "Analytics", icon: BarChart3, href: "/seller/analytics" },
      ],
    },
    {
      label: "Account",
      items: [{ name: "Store Settings", icon: Settings, href: "/seller/settings" }],
    },
  ];

  const allItems = groups.flatMap((group) => group.items);
  const isActive = (href) =>
    href === "/seller" ? pathname === href : pathname.startsWith(href);
  const current = allItems.find((item) => isActive(item.href));
  const storefrontHref = `/store/${encodeURIComponent(sellerProfile.storeName || "")}`;

  const navigation = (
    <SellerNavContent
      groups={groups}
      isActive={isActive}
      sellerProfile={sellerProfile}
      storefrontHref={storefrontHref}
      onSignOut={signOut}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {/* Navbar is a normal in-flow element (position: static), so nothing here
          offsets for it — the sidebar and mobile bar simply stick to the top of
          the viewport once it scrolls away. */}
      <div className="flex">
        {/* ---------------- Desktop sidebar ---------------- */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col sticky top-0 h-screen bg-white border-r border-gray-100">
          {navigation}
        </aside>

        {/* ---------------- Workspace ---------------- */}
        <div className="flex-1 min-w-0">
          {/* Mobile bar: menu on the left, context in the middle, alerts right */}
          <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-3 py-2.5 flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 active:bg-gray-100"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 truncate">
                {sellerProfile.storeName}
              </p>
              <h2 className="text-sm font-black uppercase tracking-tight truncate">
                {current?.name || "Seller Hub"}
              </h2>
            </div>

            <Link
              href="/seller/notifications"
              className="relative h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </div>

          <main className="p-4 sm:p-6 lg:p-10 space-y-6 max-w-[1400px]">
            {sellerProfile.isSuspended && (
              <div className="flex gap-3 p-4 sm:p-5 rounded-2xl bg-red-50 border border-red-100">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-600">Your store is suspended</p>
                  <p className="text-xs text-red-500 mt-1 leading-relaxed">
                    {sellerProfile.suspensionReason ||
                      "New orders are paused. Contact Cartly Hub support to resolve this."}
                  </p>
                </div>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>

      {/* ---------------- Mobile drawer ---------------- */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Seller navigation"
            className="relative w-[84%] max-w-xs h-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <span className="text-sm font-black tracking-tighter uppercase">
                cartly<span className="text-gray-400">Hub</span>
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {navigation}
          </div>
        </div>
      )}
    </div>
  );
}
