"use client";

import { useApp } from "@/context/AppContext";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerReviews } from "@/utils/firebaseData";
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  ChevronRight, 
  LogOut,
  Store,
  Loader2,
  MessageCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function SellerLayout({ children }) {
  const { user, sellerProfile, isLoading, signOut } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const { data: reviews } = useQuery({
    queryKey: ["seller", "reviews", sellerProfile?.storeName],
    queryFn: () => getSellerReviews(sellerProfile?.storeName),
    enabled: !!sellerProfile?.storeName,
  });

  useEffect(() => {
    if (!isLoading && (!user || !sellerProfile) && pathname !== "/seller/onboarding") {
      router.push("/seller/onboarding");
    }
  }, [user, sellerProfile, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-3xl font-black tracking-tighter text-black uppercase animate-pulse mb-8">
          cartly<span className="text-gray-400">Hub</span>
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  // If we are on the onboarding page, just render it without the sidebar
  if (pathname === "/seller/onboarding") {
    return <>{children}</>;
  }

  if (!sellerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/seller" },
    { name: "Inventory", icon: Package, href: "/seller/products" },
    { name: "Feedback", icon: MessageCircle, href: "/seller/feedback" },
    { name: "Store Settings", icon: Settings, href: "/seller/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex pt-20">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-100 hidden lg:flex flex-col fixed h-full pt-10">
          <div className="px-6 mb-8">
            <div className="bg-black p-4 rounded-[1.5rem] text-white space-y-3">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Seller Mode</p>
                <h2 className="text-lg font-black truncate">{sellerProfile.storeName}</h2>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                    isActive 
                      ? "bg-gray-50 text-black shadow-sm" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={`h-4 w-4 ${isActive ? "text-black" : "text-gray-300 group-hover:text-black"}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
                    {item.name === "Feedback" && (
                      <span className="text-[10px] font-bold text-emerald-600 ml-1">({reviews?.length || 0})</span>
                    )}
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3" />}
                </a>
              );
            })}
          </nav>

          <div className="p-6 border-t border-gray-50">
            <button 
              onClick={signOut}
              className="flex items-center space-x-3 text-gray-400 hover:text-red-500 transition-colors px-4"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6 lg:p-10 overflow-y-auto pb-32 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2.5 flex items-center justify-around z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center space-y-0.5 transition-all ${
                isActive ? "text-black" : "text-gray-300"
              }`}
            >
              <div className="relative">
                <item.icon className={`h-5 w-5 ${isActive ? "text-black" : "text-gray-300"}`} />
                {item.name === "Feedback" && (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[7px] font-black h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center">
                    {reviews?.length || 0}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
