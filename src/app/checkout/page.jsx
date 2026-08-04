"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import useCart from "@/store/useCart";
import useUser from "@/utils/useUser";
import MarketplaceCheckout from "@/components/marketplace/MarketplaceCheckout";
import Navbar from "@/components/Navbar";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { user } = useUser?.() || { user: null }; // Fallback in case hook isn't fully implemented

  // A WhatsApp order is complete the moment it is saved, so the bag is cleared
  // here. Online payments clear theirs on /checkout/confirm, after the gateway
  // confirms the money.
  const handleOrdered = (order) => {
    clearCart();
    router.push(`/orders/${order.orderNumber}`);
  };

  const handleCancel = () => {
    router.push('/cart');
  };

  // Modernized Empty State UI
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center p-12 w-full max-w-sm bg-white rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <ShoppingCart className="h-10 w-10 text-gray-300" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tighter">Your cart is empty</h1>
            <p className="text-gray-400 mb-10 text-sm font-medium">Looks like you haven't added any premium items to your collection yet.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-black text-white px-8 py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] active:scale-95 flex items-center justify-center w-full group"
            >
              <ArrowLeft className="h-4 w-4 mr-3 group-hover:-translate-x-1 transition-transform" />
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pricing, vendor selling modes and payment routing all live behind the API,
  // so this page is a thin wrapper around the checkout component.
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <main className="py-10">
        <MarketplaceCheckout
          cart={items}
          userProfile={user || {}}
          onOrdered={handleOrdered}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
}