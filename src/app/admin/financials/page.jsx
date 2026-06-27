"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Trash2, RefreshCcw, Receipt, Layers, Download, ArrowUpRight, PieChart as PieIcon } from "lucide-react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "react-hot-toast";
import { getOrders, getManualSales, deleteManualSale, getProducts } from "@/utils/firebaseData";
import ExpenseModal from "@/components/ExpenseModal";
import ReinvestmentModal from "@/components/ReinvestmentModal";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import Papa from "papaparse";

export default function AdminFinancialsPage() {
  const [dateFilter, setDateFilter] = useState("all");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isReinvestmentModalOpen, setIsReinvestmentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'revenue', 'expenses', 'reinvestments'


  const queryClient = useQueryClient();

  // Delete ledger entry mutation
  const deleteLedgerEntryMutation = useMutation({
    mutationFn: async (entry) => {
      if (entry.type === 'expense') {
        await deleteDoc(doc(db, "expenses", entry.id));
      } else if (entry.type === 'reinvestment') {
        if (entry.reinvestmentType === 'restock' && entry.linkedProductId && entry.linkedVariantId && entry.linkedQty) {
          const revertStock = confirm(`This reinvestment restocked ${entry.linkedQty} items of this product. Would you also like to remove this quantity from the inventory?`);
          if (revertStock) {
            try {
              const productRef = doc(db, "products", entry.linkedProductId);
              const snap = await getDoc(productRef);
              if (snap.exists()) {
                const pData = snap.data();
                const updatedVariants = pData.variants.map(v => {
                  if (v.vId === entry.linkedVariantId) {
                    return { ...v, stock: Math.max(0, (Number(v.stock) || 0) - Number(entry.linkedQty)) };
                  }
                  return v;
                });
                await updateDoc(productRef, { variants: updatedVariants });
              }
            } catch (err) {
              console.error("Error reverting stock on reinvestment delete:", err);
            }
          }
        } else if (entry.reinvestmentType === 'new_product' && entry.linkedProductId) {
          const deleteProd = confirm("This reinvestment created a new product. Would you also like to delete this product from your inventory?");
          if (deleteProd) {
            try {
              await deleteDoc(doc(db, "products", entry.linkedProductId));
            } catch (err) {
              console.error("Error deleting product on reinvestment delete:", err);
            }
          }
        }
        await deleteDoc(doc(db, "reinvestments", entry.id));
      } else if (entry.type === 'revenue' && entry.source === 'manual') {
        await deleteManualSale(entry.id);
      } else if (entry.type === 'revenue' && entry.source === 'online') {
        await deleteDoc(doc(db, "orders", entry.id));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-financials"]);
      queryClient.invalidateQueries(["expenses"]);
      queryClient.invalidateQueries(["reinvestments"]);
      toast.success("Ledger entry deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting ledger entry:", error);
      toast.error("Failed to delete ledger entry");
    }
  });

  const handleDeleteLedgerEntry = (entry) => {
    const typeName = entry.type === 'revenue' ? (entry.source === 'manual' ? 'Manual POS Sale' : 'Online Order') : entry.type;
    if (!confirm(`Are you sure you want to delete this ${typeName} entry? This action will adjust all profit, expense, and revenue metrics.`)) {
      return;
    }
    deleteLedgerEntryMutation.mutate(entry);
  };

  // Fetch products (to filter admin products)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        return await getProducts();
      } catch (error) {
        return [];
      }
    },
  });

  // Fetch expenses
  const { data: expenses = [], isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const q = query(collection(db, "expenses"), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        amount: Number(doc.data().amount || 0)
      }));
    },
  });

  // Fetch reinvestments
  const { data: reinvestments = [], isLoading: reinvestmentsLoading, refetch: refetchReinvestments } = useQuery({
    queryKey: ["reinvestments"],
    queryFn: async () => {
      const q = query(collection(db, "reinvestments"), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        amount: Number(doc.data().amount || 0)
      }));
    },
  });

  // Combined calculation logic
  const { data: transactions = [], isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ["admin-financials"],
    queryFn: async () => {
      try {
        const [onlineOrders, manualSales] = await Promise.all([
          getOrders(),
          getManualSales()
        ]);
        
        const processedOnline = onlineOrders.map(o => ({ 
          ...o, 
          source: 'online',
          type: 'revenue',
          totalAmount: Number(o.totalAmount || 0),
          totalProfit: Number(o.totalProfit || 0)
        }));
        
        const processedManual = manualSales.map(m => ({
          ...m,
          source: 'manual',
          type: 'revenue',
          totalAmount: Number(m.totalAmount || 0),
          totalProfit: Number(m.totalProfit || 0)
        }));
        
        return [...processedOnline, ...processedManual];
      } catch (error) {
        console.error('Error fetching consolidated financials:', error);
        return [];
      }
    },
  });

  const filterByDate = (items) => {
    if (dateFilter === "all") return items;
    const now = new Date();
    return items.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : (t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.date || t.createdAt));
      const diffTime = Math.abs(now - d);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (dateFilter === "7days") return diffDays <= 7;
      if (dateFilter === "30days") return diffDays <= 30;
      if (dateFilter === "90days") return diffDays <= 90;
      if (dateFilter === "year") return diffDays <= 365;
      return true;
    });
  };

  const adminProductIds = new Set(products.filter(p => !p.sellerId).map(p => p.id));
  const adminTransactions = transactions.map(tx => {
    const adminItems = tx.items?.filter(item => adminProductIds.has(item.productId)) || [];
    const totalAmount = adminItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity || 1)), 0);
    const totalProfit = adminItems.reduce((acc, item) => acc + (Number(item.profit) || 0), 0);
    
    return {
      ...tx,
      totalAmount,
      totalProfit,
      items: adminItems
    };
  }).filter(tx => tx.items.length > 0);

  const filteredTransactions = filterByDate(adminTransactions);
  const filteredExpenses = filterByDate(expenses).map(e => ({
    ...e,
    source: 'expense',
    type: 'expense',
    totalAmount: e.amount,
    totalProfit: 0,
    createdAt: e.date // Use date as creation date for sorting
  }));
  const filteredReinvestments = filterByDate(reinvestments).map(r => ({
    ...r,
    source: 'reinvestment',
    type: 'reinvestment',
    totalAmount: r.amount,
    totalProfit: 0,
    createdAt: r.date // Use date as creation date for sorting
  }));

  const allEntries = [...filteredTransactions, ...filteredExpenses, ...filteredReinvestments].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB - dateA;
  });

  const displayEntries = activeTab === 'all' 
    ? allEntries 
    : activeTab === 'revenue' 
      ? filteredTransactions 
      : activeTab === 'expenses'
        ? filteredExpenses
        : filteredReinvestments;

  // Financial Computations
  const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const grossProfit = filteredTransactions.reduce((sum, tx) => sum + tx.totalProfit, 0);
  const totalExpenses = filteredExpenses.reduce((sum, ex) => sum + ex.totalAmount, 0);
  const totalReinvested = filteredReinvestments.reduce((sum, re) => sum + re.totalAmount, 0);
  const netBalance = grossProfit - totalExpenses;
  const remainingProfit = netBalance - totalReinvested;
  const cogs = totalRevenue - grossProfit;
  const avgMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Expense Pi Chart Data
  const expenseBreakdown = filteredExpenses.reduce((acc, exp) => {
    const cat = exp.category || 'other';
    acc[cat] = (acc[cat] || 0) + exp.amount;
    return acc;
  }, {});

  const pieData = Object.entries(expenseBreakdown).map(([name, value]) => ({
    name: name.toUpperCase(),
    value: value
  })).sort((a, b) => b.value - a.value);

  const PIE_COLORS = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6'];


  // Chart Data Preparation
  const getMonthlyData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const lastSixMonths = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      lastSixMonths.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        name: months[d.getMonth()],
        Revenue: 0,
        Profit: 0,
        COGS: 0
      });
    }

    filteredTransactions.forEach(t => {
      if (!t.createdAt) return;
      const date = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      const m = date.getMonth();
      const y = date.getFullYear();

      const dataPoint = lastSixMonths.find(p => p.month === m && p.year === y);
      if (dataPoint) {
        dataPoint.Revenue += t.totalAmount;
        dataPoint.Profit += t.totalProfit;
        dataPoint.COGS += (t.totalAmount - t.totalProfit);
      }
    });

    return lastSixMonths;
  };

  const chartData = getMonthlyData();

  const handleRefetch = () => {
    refetchTransactions();
    refetchExpenses();
    refetchReinvestments();
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    const exportData = displayEntries.map(t => {
      const date = t.createdAt?.toDate ? t.createdAt.toDate() : (t.date?.toDate ? t.date.toDate() : new Date(t.createdAt || t.date));
      return {
        "Date": date.toLocaleDateString('en-US'),
        "Time": date.toLocaleTimeString('en-US'),
        "Reference": t.paymentReference || t.id?.slice(0, 8) || 'N/A',
        "Type": t.type.toUpperCase(),
        "Source/Category": t.source === 'manual' ? 'Manual POS' : t.source === 'online' ? 'Online Store' : t.source || t.category || 'N/A',
        "Description": t.description || (t.items ? t.items.map(i => i.productName).join(', ') : 'Direct Sale'),
        "Amount (GH¢)": (t.type === 'revenue' ? '+' : '-') + t.totalAmount.toFixed(2),
        "Net Profit/Profit Portion (GH¢)": t.totalProfit ? t.totalProfit.toFixed(2) : '0.00',
        "COGS (GH¢)": t.type === 'revenue' ? (t.totalAmount - t.totalProfit).toFixed(2) : '0.00',
      };
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CartlyHub-Financials-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Accounting
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Financial Ledger</h1>
        </div>
        <div className="flex items-center space-x-4">
          <select
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent outline-none font-bold text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Last Year</option>
          </select>

          <button
            onClick={handleRefetch}
            className="flex items-center space-x-2 bg-gray-100 text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center space-x-2 bg-white text-black border-2 border-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Record Expense</span>
          </button>

          <button
            onClick={() => setIsReinvestmentModalOpen(true)}
            className="flex items-center space-x-2 bg-white text-indigo-600 border-2 border-indigo-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all shadow-lg"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Record Reinvestment</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {transactionsLoading || expensesLoading || reinvestmentsLoading || productsLoading ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl text-black w-max">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Gross Revenue</p>
                <h3 className="text-2xl font-black text-black tracking-tighter">GH¢{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-red-50 rounded-xl text-red-600 w-max">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Business Expenses</p>
                <h3 className="text-2xl font-black text-red-600 tracking-tighter">GH¢{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-red-50 rounded-xl text-red-600 w-max">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cost of Goods (COGS)</p>
                <h3 className="text-2xl font-black text-red-600 tracking-tighter">GH¢{cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-green-50 rounded-xl text-green-600 w-max">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Actual Net Balance</p>
                <h3 className={`text-2xl font-black tracking-tighter ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  GH¢{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 w-max">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Reinvested</p>
                <h3 className="text-2xl font-black text-indigo-600 tracking-tighter">
                  GH¢{totalReinvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-green-50 rounded-xl text-green-600 w-max">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Remaining Profit</p>
                <h3 className={`text-2xl font-black tracking-tighter ${remainingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  GH¢{remainingProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Section */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 h-[450px]">
              <h4 className="text-xs font-black uppercase tracking-widest mb-8">
                Revenue & Profit Trends
              </h4>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight="bold" />
                  <YAxis axisLine={false} tickLine={false} fontSize={11} fontWeight="bold" />
                  <Tooltip 
                    cursor={{ fill: "#f9f9f9" }} 
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} 
                    formatter={(value, name) => [`GH¢${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="Revenue" fill="#000000" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Profit" fill="#442efb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expense Allocation Pie */}
            <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 h-[450px]">
              <h4 className="text-xs font-black uppercase tracking-widest mb-8">
                Where the money goes
              </h4>
              <ResponsiveContainer width="100%" height="80%">
                {pieData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`GH¢${value.toLocaleString()}`, "Amount"]}
                      contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm font-bold uppercase tracking-widest">
                    No expenses logged
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-widest">
                Financial Ledger
              </h4>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {['all', 'revenue', 'expenses', 'reinvestments'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-black"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              {displayEntries.length === 0 ? (
                <div className="p-12 text-center text-gray-500 font-medium whitespace-pre-line">
                  {`No entries found for the selected period.
                  Add some revenue or expenses to see them here.`}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase">
                        Reference
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase text-right">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black tracking-widest text-gray-500 uppercase text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {displayEntries.map((entry, idx) => (
                      <tr key={entry.id || idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
                          {formatDate(entry.createdAt || entry.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-gray-900">
                            {entry.paymentReference || entry.id?.slice(0, 8) || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-black max-w-xs truncate">
                            {entry.description || (entry.items ? entry.items.map(i => i.productName).join(', ') : 'Direct Sale')}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {entry.source || entry.category}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                            entry.type === 'revenue' 
                              ? 'bg-green-50 text-green-600' 
                              : entry.type === 'expense' 
                                ? 'bg-red-50 text-red-600' 
                                : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-xs font-black ${
                          entry.type === 'revenue' 
                            ? 'text-green-600' 
                            : entry.type === 'expense' 
                              ? 'text-red-600' 
                              : 'text-indigo-600'
                        }`}>
                          {entry.type === 'revenue' ? '+' : '-'}GH¢{entry.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeleteLedgerEntry(entry)}
                            disabled={deleteLedgerEntryMutation.isLoading}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        onSuccess={handleRefetch}
      />
      <ReinvestmentModal 
        isOpen={isReinvestmentModalOpen} 
        onClose={() => setIsReinvestmentModalOpen(false)} 
        onSuccess={handleRefetch}
      />
    </div>
  );
}
