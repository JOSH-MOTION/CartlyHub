"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import useCart from "@/store/useCart";
import { apiFetch } from "@/utils/apiClient";

const DEBOUNCE_MS = 1500;

/**
 * Mirrors the client-side cart (useCart.js) to Firestore for signed-in users,
 * debounced, purely so an abandoned-cart reminder can be sent later — see
 * /api/cron/abandoned-carts. Renders nothing; mounted once near the app
 * root. Guests are skipped, since there's no email to remind.
 */
export default function CartSync() {
  const { user } = useApp();
  const items = useCart((state) => state.items);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const payload = items.map((item) => ({
        productId: item.product.id,
        variantId: item.variant?.id || null,
        productName: item.product.name,
        productImage: item.product.images?.[0] || null,
        price: item.variant?.price || item.product.basePrice || 0,
        quantity: item.quantity,
      }));

      apiFetch("/api/cart/sync", { method: "POST", body: { items: payload } }).catch(() => {
        // Best-effort — a failed sync just means no reminder email later,
        // never something that should surface to the shopper.
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutRef.current);
  }, [user?.id, items]);

  return null;
}
