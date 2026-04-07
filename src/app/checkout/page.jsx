"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import useCart from "@/store/useCart";
import useUser from "@/utils/useUser";
import CheckoutGhana from "@/components/CheckoutGhana";

export default function CheckoutPage() {
  const { items, updateQuantity, removeItem, getTotal } = useCart();
  const { user } = useUser();
  const total = getTotal();

  const handleComplete = () => {
    // Clear cart and redirect to home
    // In a real app, you'd save order to Firebase here
    window.location.href = "/";
  };

  const handleCancel = () => {
    window.location.href = "/cart";
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      
      <CheckoutGhana 
        cart={items}
        total={total}
        userProfile={user}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
