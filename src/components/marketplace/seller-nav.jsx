"use client";

import Link from "next/link";
import { Store, ShieldCheck, ExternalLink, LogOut } from "lucide-react";

/**
 * Seller navigation, presentation only.
 *
 * Lives apart from the layout so the same markup backs both the desktop
 * sidebar and the mobile drawer, and so it can be rendered without an
 * authenticated session.
 */

export const StoreCard = ({ sellerProfile }) => (
  <div className="bg-gradient-to-br from-gray-900 to-black p-4 rounded-2xl text-white border border-gray-800">
    <div className="flex items-start justify-between gap-2">
      <div className="h-9 w-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/5 shrink-0">
        <Store className="h-4 w-4" />
      </div>
      {sellerProfile.isVerified && (
        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 border border-emerald-500/20">
          <ShieldCheck className="h-3 w-3" />
          Verified
        </span>
      )}
    </div>
    <div className="mt-3 min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
        Merchant account
      </p>
      <h2 className="text-sm font-black truncate mt-0.5 uppercase tracking-tight">
        {sellerProfile.storeName}
      </h2>
    </div>
  </div>
);

export const NavLink = ({ item, active }) => (
  <Link
    href={item.href}
    className={`flex items-center gap-3 px-4 py-3.5 lg:py-2.5 rounded-xl transition-colors ${
      active ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black"
    }`}
  >
    <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-gray-400"}`} />
    <span className="text-xs font-bold flex-1 truncate">{item.name}</span>
    {item.badge > 0 && (
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
          active ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
        }`}
      >
        {item.badge}
      </span>
    )}
  </Link>
);

export const SellerNavContent = ({
  groups,
  isActive,
  sellerProfile,
  storefrontHref,
  onSignOut,
}) => (
  <>
    <div className="p-4 shrink-0">
      <StoreCard sellerProfile={sellerProfile} />
    </div>

    <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
            {group.label}
          </p>
          {group.items.map((item) => (
            <NavLink key={item.name} item={item} active={isActive(item.href)} />
          ))}
        </div>
      ))}
    </nav>

    <div className="p-3 border-t border-gray-100 space-y-1 shrink-0">
      <Link
        href={storefrontHref}
        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-black transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
        <span className="text-xs font-bold">View storefront</span>
      </Link>
      <button
        onClick={onSignOut}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span className="text-xs font-bold">Log out</span>
      </button>
    </div>
  </>
);
