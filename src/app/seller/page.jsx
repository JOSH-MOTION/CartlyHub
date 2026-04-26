"use client";

import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { getSellerProducts } from "@/utils/firebaseData";
import { 
  Package, 
  TrendingUp, 
  Users, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SellerDashboard() {
  const { sellerProfile } = useApp();
  const router = useRouter();

  const { data: products, isLoading } = useQuery({
    queryKey: ["seller", "products", sellerProfile?.uid],
    queryFn: () => getSellerProducts(sellerProfile?.uid),
    enabled: !!sellerProfile?.uid,
  });

  const stats = [
    { 
      name: "Total Products", 
      value: products?.length || 0, 
      icon: Package, 
      color: "bg-blue-50 text-blue-600" 
    },
    { 
      name: "Profile Status", 
      value: sellerProfile?.isVerified ? "Verified" : "Pending", 
      icon: sellerProfile?.isVerified ? ShieldCheck : ShieldAlert, 
      color: sellerProfile?.isVerified ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600" 
    },
    { 
      name: "Store Views", 
      value: "Coming Soon", 
      icon: Users, 
      color: "bg-purple-50 text-purple-600" 
    },
    { 
      name: "Sales (GHS)", 
      value: "0.00", 
      icon: TrendingUp, 
      color: "bg-emerald-50 text-emerald-600" 
    },
  ];

  return (
    <div className="space-y-12 max-w-6xl">
      <header className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Dashboard Overview
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            Welcome, <span className="text-gray-300">{sellerProfile?.storeName}</span>
          </h1>
        </div>
        <button
          onClick={() => router.push("/seller/products/add")}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.05] transition-all shadow-xl shadow-black/10 flex items-center space-x-3"
        >
          <Plus className="h-5 w-5" />
          <span>New Product</span>
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
            <div className={`h-12 w-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.name}</p>
              <h3 className="text-2xl font-black tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Products */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black uppercase tracking-tight">Recent Products</h2>
            <a href="/seller/products" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center space-x-1">
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="h-20 bg-gray-50 rounded-2xl animate-pulse"></div>
            ) : products?.length > 0 ? (
              products.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-white rounded-xl overflow-hidden flex-shrink-0">
                      <img src={p.images?.[0]} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase">{p.name}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">₵{p.basePrice}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push(`/seller/products?id=${p.id}`)}
                    className="p-2 hover:bg-white rounded-xl transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-2xl">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No products uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-black rounded-[2.5rem] p-10 shadow-sm text-white">
          <h2 className="text-xl font-black uppercase tracking-tight mb-8">Seller Tips</h2>
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="h-8 w-8 bg-white/10 rounded-xl flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-wide">High Quality Images</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">Use bright, clear photos of your products to increase sales by up to 40%.</p>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-8 bg-white/10 rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-wide">Get Verified</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">Verified stores build more trust with customers. Contact us to verify your profile.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
