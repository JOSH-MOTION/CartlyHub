import { cache } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSellerReviews } from "@/utils/firebaseData";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

/**
 * Vendor storefront metadata.
 *
 * The page itself is a client component, so title/description/OG and the
 * structured data have to live in a server layout. On a marketplace these
 * pages are a large share of the indexable surface — without this every
 * storefront inherited the generic homepage title and none of them could rank
 * for the seller's own name.
 */
const loadStore = cache(async (storeName) => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "sellers"),
        where("storeName", "==", decodeURIComponent(storeName)),
        limit(1),
      ),
    );
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error("Error loading store for metadata:", error);
    return null;
  }
});

export async function generateMetadata({ params }) {
  const store = await loadStore(params.name);
  const name = decodeURIComponent(params.name);

  if (!store) {
    return { title: `${name} | Cartly Hub Ghana` };
  }

  const where_ = [store.location, store.region].filter(Boolean).join(", ");
  // The root layout appends "| Buy Online in Ghana | Cartly Hub", so the page
  // title carries only the store name; Open Graph takes the fuller string.
  const title = store.storeName;
  const socialTitle = `${store.storeName} | Buy Online in ${store.region || "Ghana"} | Cartly Hub`;
  const description =
    store.description?.substring(0, 155) ||
    `Shop directly from ${store.storeName}${where_ ? `, based in ${where_}` : ""} on Cartly Hub. Verified Ghanaian seller with secure payment and delivery nationwide.`;
  const url = `${SITE_URL}/store/${encodeURIComponent(store.storeName)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: "Cartly Hub",
      type: "website",
      images: [{ url: `${SITE_URL}/cartly-og.png`, width: 1200, height: 630, alt: store.storeName }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description },
  };
}

export default async function StoreLayout({ children, params }) {
  const store = await loadStore(params.name);

  let jsonLd = null;

  if (store) {
    const reviews = await getSellerReviews(store.storeName).catch(() => []);
    const ratings = reviews.filter((review) => Number(review.rating) > 0);

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Store",
      name: store.storeName,
      description: store.description || undefined,
      url: `${SITE_URL}/store/${encodeURIComponent(store.storeName)}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: store.location || undefined,
        addressRegion: store.region || undefined,
        addressCountry: "GH",
      },
      parentOrganization: { "@type": "Organization", name: "Cartly Hub" },
    };

    // Same rule as products: never invent a rating. Only publish one when
    // real reviews back it.
    if (ratings.length > 0) {
      const average =
        ratings.reduce((sum, review) => sum + Number(review.rating), 0) / ratings.length;

      jsonLd.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: Number(average.toFixed(1)),
        reviewCount: ratings.length,
      };
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
