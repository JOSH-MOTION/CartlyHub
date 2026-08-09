import Providers from "@/components/Providers";
import Script from "next/script";
import "./global.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cartly Hub | Shop Online in Ghana - Electronics, Fashion, Bags & Shoes",
    template: "%s | Buy Online in Ghana | Cartly Hub",
  },
  description:
    "Cartly Hub is Ghana's trusted online shopping marketplace. Buy or sell fashion, clothing, bags, electronics, phones & more with fast delivery in Accra, Kumasi and across Ghana.",
  keywords: [
    // Brand
    "Cartly", "Cartly Hub", "CartlyHub", "Cartly Hub Ghana",
    // Core marketplace terms
    "online shopping Ghana", "buy and sell Ghana", "Ghana marketplace",
    "Ghana ecommerce", "Ghana classifieds", "verified sellers Ghana",
    "Jiji Ghana", "Tonaton alternative", "cheap deals Ghana",
    "online marketplace Ghana", "trusted online store Ghana",
    "buy online Ghana", "sell online Ghana",
    // Categories
    "electronics Ghana", "phones Ghana", "buy laptops Ghana",
    "fashion Ghana", "shoes Ghana", "bags Ghana",
    "home appliances Ghana", "furniture Ghana", "home and garden Ghana",
    "beauty products Ghana", "groceries delivery Ghana",
    "health and wellness Ghana", "sports equipment Ghana",
    "baby products Ghana", "kids items Ghana",
    "vehicles Ghana", "cars for sale Ghana", "motorbikes Ghana",
    "land for sale Ghana", "property Ghana", "real estate Ghana",
    "jobs in Ghana", "services in Ghana",
    "farming supplies Ghana", "agriculture Ghana",
    "solar panels Ghana", "power equipment Ghana",
    "books Ghana", "office supplies Ghana", "pet supplies Ghana",
    "industrial tools Ghana", "digital goods Ghana",
    "wholesale Ghana", "bulk buying Ghana",
    "musical instruments Ghana", "perfumes Ghana",
    "car parts Ghana", "event tickets Ghana",
    // Locations
    "Accra online store", "shopping in Accra", "delivery in Accra",
    "shopping in Kumasi", "buy online Kumasi",
    "shopping in Tema", "shopping in Takoradi", "shopping in Tamale",
    "shopping in Cape Coast", "shopping in Koforidua",
    "shopping in Sunyani", "shopping in Ho",
    "Greater Accra shopping", "Ashanti Region shopping",
    "nationwide delivery Ghana",
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
    siteName: "Cartly Hub",
    images: [
      {
        url: `${siteUrl}/logo-bg.png`,
        width: 1200,
        height: 630,
        alt: "Cartly Hub Ghana",
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
    images: [`${siteUrl}/logo-bg.png`],
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
    icon: [
      { url: '/logo-bg.png', type: 'image/png' },
    ],
    shortcut: '/logo-bg.png',
    apple: [
      { url: '/logo-bg.png', sizes: '180x180', type: 'image/png' },
    ],
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
    addressLocality: "Accra",
  },
  areaServed: [
    { "@type": "Country", name: "Ghana" },
    { "@type": "City", name: "Accra" },
    { "@type": "City", name: "Kumasi" },
    { "@type": "City", name: "Tema" },
    { "@type": "City", name: "Takoradi" },
    { "@type": "City", name: "Tamale" },
    { "@type": "City", name: "Cape Coast" },
    { "@type": "City", name: "Koforidua" },
    { "@type": "City", name: "Sunyani" },
    { "@type": "City", name: "Ho" },
    { "@type": "AdministrativeArea", name: "Greater Accra Region" },
    { "@type": "AdministrativeArea", name: "Ashanti Region" },
  ],
  currenciesAccepted: "GHS",
  paymentAccepted: "Mobile Money, Credit Card, Cash on Delivery",
  priceRange: "$",
  hasMap: "https://maps.google.com/?q=Accra,Ghana",
  sameAs: [
    "https://twitter.com/cartlyhub",
    "https://www.instagram.com/cartlyhub",
    "https://www.tiktok.com/@cartly_hub",
    // add Facebook + LinkedIn URLs here once you have the exact page links
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
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "xzmvs309lb");
            `,
          }}
        />
        
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