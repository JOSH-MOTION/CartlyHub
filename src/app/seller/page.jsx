"use client";

import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import {
  Package,
  Plus,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Star,
  ExternalLink,
  ArrowUpRight,
  Edit2,
  Wallet,
  Clock,
  ShoppingBag,
  TrendingUp,
  MessageCircle,
  Megaphone,
} from "lucide-react";
import { db } from "../../lib/firebase";
import { getSellerProducts, getSellerReviews } from "@/utils/firebaseData";
import { getVendorOrders } from "@/utils/marketplaceData";
import { apiFetch } from "@/utils/apiClient";
import { formatCurrency } from "@/services/payments/money";
import { PAYMENT_STATUS, SELLING_MODE_OPTIONS } from "@/services/marketplace/constants";
import {
  StatCard,
  Panel,
  Pill,
  EmptyState,
} from "@/components/marketplace/dashboard-ui";

/**
 * Seller dashboard overview.
 *
 * Ordered by what a vendor opens the portal to find out: what am I owed, what
 * has just come in, and is anything blocking me from selling.
 */
export default function SellerDashboard() {
  const { sellerProfile } = useApp();
  const router = useRouter();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["seller", "products", sellerProfile?.uid],
    queryFn: () => getSellerProducts(sellerProfile?.uid),
    enabled: !!sellerProfile?.uid,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["seller", "reviews", sellerProfile?.storeName],
    queryFn: () => getSellerReviews(sellerProfile?.storeName),
    enabled: !!sellerProfile?.storeName,
  });

  const { data: walletData } = useQuery({
    queryKey: ["seller", "wallet"],
    queryFn: () => apiFetch("/api/wallet"),
    enabled: !!sellerProfile?.uid,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["seller", "orders", sellerProfile?.uid],
    queryFn: () => getVendorOrders(sellerProfile?.uid),
    enabled: !!sellerProfile?.uid,
  });

  const { data: announcement } = useQuery({
    queryKey: ["seller", "announcement"],
    queryFn: async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "seller_broadcast"));
        return snap.exists() ? snap.data() : null;
      } catch {
        return null;
      }
    },
  });

  const wallet = walletData?.wallet;
  const paidOrders = orders.filter((order) => order.paymentStatus === PAYMENT_STATUS.PAID);
  const sellingOption = SELLING_MODE_OPTIONS.find(
    (option) => option.value === sellerProfile?.sellingMode,
  );
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
    : 0;

  const storefrontHref = `/store/${encodeURIComponent(sellerProfile?.storeName || "")}`;

  return (
    <div className="space-y-6">
      {/* ---------------- Header ---------------- */}
      <header className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-5 sm:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Seller Hub
              </span>
              {sellerProfile?.isVerified ? (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                  <ShieldAlert className="h-3 w-3" />
                  Under review
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase leading-none break-words">
              {sellerProfile?.storeName || "Vendor account"}
            </h1>
            <p className="text-xs text-gray-400">
              Managed by {sellerProfile?.ownerName || "Partner"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href={storefrontHref}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-3 rounded-xl text-xs font-bold transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Storefront
            </Link>
            <Link
              href="/seller/products/add"
              className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 px-4 py-3 rounded-xl text-xs font-bold transition-colors"
            >
              <Plus className="h-4 w-4" />
              New listing
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------- Alerts ---------------- */}
      {announcement?.isActive && (
        <div className="bg-red-50 border border-red-100 p-4 sm:p-5 rounded-2xl flex gap-3">
          <div className="h-9 w-9 bg-red-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <Megaphone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">
              Announcement
            </p>
            <h3 className="text-sm font-bold text-red-900 mt-1">{announcement.title}</h3>
            <p className="text-xs text-red-700 leading-relaxed mt-1">{announcement.message}</p>
          </div>
        </div>
      )}

      {!sellerProfile?.isVerified && (
        <div className="bg-amber-50 border border-amber-100 p-4 sm:p-5 rounded-2xl flex gap-3">
          <div className="h-9 w-9 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-900">Verification pending</p>
            <p className="text-xs text-amber-700 leading-relaxed mt-1">
              Our team is reviewing your registration. You can keep listing and selling in the
              meantime — we&apos;ll email you once the trust badge is applied.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- Money & volume ---------------- */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Wallet balance"
          value={formatCurrency(wallet?.availableBalance ?? 0)}
          hint="Available to withdraw"
          icon={Wallet}
          tone="dark"
        />
        <StatCard
          label="Pending payout"
          value={formatCurrency(wallet?.pendingBalance ?? 0)}
          hint="Under review"
          icon={Clock}
        />
        <StatCard
          label="Paid orders"
          value={paidOrders.length}
          hint={`${orders.length} total`}
          icon={ShoppingBag}
        />
        <StatCard
          label="Lifetime earnings"
          value={formatCurrency(wallet?.totalEarnings ?? 0)}
          hint="After commission"
          icon={TrendingUp}
        />
      </div>

      {/* ---------------- Orders + selling mode ---------------- */}
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        <Panel
          title="Recent orders"
          className="lg:col-span-3"
          action={<PanelLink href="/seller/orders">View all</PanelLink>}
        >
          {orders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              description="Orders appear the moment a customer pays or sends you a WhatsApp order."
            />
          ) : (
            <ul className="divide-y divide-gray-100 -my-2">
              {orders.slice(0, 5).map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/seller/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 py-3.5 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{order.orderNumber}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {order.customerName || "Guest"} ·{" "}
                        {order.createdAt?.toLocaleDateString?.()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="hidden sm:block">
                        <Pill
                          tone={
                            order.paymentStatus === PAYMENT_STATUS.PAID ? "emerald" : "amber"
                          }
                          label={
                            order.paymentStatus === PAYMENT_STATUS.PAID ? "Paid" : "Unpaid"
                          }
                        />
                      </span>
                      <span className="text-sm font-bold whitespace-nowrap">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-black transition-colors" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="How you sell"
          className="lg:col-span-2"
          action={<PanelLink href="/seller/settings">Change</PanelLink>}
        >
          <div className="space-y-3">
            <p className="text-base font-bold">{sellingOption?.label || "Not set"}</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              {sellingOption?.summary ||
                "Pick a selling option in Store Settings so customers know how to buy from you."}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {sellerProfile?.onlinePaymentsEnabled && (
                <Pill
                  tone="emerald"
                  label={`Commission ${walletData?.commissionPercent ?? 5}%`}
                />
              )}
              {sellerProfile?.whatsappNumber && (
                <Pill
                  tone="green"
                  icon={<MessageCircle className="h-3 w-3" />}
                  label={sellerProfile.whatsappNumber}
                />
              )}
            </div>
          </div>
        </Panel>
      </div>

      {/* ---------------- Catalogue ---------------- */}
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        <Panel
          title="Recent listings"
          className="lg:col-span-3"
          action={<PanelLink href="/seller/products">View catalogue</PanelLink>}
        >
          {productsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((row) => (
                <div key={row} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products listed"
              description="List your first product to start selling."
              action={
                <Link
                  href="/seller/products/add"
                  className="inline-flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl text-xs font-bold"
                >
                  <Plus className="h-4 w-4" />
                  Create listing
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {products.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-100">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{product.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatCurrency(product.basePrice || product.price || 0)} ·{" "}
                        {product.isActive !== false ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/seller/products/edit/${product.id}`)}
                    className="h-9 w-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-colors shrink-0"
                    aria-label={`Edit ${product.name}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Panel title="Store reputation">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                <Star
                  className={`h-6 w-6 ${
                    averageRating > 0 ? "text-amber-400 fill-amber-400" : "text-gray-300"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black tracking-tight">
                  {averageRating > 0 ? averageRating.toFixed(1) : "—"}
                </p>
                <p className="text-[11px] text-gray-400">
                  {reviews.length} review{reviews.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <Link
              href="/seller/feedback"
              className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Read reviews
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Panel>

          <Panel title="Quick actions">
            <div className="grid grid-cols-2 gap-2">
              <QuickAction href="/seller/wallet" icon={Wallet} label="Wallet" />
              <QuickAction href="/seller/withdrawals" icon={ArrowUpRight} label="Withdraw" />
              <QuickAction href="/seller/inventory" icon={Package} label="Inventory" />
              <QuickAction href="/seller/analytics" icon={TrendingUp} label="Analytics" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

const PanelLink = ({ href, children }) => (
  <Link
    href={href}
    className="text-[11px] font-bold text-gray-400 hover:text-black transition-colors"
  >
    {children}
  </Link>
);

const QuickAction = ({ href, icon: Icon, label }) => (
  <Link
    href={href}
    className="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
  >
    <Icon className="h-5 w-5 text-gray-500" />
    <span className="text-xs font-bold">{label}</span>
  </Link>
);
