import ProductDetailClient from "./ProductDetailClient";
import { getProducts } from "@/utils/firebaseData";

export async function generateMetadata({ params }) {
  const { id } = params;
  const allProducts = await getProducts();
  const product = allProducts.find(p => p.id === id);

  if (!product) {
    return {
      title: "Product Not Found | CartlyHub",
    };
  }

  const title = `${product.name} | CartlyHub`;
  const description = product.description?.substring(0, 160) || `Buy ${product.name} for GH₵${product.basePrice} on CartlyHub.`;
  const image = product.images?.[0] || "https://cartlyhubgh.com/default-share-image.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://cartlyhubgh.com/product/${product.id}`,
      siteName: 'CartlyHub',
      images: [
        {
          url: image,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
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
