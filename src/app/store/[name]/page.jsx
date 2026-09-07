import { getSellerByStoreName, getSellerProducts } from "@/utils/firebaseData";
import StorefrontClient from "./StorefrontClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

/**
 * Per-seller link preview.
 *
 * StorefrontClient does all the real data fetching (products, reviews,
 * search) client-side — this file exists only so the share link a seller
 * posts on WhatsApp/Instagram/TikTok shows THEIR logo/banner and store name
 * in the preview card, not a generic site-wide one. A "use client" page
 * can't export generateMetadata, hence the split.
 */
export async function generateMetadata({ params }) {
  const sellerName = decodeURIComponent(params.name);
  const seller = await getSellerByStoreName(sellerName);

  if (!seller) return { title: `${sellerName} | Cartly Hub` };

  const products = await getSellerProducts(seller.id);
  const productCount = products.length;

  const description =
    seller.description?.trim() ||
    `${productCount} ${productCount === 1 ? "listing" : "listings"} from ${seller.storeName} — a verified seller on Cartly Hub, Ghana's online marketplace.`;

  const url = `${SITE_URL}/store/${encodeURIComponent(seller.storeName)}`;
  // A banner is already the right shape for a link preview; a square logo is
  // the next-best thing; the generic site image is the last resort.
  const image = seller.storeBannerImage || seller.storeLogo || `${SITE_URL}/cartly-og.png`;
  const socialTitle = `${seller.storeName} on Cartly Hub`;

  return {
    title: seller.storeName,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: "Cartly Hub",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: seller.storeName }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}

export default function StorePage({ params }) {
  return <StorefrontClient params={params} />;
}
