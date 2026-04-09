"use client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Wishlist from "@/components/Wishlist";

export default function WishlistPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      
      <Wishlist navigate={navigate} />
    </div>
  );
}
