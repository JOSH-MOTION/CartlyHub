"use client";

import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { getSellerProducts, getSellerReviews } from "@/utils/firebaseData";
import { 
  Package, 
  TrendingUp, 
  Users, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  MessageCircle,
  Star
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

  const { data: reviews } = useQuery({
    queryKey: ["seller", "reviews", sellerProfile?.storeName],
    queryFn: () => getSellerReviews(sellerProfile?.storeName),
    enabled: !!sellerProfile?.storeName,
  });

  const averageRating = reviews?.length > 0 
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
    : 0;

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
      value: sellerProfile?.storeViews || 0, 
      icon: Users, 
      color: "bg-purple-50 text-purple-600" 
    },
    { 
      name: "Rating", 
      value: (
        <div className="flex items-center space-x-2">
          <span>{averageRating.toFixed(1)}</span>
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`h-3 w-3 ${s <= averageRating ? 'fill-current' : 'text-gray-200'}`} />
            ))}
          </div>
        </div>
      ), 
      icon: Star, 
      color: "bg-emerald-50 text-emerald-600" 
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-end border-b border-gray-100 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1 block">
            Dashboard Overview
          </span>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Welcome, <span className="text-gray-400">{sellerProfile?.storeName}</span>
          </h1>
        </div>
        <button
          onClick={() => router.push("/seller/products/add")}
          className="bg-black text-white px-5 py-2.5 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Product</span>
        </button>
      </header>
      
      {!sellerProfile?.isVerified && (
        <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-orange-900">Account Pending Verification</h3>
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest mt-0.5">Our team is currently reviewing your store details. You will receive an email once approved.</p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="px-4 py-2 bg-white text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-200 shadow-sm">Reviewing Profile</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-5 rounded-xl border border-gray-100 space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className={`h-10 w-10 ${stat.color} rounded-lg flex items-center justify-center`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.name}</p>
              <h3 className="text-xl font-black tracking-tight mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Products */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black uppercase tracking-tight">Recent Products</h2>
            <a href="/seller/products" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black flex items-center space-x-1">
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="h-16 bg-gray-50 rounded-xl animate-pulse"></div>
            ) : products?.length > 0 ? (
              products.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                      <img src={p.images?.[0]} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-xs uppercase">{p.name}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">₵{p.basePrice}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push(`/seller/products?id=${p.id}`)}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No products uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-black rounded-2xl p-6 shadow-sm text-white">
          <h2 className="text-sm font-black uppercase tracking-tight mb-6 text-gray-200">Seller Tips</h2>
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-400" />
                <h4 className="text-[11px] font-bold uppercase tracking-wide">High Quality Images</h4>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed pl-6">Use bright, clear photos of your products to increase sales by up to 40%.</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-gray-400" />
                <h4 className="text-[11px] font-bold uppercase tracking-wide">Get Verified</h4>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed pl-6">Verified stores build more trust with customers. Contact us to verify your profile.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
