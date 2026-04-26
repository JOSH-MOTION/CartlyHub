"use client";

import { useApp } from "@/context/AppContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  ChevronRight, 
  LogOut,
  Store,
  Loader2
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function SellerLayout({ children }) {
  const { user, sellerProfile, isLoading, signOut } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || !sellerProfile) && pathname !== "/seller/onboarding") {
      router.push("/seller/onboarding");
    }
  }, [user, sellerProfile, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
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
    { name: "Store Settings", icon: Settings, href: "/seller/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex pt-20">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-100 hidden lg:flex flex-col fixed h-full pt-10">
          <div className="px-8 mb-10">
            <div className="bg-black p-6 rounded-[2rem] text-white space-y-4">
              <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Seller Mode</p>
                <h2 className="text-xl font-black truncate">{sellerProfile.storeName}</h2>
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
                  className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all group ${
                    isActive 
                      ? "bg-gray-50 text-black shadow-sm" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <item.icon className={`h-5 w-5 ${isActive ? "text-black" : "text-gray-300 group-hover:text-black"}`} />
                    <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </a>
              );
            })}
          </nav>

          <div className="p-8 border-t border-gray-50">
            <button 
              onClick={signOut}
              className="flex items-center space-x-4 text-gray-400 hover:text-red-500 transition-colors px-6"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 p-8 lg:p-12 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
