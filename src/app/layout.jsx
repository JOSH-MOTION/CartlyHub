import Providers from "@/components/Providers";
import Script from "next/script";
import "./global.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cartly Hub | Ghana's #1 Online Shopping Marketplace",
    template: "%s | Cartly Hub",
  },
  description:
    "Ghana's premier online marketplace. Buy and sell electronics, fashion, home goods, vehicles, phones & more with fast delivery and secure payments.",
  keywords: [
    "online shopping Ghana", "buy and sell Ghana", "Ghana marketplace",
    "Accra online store", "electronics Ghana", "phones Ghana",
    "fashion Ghana", "home appliances Ghana", "vehicles Ghana",
    "Jiji Ghana", "Tonaton alternative", "cheap deals Ghana",
    "Cartly", "Cartly Hub", "Ghana ecommerce", "shopping in Kumasi",
    "Ghana classifieds", "verified sellers Ghana",
  ],
  authors: [{ name: "Cartly Hub" }],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Cartly Hub | Ghana's #1 Online Shopping Marketplace",
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
    title: "Cartly Hub | Ghana's #1 Online Shopping Marketplace",
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
    google: 'ex31KVfSIhxEToXi-DfdwEezNB_gAZto5e7cT7F4kE0',
  },
  icons: {
    icon: '/logo-bg.png',
    apple: '/logo-bg.png',
  },
};

// JSON-LD — now typed as a general marketplace/e-commerce platform
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Cartly Hub",
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-WGBSHGCE6Z"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-WGBSHGCE6Z');
          `}
        </Script>
        <link rel="preconnect" href="https://kit.fontawesome.com" />
        <link rel="preconnect" href="https://ka-f.fontawesome.com" />

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