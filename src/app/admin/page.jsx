"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Loader2,
  Star,
  MessageCircle,
  Store,
  ChevronRight,
  Tag,
  Users,
  Send
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getCategories } from "@/utils/firebaseData";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line
} from "recharts";

export default function AdminDashboard() {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    isActive: false
  });

  // Real product and category queries
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        return [];
      }
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return await getCategories();
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        return [];
      }
    },
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      try {
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
      } catch (error) {
        console.error("Error fetching admin reviews:", error);
        return [];
      }
    },
  });

  const { data: sellers = [], isLoading: sellersLoading } = useQuery({
    queryKey: ["admin", "sellers"],
    queryFn: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'sellers'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Error fetching sellers for overview:", error);
        return [];
      }
    },
  });

  const { data: announcement, refetch: refetchAnnouncement } = useQuery({
    queryKey: ["admin", "announcement"],
    queryFn: async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "seller_broadcast"));
        if (docSnap.exists()) {
          return docSnap.data();
        }
        return { title: "", message: "", isActive: false };
      } catch (e) {
        return { title: "", message: "", isActive: false };
      }
    }
  });

  useEffect(() => {
    if (announcement) {
      setAnnouncementForm({
        title: announcement.title || "",
        message: announcement.message || "",
        isActive: !!announcement.isActive
      });
    }
  }, [announcement]);

  // Calculate marketplace statistics
  const totalMarketplaceOrders = orders.length;
  const totalMarketplaceGMV = orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
  const totalRegisteredSellers = sellers.length;
  const totalMarketplaceListings = products.length;
  const pendingSellers = sellers.filter(s => !s.isVerified);

  // Marketplace Reputation
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "N/A";

  // Aggregate Top Sellers based on listing count
  const sellerProductCounts = products.reduce((acc, p) => {
    const sId = p.sellerId || "admin";
    const sName = p.sellerName || "Admin / Internal";
    if (!acc[sId]) {
      acc[sId] = { id: sId, name: sName, count: 0 };
    }
    acc[sId].count += 1;
    return acc;
  }, {});

  const topSellers = Object.values(sellerProductCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Aggregate sales data for charts
  const getMonthlyData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const lastSixMonths = [];
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      lastSixMonths.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        name: months[d.getMonth()],
        revenue: 0,
        orders: 0
      });
    }

    // Accumulate all marketplace orders in chart
    orders.forEach(t => {
      if (!t.createdAt) return;
      const date = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      const m = date.getMonth();
      const y = date.getFullYear();

      const dataPoint = lastSixMonths.find(p => p.month === m && p.year === y);
      if (dataPoint) {
        dataPoint.revenue += Number(t.totalAmount || 0);
        dataPoint.orders += 1;
      }
    });

    return lastSixMonths;
  };

  const chartData = getMonthlyData();

  const handlePublishAnnouncement = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      await setDoc(doc(db, "settings", "seller_broadcast"), {
        ...announcementForm,
        updatedAt: new Date()
      });
      toast.success("Broadcast announcement updated!");
      refetchAnnouncement();
    } catch (err) {
      console.error("Failed to publish announcement:", err);
      toast.error(`Failed to publish announcement: ${err.message || err}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const stats = {
    totalRevenue: totalMarketplaceGMV,
    totalOrders: totalMarketplaceOrders,
    totalSellers: totalRegisteredSellers,
    totalListings: totalMarketplaceListings,
    salesData: chartData,
    topSellers: topSellers
  };

  const isLoading = productsLoading || categoriesLoading || ordersLoading || sellersLoading || reviewsLoading;

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

  return (
    <div className="space-y-8 md:space-y-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            System
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
            Marketplace Overview
          </h1>
        </div>
        <div className="flex w-full sm:w-auto space-x-2 md:space-x-4">
          <button
            onClick={() => router.push('/admin/sellers')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-white text-black border-2 border-black px-4 md:px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-gray-50 transition-all"
          >
            <Store className="h-4 w-4" />
            <span className="hidden xs:inline">Manage Sellers</span>
            <span className="xs:hidden">Sellers</span>
          </button>
          <button
            onClick={() => router.push('/admin/promotions')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-white text-black border-2 border-black px-4 md:px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-gray-50 transition-all"
          >
            <Tag className="h-4 w-4" />
            <span className="hidden xs:inline">Manage Ads</span>
            <span className="xs:hidden">Ads</span>
          </button>
          <button
            onClick={() => router.push('/admin/products')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-black text-white px-4 md:px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-gray-800 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Catalog List</span>
            <span className="xs:hidden">Catalog</span>
          </button>
        </div>
      </header>

      <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-gray-50 rounded-xl text-black">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Marketplace GMV</p>
              <h3 className="text-2xl md:text-3xl font-black text-black tracking-tighter">GH₵{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Customer Orders</p>
              <h3 className="text-2xl md:text-3xl font-black text-emerald-600 tracking-tighter">{stats.totalOrders.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <Package className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Marketplace Listings</p>
              <h3 className="text-2xl md:text-3xl font-black text-indigo-600 tracking-tighter">{stats.totalListings.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-violet-50 rounded-xl text-violet-600">
                <Store className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Active Vendors</p>
              <h3 className="text-2xl md:text-3xl font-black text-violet-600 tracking-tighter">{stats.totalSellers.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                <Star className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Marketplace Rating</p>
              <h3 className="text-2xl md:text-3xl font-black text-black tracking-tighter">{avgRating}</h3>
            </div>
          </div>

          {pendingSellers.length > 0 && (
            <div 
              onClick={() => router.push('/admin/sellers')}
              className="bg-orange-500 p-6 md:p-8 rounded-3xl shadow-lg shadow-orange-200 border border-orange-400 space-y-4 cursor-pointer hover:scale-[1.02] transition-all group xs:col-span-2 lg:col-span-1"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/20 rounded-xl text-white">
                  <Store className="h-6 w-6" />
                </div>
                <ChevronRight className="h-5 w-5 text-white/50 group-hover:translate-x-1 transition-transform" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-1">Pending Verifications</p>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{pendingSellers.length} Vendors</h3>
              </div>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[350px] md:h-[400px]">
            <h4 className="text-xs font-black uppercase tracking-widest mb-8">
              Monthly Sales Volume (GMV)
            </h4>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                  <Tooltip 
                    cursor={{ fill: "#f9f9f9" }} 
                    formatter={(value) => [`GH₵${value.toLocaleString()}`, "GMV"]}
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} 
                  />
                  <Bar dataKey="revenue" fill="#000000" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[350px] md:h-[400px]">
            <h4 className="text-xs font-black uppercase tracking-widest mb-8">
              Order Volume Trend
            </h4>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                  <Tooltip 
                    formatter={(value) => [value, "Orders"]}
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} 
                  />
                  <Line type="monotone" dataKey="orders" stroke="#000000" strokeWidth={4} dot={{ r: 6, fill: "#000", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Vendors, Broadcast, and Reviews Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          
          {/* Column 1: Top Active Sellers */}
          <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[350px] md:h-[400px]">
             <h4 className="text-xs font-black uppercase tracking-widest mb-8">
              Top Active Sellers
            </h4>
            <div className="space-y-4 h-[250px] md:h-[280px] overflow-y-auto pr-2">
              {stats.topSellers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs font-bold uppercase tracking-widest">
                  No sellers listed yet
                </div>
              ) : (
                stats.topSellers.map((seller, idx) => (
                  <div 
                    key={seller.id} 
                    onClick={() => router.push(seller.id === "admin" ? "/admin/products" : `/admin/products?sellerId=${seller.id}`)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight text-gray-900 truncate max-w-[120px]">{seller.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Store Profile</p>
                      </div>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-100 text-right">
                      <p className="text-xs font-black">{seller.count}</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase">Items</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Column 2: Seller Alert Broadcast Center */}
          <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[350px] md:h-[400px] flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center space-x-2">
                <Store className="h-4 w-4 text-orange-500" />
                <span>Seller Broadcast</span>
              </h4>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Send in-app/web notification alert</p>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Alert Title (e.g. DB Sync Update)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none focus:border-black transition-all"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                />
                <textarea
                  placeholder="Alert Message..."
                  className="w-full h-24 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold outline-none focus:border-black transition-all resize-none"
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                />
                <label className="flex items-center space-x-3 cursor-pointer p-1">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded bg-gray-50 border-gray-100 text-black accent-black"
                    checked={announcementForm.isActive}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, isActive: e.target.checked })}
                  />
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Publish Alert Status</span>
                </label>
              </div>
            </div>
            
            <button
              onClick={handlePublishAnnouncement}
              disabled={isPublishing}
              className="w-full bg-black text-white hover:bg-gray-800 py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Broadcast Alert</span><Send className="h-3 w-3" /></>}
            </button>
          </div>

          {/* Column 3: Marketplace Feedback */}
          <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[350px] md:h-[400px]">
            <h4 className="text-xs font-black uppercase tracking-widest mb-8 flex justify-between items-center">
              Marketplace Feedback
              <span className="text-[10px] text-gray-400">Latest {reviews.length} entries</span>
            </h4>
            <div className="space-y-4 h-[250px] md:h-[280px] overflow-y-auto pr-2">
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs font-bold uppercase tracking-widest gap-4">
                  <MessageCircle className="h-8 w-8 opacity-20" />
                  No reviews yet
                </div>
              ) : (
                reviews.slice(0, 5).map((rev) => (
                  <div key={rev.id} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-black text-black tracking-tight">{rev.name}</p>
                        <Link 
                          href={rev.sellerId ? `/opinions/${rev.sellerId}` : `/store/${encodeURIComponent(rev.sellerName)}`}
                          className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
                        >
                          on {rev.sellerName}
                        </Link>
                      </div>
                      <div className="flex items-center space-x-1 text-yellow-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-black">{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium line-clamp-2 italic">"{rev.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
