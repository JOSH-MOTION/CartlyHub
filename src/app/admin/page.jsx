"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ExpenseModal from "../../components/ExpenseModal";
import { getCategories } from "@/utils/firebaseData";
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
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function AdminDashboard() {
  const router = useRouter();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);


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

  const { data: expenses = [], isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'expenses'));
        return querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          amount: Number(doc.data().amount || 0)
        }));
      } catch (error) {
        console.error("Error fetching expenses:", error);
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

  // Calculate live stats
  const onlineRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const manualRevenue = manualSales.reduce((sum, sale) => sum + (Number(sale.totalAmount) || 0), 0);
  
  const onlineProfit = orders.reduce((sum, order) => sum + (order.totalProfit || 0), 0);
  const manualProfit = manualSales.reduce((sum, sale) => sum + (Number(sale.totalProfit) || 0), 0);
  
  const totalRevenue = onlineRevenue + manualRevenue;
  const totalGrossProfit = onlineProfit + manualProfit;
  const totalOrders = orders.length + manualSales.length;
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const actualNetBalance = totalGrossProfit - totalExpenses;
  const pendingSellers = sellers.filter(s => !s.isVerified);

  // Marketplace Reputation
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "NA";

  // Pie chart data for expenses
  const expenseBreakdown = expenses.reduce((acc, exp) => {
    const category = exp.category || 'other';
    acc[category] = (acc[category] || 0) + exp.amount;
    return acc;
  }, {});

  const pieData = Object.entries(expenseBreakdown).map(([name, value]) => ({
    name: name.toUpperCase(),
    value: value
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6'];

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
    totalProfit: totalGrossProfit, 
    totalExpenses: totalExpenses,
    actualNetBalance: actualNetBalance,
    totalOrders: totalOrders,
    totalInventory: products.length,
    onlineCount: orders.length,
    manualCount: manualSales.length,
    salesData: chartData,
    pieData: pieData
  };

  const isLoading = productsLoading || categoriesLoading || ordersLoading || expensesLoading || sellersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
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
            Performance Overview
          </h1>
        </div>
        <div className="flex w-full sm:w-auto space-x-2 md:space-x-4">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-white text-black border-2 border-black px-4 md:px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-gray-50 transition-all"
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden xs:inline">Log Expense</span>
            <span className="xs:hidden">Expense</span>
          </button>
          <button
            onClick={() => router.push('/admin/products')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-black text-white px-4 md:px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-gray-800 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Add Product</span>
            <span className="xs:hidden">Product</span>
          </button>
        </div>
      </header>

      <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-gray-50 rounded-xl text-black">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Gross Revenue</p>
              <h3 className="text-2xl md:text-3xl font-black text-black tracking-tighter">GH₵{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-red-50 rounded-xl text-red-600">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Business Expenses</p>
              <h3 className="text-2xl md:text-3xl font-black text-red-600 tracking-tighter">GH₵{stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Actual Net Balance</p>
              <h3 className="text-2xl md:text-3xl font-black text-green-600 tracking-tighter">GH₵{stats.actualNetBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-gray-50 rounded-xl text-black">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Active Orders</p>
              <h3 className="text-2xl md:text-3xl font-black text-black tracking-tighter">{stats.totalOrders}</h3>
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
              Monthly Sales Revenue
            </h4>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
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

        {/* Expense Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[350px] md:h-[400px]">
             <h4 className="text-xs font-black uppercase tracking-widest mb-8">
              Expense Allocation
            </h4>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {stats.pieData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`GH₵${value.toLocaleString()}`, "Amount"]}
                      contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs font-bold uppercase tracking-widest">
                    No expenses recorded
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[350px] md:h-[400px]">
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
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">on {rev.sellerName}</p>
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

      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        onSuccess={refetchExpenses}
      />
    </div>
  );
}
