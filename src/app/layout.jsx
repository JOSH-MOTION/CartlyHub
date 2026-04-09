import Providers from "@/components/Providers";
import "./global.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://carlyhub.surge.sh"),
  title: "Carly Hub | Premium Fashion in Ghana",
  description: "Premium fashion marketplace delivering quality across Ghana. Shop exclusive collections with fast delivery and secure payments.",
  keywords: ["fashion", "Ghana", "premium clothing", "online shopping", "accessories", "shoes", "Accra"],
  authors: [{ name: "Carly Hub" }],
  openGraph: {
    title: "Carly Hub | Premium Fashion in Ghana",
    description: "Premium fashion marketplace delivering quality across Ghana. Shop exclusive collections with fast delivery and secure payments.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://carlyhub.surge.sh",
    siteName: "Carly Hub",
    images: [
      {
        url: "/cartly.png", // We'll create this
        width: 1200,
        height: 630,
        alt: "Carly Hub - Premium Fashion Marketplace",
      },
    ],
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carly Hub | Premium Fashion in Ghana",
    description: "Premium fashion marketplace delivering quality across Ghana. Shop exclusive collections with fast delivery and secure payments.",
    images: ["/cartly.png"],
    creator: "@carlyhub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/cartly.png" type="image/png" />
        <link rel="apple-touch-icon" href="/cartly.png" />
        <meta name="theme-color" content="#000000" />
        <script src="https://kit.fontawesome.com/2c15cc0cc7.js" crossOrigin="anonymous" async></script>
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