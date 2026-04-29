import ProductsClient from "./ProductsClient";

export const metadata = {
  title: "The Collection | Premium Products in Ghana",
  description: "Browse the full collection of premium products on Cartly Hub. Electronics, fashion, home goods, and more from verified sellers across Ghana.",
  openGraph: {
    title: "The Collection | Premium Products in Ghana - Cartly Hub",
    description: "Browse the full collection of premium products on Cartly Hub. Electronics, fashion, home goods, and more from verified sellers across Ghana.",
  }
};

export default function Page() {
  return <ProductsClient />;
}
