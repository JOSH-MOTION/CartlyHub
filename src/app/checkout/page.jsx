"use client";

import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import useCart from "@/store/useCart";
import useUser from "@/utils/useUser";
import PaystackCheckout from "@/components/PaystackCheckout";
import Navbar from "@/components/Navbar";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCart();
  const { user } = useUser?.() || { user: null }; // Fallback in case hook isn't fully implemented

  const handleComplete = () => {
    clearCart();
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/cart');
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
              onClick={() => navigate('/')}
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

  // Pure clean wrapper, delegating the complex UI securely to the Paystack Checkout component
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      
      <main className="py-8">
        <PaystackCheckout 
          cart={items}
          total={getTotal()}
          userProfile={user || {}}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
}