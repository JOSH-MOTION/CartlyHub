import ProductDetailClient from "./ProductDetailClient";
import { getProducts } from "@/utils/firebaseData";

export async function generateMetadata({ params }) {
  const { id } = params;
  try {
    const allProducts = await getProducts();
    const product = allProducts.find(p => p.id === id);

    if (!product) {
      return {
        title: "Product Not Found | Cartly Hub",
      };
    }

    const title = `${product.name} | Buy in ${product.region || "Ghana"} | Cartly Hub`;
    const description = `${product.name} available for GH¢${product.basePrice?.toLocaleString()} on Cartly Hub. ${product.description?.substring(0, 150)}...`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: product.images && product.images.length > 0 ? [product.images[0]] : [],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: product.images && product.images.length > 0 ? [product.images[0]] : [],
      }
    };
  } catch (error) {
    return {
      title: "Product Detail | Cartly Hub",
    };
  }
}

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
