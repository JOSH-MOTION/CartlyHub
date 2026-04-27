import Providers from "@/components/Providers";
import "./global.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cartly-hub.vercel.app";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "cartly Hub | Ghana's Premium Online Shopping Marketplace",
    template: "%s | cartly Hub",
  },
  description:
    "Ghana's premier online marketplace. Buy and sell electronics, fashion, home goods, vehicles, phones & more with fast delivery and secure payments.",
  keywords: [
    "online shopping Ghana", "buy and sell Ghana", "Ghana marketplace",
    "Accra online store", "electronics Ghana", "phones Ghana",
    "fashion Ghana", "home appliances Ghana", "vehicles Ghana",
    "Jiji Ghana", "Tonaton alternative", "cheap deals Ghana",
    "cartly", "cartly hub", "Ghana ecommerce",
  ],
  authors: [{ name: "cartly Hub" }],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "cartly Hub | Ghana's Premium Online Shopping Marketplace",
    description:
      "Ghana's premier online marketplace. Buy and sell electronics, fashion, home goods, vehicles, phones & more with fast delivery and secure payments.",
    url: siteUrl,
    siteName: "cartly Hub",
    images: [
      {
        url: `${siteUrl}/cartly-og.png`,
        width: 1200,
        height: 630,
        alt: "cartly Hub - Ghana's Premium Online Shopping Marketplace",
      },
    ],
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "cartly Hub | Ghana's Premium Online Shopping Marketplace",
    description:
      "Ghana's premier online marketplace. Buy and sell electronics, fashion, home goods, vehicles, phones & more with fast delivery and secure payments.",
    images: [`${siteUrl}/cartly-og.png`],
    creator: "@cartlyhub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  verification: {
    // google: 'your-google-verification-code',
  },
};

// JSON-LD — now typed as a general marketplace/e-commerce platform
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ShoppingCenter",
  name: "cartly Hub",
  description:
    "Ghana's trusted online marketplace for electronics, fashion, home goods, vehicles, phones, and more.",
  url: siteUrl,
  logo: `${siteUrl}/logo-bg.png`,
  image: `${siteUrl}/cartly-og.png`,
  address: {
    "@type": "PostalAddress",
    addressCountry: "GH",
    addressRegion: "Greater Accra",
  },
  areaServed: {
    "@type": "Country",
    name: "Ghana",
  },
  currenciesAccepted: "GHS",
  paymentAccepted: "Mobile Money, Credit Card, Cash on Delivery",
  priceRange: "$",
  hasMap: "https://maps.google.com/?q=Accra,Ghana",
  sameAs: [
    "https://twitter.com/cartlyhub",
    // add Facebook, Instagram, LinkedIn as you create them
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://kit.fontawesome.com" />
        <link rel="preconnect" href="https://ka-f.fontawesome.com" />

        <link rel="icon" href="/logo-bg.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-bg.png" />
        <meta name="theme-color" content="#000000" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <script
          src="https://kit.fontawesome.com/2c15cc0cc7.js"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body>
        <Providers>
          <div className="antialiased text-gray-900 bg-white min-h-screen flex flex-col font-sans">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}