import { Suspense } from "react";
import ProductsClient from "./ProductsClient";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "The Collection | Premium Products in Ghana",
  description: "Browse the full collection of premium products on Cartly Hub. Electronics, fashion, home goods, and more from verified sellers across Ghana.",
  openGraph: {
    title: "The Collection | Premium Products in Ghana - Cartly Hub",
    description: "Browse the full collection of premium products on Cartly Hub. Electronics, fashion, home goods, and more from verified sellers across Ghana.",
  }
};

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <ProductsClient />
    </Suspense>
  );
}
