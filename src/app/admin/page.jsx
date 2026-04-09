"use client";

import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Plus,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AdminDashboard() {
  const router = useRouter();

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
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        return [];
      }
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

  const { data: manualSales = [], isLoading: manualSalesLoading } = useQuery({
    queryKey: ["manualSales"],
    queryFn: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'manualSales'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Error fetching manual sales for overview:", error);
        return [];
      }
    },
  });

  // Calculate live stats
  const onlineRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const manualRevenue = manualSales.reduce((sum, sale) => sum + (Number(sale.totalAmount) || 0), 0);
  
  const onlineProfit = orders.reduce((sum, order) => sum + (order.totalProfit || 0), 0);
  const manualProfit = manualSales.reduce((sum, sale) => sum + (Number(sale.totalProfit) || 0), 0);
  
  const totalRevenue = onlineRevenue + manualRevenue;
  const totalProfit = onlineProfit + manualProfit;
  const totalOrders = orders.length + manualSales.length;

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

    // Combined transactions
    const allTransactions = [...orders, ...manualSales];

    allTransactions.forEach(t => {
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

  const stats = {
    totalRevenue: totalRevenue,
    totalProfit: totalProfit, 
    totalOrders: totalOrders,
    totalInventory: products.length,
    onlineCount: orders.length,
    manualCount: manualSales.length,
    salesData: chartData,
  };

  const isLoading = productsLoading || categoriesLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            System
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            Performance Overview
          </h1>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/admin/products')}
            className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </header>

      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-gray-50 rounded-xl text-black">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-black text-black tracking-tighter">GH₵{stats.totalRevenue.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-gray-50 rounded-xl text-black">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Net Profit Est.</p>
              <h3 className="text-3xl font-black text-black tracking-tighter">GH₵{stats.totalProfit.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-gray-50 rounded-xl text-black">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Active Orders</p>
              <h3 className="text-3xl font-black text-black tracking-tighter">{stats.totalOrders}</h3>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-gray-50 rounded-xl text-black">
                <Package className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Inventory</p>
              <h3 className="text-3xl font-black text-black tracking-tighter">{stats.totalInventory} SKUs</h3>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 h-[400px]">
            <h4 className="text-xs font-black uppercase tracking-widest mb-8">
              Monthly Sales Revenue
            </h4>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={stats.salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                <Tooltip 
                  cursor={{ fill: "#f9f9f9" }} 
                  formatter={(value) => [`GH₵${value.toLocaleString()}`, "Revenue"]}
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} 
                />
                <Bar dataKey="revenue" fill="#000000" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 h-[400px]">
            <h4 className="text-xs font-black uppercase tracking-widest mb-8">
              Order Volume Trend
            </h4>
            <ResponsiveContainer width="100%" height="80%">
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
    </div>
  );
}
