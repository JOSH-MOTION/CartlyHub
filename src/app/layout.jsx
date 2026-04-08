import Providers from "@/components/Providers";
import "./global.css";

export default function RootLayout({ children }) {
  return (
    <Providers>
      <div className="antialiased text-gray-900 bg-white min-h-screen flex flex-col font-sans">
        {children}
      </div>
    </Providers>
  );
}