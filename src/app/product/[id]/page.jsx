import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import { getProductById } from "@/utils/firebaseData";
import { resolveListPricing } from "@/lib/pricing";
import { productIdFromSlug, productSlug } from "@/lib/product-url";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

/**
 * Resolves the URL segment to a product, one Firestore read per request,
 * shared by generateMetadata and the page.
 *
 * The segment is normally `name-words-<id>`, but a bare `<id>` from an older
 * link must still work. The trailing segment is tried first; if that misses,
 * the whole value is tried, covering legacy ids that contain a hyphen.
 *
 * This previously called getProducts() — the entire collection — separately in
 * the layout's metadata, this file's metadata and the page body: three full
 * collection reads to render one product.
 */
const loadProduct = cache(async (slug) => {
  const candidate = productIdFromSlug(slug);

  const product = await getProductById(candidate);
  if (product) return product;

  return candidate === slug ? null : getProductById(slug);
});

/** schema.org wants a condition URL, sellers pick from a friendlier list. */
const CONDITION_URLS = {
  "Brand New": "https://schema.org/NewCondition",
  "Like New": "https://schema.org/UsedCondition",
  "Used (Normal Wear)": "https://schema.org/UsedCondition",
  Refurbished: "https://schema.org/RefurbishedCondition",
  Vintage: "https://schema.org/UsedCondition",
};

const totalStock = (product) =>
  (product?.variants || []).reduce(
    (sum, variant) => sum + (Number(variant.stock) || 0),
    0,
  );

export async function generateMetadata({ params }) {
  const product = await loadProduct(params.id);

  if (!product) return { title: "Product Not Found | Cartly Hub" };

  const pricing = resolveListPricing(product);
  // The root layout appends "| Buy Online in Ghana | Cartly Hub", so the page
  // title carries only the product name. Open Graph ignores that template and
  // takes the fuller string.
  const title = product.name;
  const socialTitle = `${product.name} | Buy in ${product.region || "Ghana"} | Cartly Hub`;
  const description =
    product.description?.substring(0, 155) ||
    `Shop ${product.name} for GH₵${pricing.price} on Cartly Hub. Buy from verified Ghanaian sellers with delivery in Accra, Kumasi and nationwide.`;
  const image = product.images?.[0] || `${SITE_URL}/cartly-og.png`;
  const url = `${SITE_URL}/product/${productSlug(product)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: "Cartly Hub",
      images: [{ url: image, width: 800, height: 600, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}

export default async function Page({ params }) {
  const product = await loadProduct(params.id);

  // A missing product must answer 404, not 200 with an empty shell — a soft
  // 404 gets indexed as a real page. A seller-deactivated listing gets the
  // same treatment: getProductById doesn't filter isActive (metadata
  // generation above needs it either way), so this is the one place that
  // has to — the old client-only fetch used to filter these out implicitly.
  if (!product || product.isActive === false) notFound();

  // Send bare-id and stale-name URLs to the canonical slug with a 308, so only
  // one URL per product is ever indexed and old links keep working.
  const canonical = productSlug(product);
  if (params.id !== canonical) permanentRedirect(`/product/${canonical}`);

  let jsonLd = null;

  {
    const pricing = resolveListPricing(product);
    const inStock = totalStock(product) > 0;
    const reviewCount = Number(product.reviewCount) || 0;
    const rating = Number(product.averageRating) || 0;

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: product.images || [],
      description: product.description,
      sku: product.id,
      brand: { "@type": "Brand", name: product.brand || "Cartly Hub" },
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/product/${productSlug(product)}`,
        priceCurrency: "GHS",
        // The payable figure — for a discounted item this is the sale price,
        // which is what Google must show.
        price: pricing.price,
        availability: inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition:
          CONDITION_URLS[product.condition] || "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: product.sellerName || "Cartly Hub",
        },
        // Delivery is free platform-wide (order-service always sets
        // deliveryFee: 0) with a marketplace-configurable estimate that
        // defaults to 3 business days — see DEFAULT_MARKETPLACE_SETTINGS.
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "GHS" },
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "GH",
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
          },
        },
        // Reflects refund.jsx as written: direct/COD sales are negotiated
        // buyer-to-seller with no platform-guaranteed return, so this can't
        // honestly claim a return window without misrepresenting the policy
        // to Google (worse than the missing-field warning it fixes).
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
          applicableCountry: "GH",
        },
      },
    };

    // Only claim a rating when real reviews exist. Inventing one (the old code
    // defaulted to 5 stars from 1 review) is fabricated structured data and
    // risks Google suppressing rich results across the whole domain.
    if (reviewCount > 0 && rating > 0) {
      jsonLd.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: Number(rating.toFixed(1)),
        reviewCount,
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
      <ProductDetailClient
        params={params}
        productId={product?.id}
        // Server-fetched, so the page has real content (H1, price,
        // description) in the initial HTML instead of only appearing after
        // a client-side fetch. JSON round-trip strips any non-plain values
        // (Firestore Timestamps etc.) that can't cross the server→client
        // component boundary as props.
        initialProduct={JSON.parse(JSON.stringify(product))}
      />
    </>
  );
}
