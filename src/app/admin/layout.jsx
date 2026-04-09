"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  LogOut,
  Folder,
  Receipt,
  Menu,
  X
} from "lucide-react";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isLoading } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Authorization Check
  useEffect(() => {
    if (isLoading) return; // Wait for Firebase to load

    const isPinValidated = typeof window !== "undefined" && sessionStorage.getItem("adminPinAuth") === "true";
    
    if (!user || profile?.role !== "ADMIN" || !isPinValidated) {
      router.push("/admin-login");
    } else {
      setIsAuthorized(true);
    }
  }, [user, profile, isLoading, router]);


  // Close sidebar on route change automatically
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const SidebarItem = ({ icon: Icon, label, route }) => {
    const isActive = pathname === route ||
      (route !== "/admin" && pathname.startsWith(route + "/"));

    return (
      <button
        onClick={() => route && router.push(route)}
        className={`w-full flex items-center space-x-4 px-6 py-4 transition-all ${isActive
            ? "bg-black text-white"
            : "text-gray-500 hover:bg-gray-50 hover:text-black"
          }`}
      >
        <Icon className="h-5 w-5" />
        <span className="font-bold uppercase tracking-widest text-xs">{label}</span>
      </button>
    );
  };

  return (
    <div className="bg-gray-50 flex font-sans w-full min-h-screen relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col h-screen transform transition-transform duration-300 md:relative md:translate-x-0 shrink-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8 pb-12 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-xl font-black tracking-tighter text-black uppercase text-left flex-1"
          >
            Carly<span className="text-gray-500">Hub</span>
            <span className="block text-[8px] tracking-[0.3em] text-gray-400 mt-1">
              Admin Dashboard
            </span>
          </button>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Overview" route="/admin" />
          <SidebarItem icon={Folder} label="Categories" route="/admin/categories" />
          <SidebarItem icon={Package} label="Inventory" route="/admin/products" />
          <SidebarItem icon={ShoppingCart} label="Orders" route="/admin/orders" />
          <SidebarItem icon={Receipt} label="Manual Sales" route="/admin/manual-sales" />
          <SidebarItem icon={Users} label="Customers" route="/admin/customers" />
          <SidebarItem icon={DollarSign} label="Financials" route="/admin/financials" />
        </nav>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={() => router.push('/account/logout')}
            className="w-full flex items-center space-x-4 px-6 py-4 text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-bold uppercase tracking-widest text-xs">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full min-w-0 md:w-auto h-screen flex flex-col overflow-y-auto">
        {/* Mobile Header Topbar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-30 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-50 rounded-lg">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-black uppercase tracking-tighter text-sm">Carly<span className="text-gray-500">Hub</span></span>
          <div className="w-10"></div> {/* Placeholder for centering */}
        </div>

        <div className="p-4 md:p-8 lg:p-12 relative flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}