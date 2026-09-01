import HomeClient from "./HomeClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";
const TITLE = "Cartly Hub | Ghana's #1 Online Shopping Marketplace";
const DESCRIPTION =
  "Ghana's premier online marketplace. Buy and sell electronics, fashion, home goods, vehicles, phones & more with fast delivery and secure payments.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // A page-level `openGraph` object replaces the root layout's entirely
  // rather than merging with it — leaving out any field here (image, url,
  // siteName, type) drops it from the page, not falls back to the layout's.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Cartly Hub",
    type: "website",
    images: [{ url: `${SITE_URL}/cartly-og.png`, width: 1424, height: 752, alt: "Cartly Hub" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function Page() {
  return <HomeClient />;
}
