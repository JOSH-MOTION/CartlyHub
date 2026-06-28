"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, DollarSign, Trash2, RefreshCcw, ArrowUpRight, Download, Layers } from "lucide-react";
import { collection, getDocs, deleteDoc, doc, query, orderBy, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { getOrders, getManualSales, getProducts } from "@/utils/firebaseData";
import ReinvestmentModal from "@/components/ReinvestmentModal";
import Papa from "papaparse";
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

export default function AdminReinvestmentsPage() {
  const [dateFilter, setDateFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch products (to filter admin products)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products", { includePrivate: true }],
    queryFn: async () => {
      try {
        return await getProducts({ includePrivate: true });
      } catch (error) {
        return [];
      }
    },
  });

  // Fetch expenses (to calculate net profit = gross profit - expenses)
  const { data: expenses = [], isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const q = query(collection(db, "expenses"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        amount: Number(doc.data().amount || 0)
      }));
    },
  });

  // Fetch consolidated transactions (orders + manual sales) for gross profit
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
          totalProfit: Number(o.totalProfit || 0)
        }));
        
        const processedManual = manualSales.map(m => ({
          ...m,
          totalProfit: Number(m.totalProfit || 0)
        }));
        
        return [...processedOnline, ...processedManual];
      } catch (error) {
        console.error('Error fetching consolidated financials:', error);
        return [];
      }
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

  // Delete mutation for reinvestments
  const deleteReinvestmentMutation = useMutation({
    mutationFn: async (entry) => {
      // Revert stock logic if it was a restock
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["reinvestments"]);
      toast.success("Reinvestment log deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting reinvestment:", error);
      toast.error("Failed to delete reinvestment log");
    }
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
  const filteredExpenses = filterByDate(expenses);
  const filteredReinvestments = filterByDate(reinvestments);

  // Financial Computations
  const grossProfit = filteredTransactions.reduce((sum, tx) => sum + tx.totalProfit, 0);
  const totalExpenses = filteredExpenses.reduce((sum, ex) => sum + ex.amount, 0);
  const totalReinvested = filteredReinvestments.reduce((sum, re) => sum + re.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const remainingProfit = netProfit - totalReinvested;

  const handleRefetch = () => {
    refetchTransactions();
    refetchExpenses();
    refetchReinvestments();
  };

  // Export to Excel Function with Colors (Reinvestments only)
  const handleExportExcel = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `CartlyHub-Reinvestments-${dateStr}.xls`;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Reinvestment Ledger</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt; }
          th { background-color: #4F46E5; color: #ffffff; font-weight: bold; padding: 12px 10px; border: 1px solid #d1d5db; text-transform: uppercase; font-size: 9pt; }
          td { padding: 8px 10px; border: 1px solid #e5e7eb; }
          .reinvestment { background-color: #E0E7FF; color: #3730A3; font-weight: bold; }
          .amount { text-align: right; }
        </style>
      </head>
      <body>
        <h2>CartlyHub Reinvestment Ledger - Exported on ${new Date().toLocaleDateString()}</h2>
        <br/>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Reference ID</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredReinvestments.forEach(r => {
      const date = r.date?.toDate ? r.date.toDate() : (r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.date || r.createdAt));
      const ref = r.id?.slice(0, 8) || 'N/A';
      const desc = r.description || 'Restocking Reinvestment';
      const amountVal = r.amount;

      html += `
        <tr>
          <td>${date.toLocaleDateString()}</td>
          <td>${date.toLocaleTimeString()}</td>
          <td>${ref}</td>
          <td>${desc}</td>
          <td class="amount reinvestment">-GH¢${amountVal.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Reinvestments exported to styled Excel sheet successfully!");
  };

  const handleExportCSV = () => {
    const exportData = filteredReinvestments.map(r => {
      const date = r.date?.toDate ? r.date.toDate() : (r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.date || r.createdAt));
      return {
        "Date": date.toLocaleDateString('en-US'),
        "Time": date.toLocaleTimeString('en-US'),
        "Reference ID": r.id?.slice(0, 8) || 'N/A',
        "Description": r.description || 'Restocking Reinvestment',
        "Amount (GH¢)": r.amount.toFixed(2),
      };
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CartlyHub-Reinvestments-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Reinvestments exported to CSV successfully!");
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

  const handleDelete = (entry) => {
    if (!confirm('Are you sure you want to delete this reinvestment entry? This will adjust your remaining profit calculation.')) {
      return;
    }
    deleteReinvestmentMutation.mutate(entry);
  };

  // Reinvestment Type Pie Chart Data
  const pieData = useMemo(() => {
    const breakdown = filteredReinvestments.reduce((acc, r) => {
      const type = r.reinvestmentType === 'restock' 
        ? 'Restocking' 
        : r.reinvestmentType === 'new_product' 
          ? 'New Products' 
          : 'Other Reinvestments';
      acc[type] = (acc[type] || 0) + r.amount;
      return acc;
    }, {});

    return Object.entries(breakdown).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [filteredReinvestments]);

  const PIE_COLORS = ['#6366F1', '#4F46E5', '#312E81', '#E0E7FF'];

  // Monthly Reinvestment Bar Chart Data
  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const lastSixMonths = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      lastSixMonths.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        name: months[d.getMonth()],
        Reinvested: 0,
      });
    }

    filteredReinvestments.forEach(r => {
      const date = r.date?.toDate ? r.date.toDate() : (r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.date || r.createdAt));
      if (!date) return;
      const m = date.getMonth();
      const y = date.getFullYear();

      const dataPoint = lastSixMonths.find(p => p.month === m && p.year === y);
      if (dataPoint) {
        dataPoint.Reinvested += r.amount;
      }
    });

    return lastSixMonths;
  }, [filteredReinvestments]);

  const isLoading = transactionsLoading || expensesLoading || reinvestmentsLoading || productsLoading;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Capital Growth
          </span>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter uppercase">Reinvestment Ledger</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
            className="flex items-center space-x-2 bg-gray-100 text-black px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-white text-indigo-600 border-2 border-indigo-600 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all shadow-sm animate-pulse"
          >
            <Plus className="h-4 w-4" />
            <span>Record Reinvestment</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-white text-black border-2 border-black px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-black text-white px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-md shadow-black/10"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-max">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Net profit</p>
                <h3 className="text-3xl font-black text-emerald-600 tracking-tighter">
                  GH¢{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Sales profit minus expenses</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-max">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Reinvested</p>
                <h3 className="text-3xl font-black text-indigo-600 tracking-tighter">
                  GH¢{totalReinvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Capital reinvested in stock</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl w-max">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Remaining Profit</p>
                <h3 className={`text-3xl font-black tracking-tighter ${remainingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  GH¢{remainingProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Profit available for withdrawal</p>
              </div>
            </div>
          </div>

          {/* Reinvestment Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Monthly Trend Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 h-[380px] min-w-0">
              <h4 className="text-xs font-black uppercase tracking-widest mb-6">
                Monthly Reinvestment Trend
              </h4>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                  <Tooltip 
                    cursor={{ fill: "#f9f9f9" }} 
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} 
                    formatter={(value) => [`GH¢${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Reinvested"]}
                  />
                  <Bar dataKey="Reinvested" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Type Breakdown Pie Chart */}
            <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 h-[380px] min-w-0">
              <h4 className="text-xs font-black uppercase tracking-widest mb-6">
                Reinvestment Breakdown
              </h4>
              <ResponsiveContainer width="100%" height="80%">
                {pieData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
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
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs font-bold uppercase tracking-widest">
                    No reinvestments logged
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-widest">
                Reinvestment Transactions
              </h4>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                {filteredReinvestments.length} log(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              {filteredReinvestments.length === 0 ? (
                <div className="p-16 text-center text-gray-500 font-medium whitespace-pre-line">
                  {`No reinvestment logs found.
                  Click "Record Reinvestment" to log your first entry.`}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-8 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-8 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase">
                        Reference
                      </th>
                      <th className="px-8 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-8 py-4 text-left text-[10px] font-black tracking-widest text-gray-500 uppercase text-right">
                        Amount
                      </th>
                      <th className="px-8 py-4 text-right text-[10px] font-black tracking-widest text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredReinvestments.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
                          {formatDate(entry.date || entry.createdAt)}
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-gray-900">
                            {entry.id?.slice(0, 8) || 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-xs font-bold text-black max-w-md">
                            {entry.description || 'Restocking inventory'}
                          </p>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-right text-xs font-black text-indigo-600">
                          -GH¢{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDelete(entry)}
                            disabled={deleteReinvestmentMutation.isLoading}
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

      <ReinvestmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleRefetch}
      />
    </div>
  );
}
