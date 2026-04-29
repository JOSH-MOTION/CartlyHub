import ProductDetailClient from "./ProductDetailClient";
import { getProducts } from "@/utils/firebaseData";

export default async function Page({ params }) {
  const { id } = params;
  const allProducts = await getProducts();
  const product = allProducts.find(p => p.id === id);

  // Structured Data (JSON-LD)
  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images || [],
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Cartly Hub"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://cartlyhubgh.com/product/${product.id}`,
      "priceCurrency": "GHS",
      "price": product.basePrice,
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.averageRating || 5,
      "reviewCount": product.reviewCount || 1
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient params={params} />
    </>
  );
}
