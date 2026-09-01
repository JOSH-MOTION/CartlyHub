import { Suspense } from "react";
import ProductsClient from "./ProductsClient";
import Navbar from "@/components/Navbar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";
const TITLE = "The Collection | Premium Products in Ghana";
const OG_TITLE = "The Collection | Premium Products in Ghana - Cartly Hub";
const DESCRIPTION =
  "Browse the full collection of premium products on Cartly Hub. Electronics, fashion, home goods, and more from verified sellers across Ghana.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // A page-level `openGraph` object replaces the root layout's entirely
  // rather than merging with it — leaving out any field here (image, url,
  // siteName, type) drops it from the page, not falls back to the layout's.
  openGraph: {
    title: OG_TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/products`,
    siteName: "Cartly Hub",
    type: "website",
    images: [{ url: `${SITE_URL}/cartly-og.png`, width: 1424, height: 752, alt: "Cartly Hub" }],
  },
  twitter: { card: "summary_large_image", title: OG_TITLE, description: DESCRIPTION },
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
