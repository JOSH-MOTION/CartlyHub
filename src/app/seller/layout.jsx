"use client";

import { useApp } from "@/context/AppContext";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  MessageCircle,
  ShieldCheck
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      <div className="flex-1 flex pt-20">
        {/* PC Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-100 hidden lg:flex flex-col fixed h-[calc(100vh-80px)] pt-8">
          {/* Store Profile Card */}
          <div className="px-4 mb-6">
            <div className="bg-gradient-to-br from-gray-900 to-black p-5 rounded-[1.75rem] text-white space-y-3 border border-gray-800 shadow-lg">
              <div className="flex justify-between items-start">
                <div className="h-9 w-9 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/5">
                  <Store className="h-4.5 w-4.5" />
                </div>
                {sellerProfile.isVerified && (
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-500/10">
                    <ShieldCheck className="h-2.5 w-2.5 fill-current" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">Merchant Account</p>
                <h2 className="text-sm font-black truncate mt-0.5 uppercase tracking-tight">{sellerProfile.storeName}</h2>
              </div>
            </div>
          </div>

          {/* Links */}
          <nav className="flex-grow px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all group ${
                    isActive 
                      ? "bg-black text-white shadow-md shadow-black/5" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-black"}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">{item.name}</span>
                    {item.name === "Feedback" && (
                      <span className={`text-[9px] font-black ml-1.5 px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                        {reviews?.length || 0}
                      </span>
                    )}
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3 text-white" />}
                </a>
              );
            })}
          </nav>

          {/* Logout Section */}
          <div className="p-4 border-t border-gray-50">
            <button 
              onClick={signOut}
              className="w-full flex items-center space-x-3 text-gray-400 hover:text-red-500 hover:bg-red-50/50 py-3 px-4 rounded-xl transition-all font-black"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-grow lg:ml-64 p-6 lg:p-10 overflow-y-auto pb-32 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Floating Bottom Navigation Bar (Mobile View) */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
        <nav className="bg-black/95 backdrop-blur-md px-6 py-3 rounded-full flex items-center justify-around shadow-2xl border border-white/10">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center space-y-1 transition-all ${
                  isActive ? "text-white scale-105" : "text-gray-400"
                }`}
              >
                <div className="relative">
                  <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                  {item.name === "Feedback" && reviews && reviews.length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[7px] font-black h-3.5 min-w-[14px] px-1 rounded-full flex items-center justify-center">
                      {reviews.length}
                    </span>
                  )}
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider">{item.name}</span>
                {isActive && <span className="h-1 w-1 bg-white rounded-full mt-0.5 animate-pulse" />}
              </a>
            );
          })}
        </nav>
      </div>

    </div>
  );
}
