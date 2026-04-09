import Providers from "@/components/Providers";
import "./global.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://carlyhub.surge.sh"),
  title: "Carly Hub | Premium Fashion in Ghana",
  description: "Premium fashion marketplace delivering quality across Ghana.",
  openGraph: {
    title: "Carly Hub | Premium Fashion in Ghana",
    description: "Premium fashion marketplace delivering quality across Ghana.",
    images: ["/cartly.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carly Hub | Premium Fashion in Ghana",
    description: "Premium fashion marketplace delivering quality across Ghana.",
    images: ["/cartly.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/cartly.png" type="image/png" />
        <link rel="apple-touch-icon" href="/cartly.png" />
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