import Providers from "@/components/Providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Carly Hub | Premium Fashion & Accessories</title>
        <meta
          name="description"
          content="Shop the latest fashion, shoes, and accessories at Carly Hub."
        />
        <script src="https://js.paystack.co/v1/inline.js" async></script>
      </head>
      <body className="antialiased text-gray-900 bg-white min-h-screen flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
