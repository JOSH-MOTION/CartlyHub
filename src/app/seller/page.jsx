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
  Star,
  ExternalLink,
  Settings,
  Store,
  Lightbulb,
  ArrowUpRight,
  Edit2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function SellerDashboard() {
  const { sellerProfile } = useApp();
  const router = useRouter();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["seller", "products", sellerProfile?.uid],
    queryFn: () => getSellerProducts(sellerProfile?.uid),
    enabled: !!sellerProfile?.uid,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["seller", "reviews", sellerProfile?.storeName],
    queryFn: () => getSellerReviews(sellerProfile?.storeName),
    enabled: !!sellerProfile?.storeName,
  });

  const { data: announcement } = useQuery({
    queryKey: ["seller", "announcement"],
    queryFn: async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "seller_broadcast"));
        if (docSnap.exists()) {
          return docSnap.data();
        }
        return null;
      } catch (e) {
        return null;
      }
    }
  });

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
    : 0;

  const stats = [
    { 
      name: "Items Listed", 
      value: products.length, 
      icon: Package, 
      color: "bg-black text-white",
      desc: "Total inventory count"
    },
    { 
      name: "Store Reputation", 
      value: (
        <div className="flex items-center space-x-2">
          <span>{averageRating > 0 ? averageRating.toFixed(1) : "N/A"}</span>
          {averageRating > 0 && (
            <div className="flex text-yellow-400">
              <Star className="h-3.5 w-3.5 fill-current" />
            </div>
          )}
        </div>
      ), 
      icon: Star, 
      color: "bg-yellow-500 text-white",
      desc: `${reviews.length} customer reviews`
    },
    { 
      name: "Profile Reach", 
      value: sellerProfile?.storeViews || 0, 
      icon: Users, 
      color: "bg-emerald-500 text-white",
      desc: "Total customer views"
    },
    { 
      name: "Verification", 
      value: sellerProfile?.isVerified ? "Verified" : "Pending", 
      icon: sellerProfile?.isVerified ? ShieldCheck : ShieldAlert, 
      color: sellerProfile?.isVerified ? "bg-indigo-600 text-white" : "bg-orange-500 text-white",
      desc: sellerProfile?.isVerified ? "Approved Store" : "Under review"
    },
  ];

  return (
    <div className="space-y-8 md:space-y-12 max-w-6xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-black to-gray-950 p-8 md:p-10 rounded-[2.5rem] shadow-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-gray-800">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient opacity-10 pointer-events-none" />
        <div className="space-y-3 z-10">
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full w-fit border border-white/5">
            <Store className="h-3 w-3 text-gray-200" />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-200">Seller Hub</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-none">
              {sellerProfile?.storeName || "Vendor Account"}
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5 flex items-center space-x-2">
              <span>Managed by {sellerProfile?.ownerName || "Partner"}</span>
              {sellerProfile?.isVerified && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="h-3 w-3 fill-current" />
                    <span>Verified Merchant</span>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 z-10">
          <button
            onClick={() => router.push(`/store/${encodeURIComponent(sellerProfile?.storeName)}`)}
            className="flex items-center space-x-2 bg-white/10 text-white hover:bg-white/20 border border-white/10 px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Storefront</span>
          </button>
          <button
            onClick={() => router.push("/seller/products/add")}
            className="flex items-center space-x-2 bg-white text-black hover:bg-gray-100 px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-white/5 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Listing</span>
          </button>
        </div>
      </div>

      {/* Admin Broadcast Alert */}
      {announcement?.isActive && (
        <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-start space-x-4 animate-in slide-in-from-top-4 duration-500 shadow-sm">
          <div className="h-10 w-10 bg-red-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-200">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-red-600">Global System Announcement</span>
              <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-ping" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-red-950 leading-tight">
              {announcement.title}
            </h3>
            <p className="text-xs text-red-800 leading-relaxed font-medium">
              {announcement.message}
            </p>
          </div>
        </div>
      )}

      {/* Verification Warning Alert */}
      {!sellerProfile?.isVerified && (
        <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-tight text-orange-950">Store Verification Pending</h3>
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest mt-1">Our compliance team is currently reviewing your registration. You will receive email alerts upon approval.</p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="px-4 py-2 bg-white text-orange-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-orange-200 shadow-sm">Under Review</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-5 hover:scale-[1.02] hover:shadow-md transition-all duration-300"
          >
            <div className={`h-12 w-12 ${stat.color} rounded-2xl flex items-center justify-center shadow-sm shrink-0`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{stat.name}</p>
              <h3 className="text-xl font-black tracking-tighter text-gray-900 mt-1">{stat.value}</h3>
              <p className="text-[9px] text-gray-400 mt-0.5 font-bold uppercase tracking-tight">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Listings */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight text-gray-900">Recent Catalog Listings</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Your latest item uploads</p>
            </div>
            <button 
              onClick={() => router.push("/seller/products")}
              className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center space-x-1 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl border border-gray-100/50 transition-all"
            >
              <span>View Catalog</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {productsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              products.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100/80 transition-all border border-transparent hover:border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                      <img src={p.images?.[0]} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-black text-xs uppercase tracking-tight text-gray-900">{p.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        ₵{Number(p.basePrice || p.price).toLocaleString()} • {p.isActive !== false ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => router.push(`/seller/products/edit/${p.id}`)}
                      className="p-2 hover:bg-white text-gray-400 hover:text-black rounded-lg border border-transparent hover:border-gray-100 transition-all"
                      title="Edit Product"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => router.push(`/seller/products?id=${p.id}`)}
                      className="p-2 hover:bg-white text-gray-400 hover:text-black rounded-lg border border-transparent hover:border-gray-100 transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-gray-400">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-gray-900 font-black uppercase tracking-tight text-xs">No products listed</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">List your first product to start sales.</p>
                </div>
                <button
                  onClick={() => router.push("/seller/products/add")}
                  className="bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest"
                >
                  Create Listing
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Portal Insights & Tips */}
        <div className="space-y-6">
          
          {/* Quick Tasks */}
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-black text-sm uppercase tracking-tight text-gray-900">Portal Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => router.push('/seller/feedback')}
                className="p-4 bg-gray-50 hover:bg-yellow-50 border border-transparent hover:border-yellow-200 text-left rounded-2xl transition-all group"
              >
                <MessageCircle className="h-5 w-5 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="block text-[10px] font-black uppercase tracking-wide">Opinions</span>
                <span className="block text-[8px] text-gray-400 font-bold uppercase mt-0.5">Reviews & Stars</span>
              </button>
              
              <button 
                onClick={() => router.push('/seller/settings')}
                className="p-4 bg-gray-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 text-left rounded-2xl transition-all group"
              >
                <Settings className="h-5 w-5 text-indigo-600 mb-2 group-hover:rotate-45 transition-transform" />
                <span className="block text-[10px] font-black uppercase tracking-wide">Settings</span>
                <span className="block text-[8px] text-gray-400 font-bold uppercase mt-0.5">Store Details</span>
              </button>
            </div>
          </div>

          {/* Luxury Advice Card */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] p-8 text-white space-y-6 border border-gray-800">
            <div>
              <h3 className="font-black text-sm uppercase tracking-tight text-gray-200">Merchant Center Tips</h3>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Boost your catalog conversion</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-white/10 rounded-xl text-yellow-400 shrink-0">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Visual Impact</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">Ensure photos are shot in neutral backgrounds with high daylight contrast. Listings with bright photos gain 3x more pageviews.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2 bg-white/10 rounded-xl text-emerald-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Profile Trust</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">Make sure store location, regions, and contact numbers match WhatsApp parameters for customer order redirects.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
