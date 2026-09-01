"use client";

import { permanentRedirect } from "next/navigation";

/**
 * Legacy storefront URL. This route sat inside the seller-portal layout,
 * which gates every /seller/* page behind "is this your own store" — so a
 * shopper clicking a seller's name (every ProductCard links here) landed on
 * a "sign in to sell" wall instead of the store. `/store/[name]` is the
 * real, working, publicly-metadata'd storefront; this just forwards old
 * links/bookmarks/search results to it rather than leaving them dead.
 */
export default function SellerStoreRedirect({ params }) {
  permanentRedirect(`/store/${encodeURIComponent(decodeURIComponent(params.name))}`);
}
