"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Wishlist from "@/components/Wishlist";
import useCart from "@/store/useCart";
import useUser from "@/utils/useUser";

export default function WishlistPage() {
  const { addItem } = useCart();
  const { user } = useUser();

  const navigate = (path) => {
    window.location.href = path;
  };

  const handleAddToCart = (productId, variantId, quantity) => {
    // Find the product to get variant info
    // In a real app, you'd fetch product details
    // For now, we'll use a default variant
    addItem(productId, variantId || 'default', quantity);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      
      <Wishlist 
        navigate={navigate}
        addToCart={handleAddToCart}
      />
    </div>
  );
}
