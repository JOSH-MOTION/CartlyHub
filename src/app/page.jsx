import HomeClient from "./HomeClient";

export const metadata = {
  title: "Cartly Hub | Ghana's #1 Online Shopping Marketplace",
  description: "Ghana's premier online marketplace. Buy and sell electronics, fashion, home goods, vehicles, phones & more with fast delivery and secure payments.",
  openGraph: {
    title: "Cartly Hub | Ghana's #1 Online Shopping Marketplace",
    description: "Ghana's premier online marketplace. Buy and sell electronics, fashion, home goods, vehicles, phones & more with fast delivery and secure payments.",
  }
};

export default function Page() {
  return <HomeClient />;
}
