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

export default function ProductLayout({ children }) {
  return children;
}
