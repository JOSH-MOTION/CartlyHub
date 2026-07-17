"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Trash2, RefreshCcw, Receipt, Layers, Download, ArrowUpRight, PieChart as PieIcon } from "lucide-react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
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
  const [simUnitCost, setSimUnitCost] = useState("");
  const [simQty, setSimQty] = useState("");
  const [allowProfitDeduction, setAllowProfitDeduction] = useState(false);
  const [companySavingsStr, setCompanySavingsStr] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cartly-savings") || "0";
    }
    return "0";
  });
  const companySavings = Number(companySavingsStr) || 0;

  const handleSavingsChange = (val) => {
    setCompanySavingsStr(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("cartly-savings", val);
    }
  };

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

  const [isResetting, setIsResetting] = useState(false);
  const [isResettingSales, setIsResettingSales] = useState(false);

  const handleResetSalesOnly = async () => {
    const confirmFirst = confirm("This will permanently delete all sales data (online orders and manual sales) to reset your sales profit. Reinvestments and expenses will NOT be touched.\n\nAre you sure you want to proceed?");
    if (!confirmFirst) return;

    setIsResettingSales(true);
    const toastId = toast.loading("Resetting sales history...");

    try {
      // 1. Delete manual sales
      const manualSalesSnapshot = await getDocs(collection(db, "manualSales"));
      const manualSalesDeletes = manualSalesSnapshot.docs.map(docRef => deleteDoc(doc(db, "manualSales", docRef.id)));

      // 2. Delete orders
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const ordersDeletes = ordersSnapshot.docs.map(docRef => deleteDoc(doc(db, "orders", docRef.id)));

      await Promise.all([
        ...manualSalesDeletes,
        ...ordersDeletes
      ]);

      toast.success("Sales history reset successfully!", { id: toastId });
      
      queryClient.invalidateQueries(["admin-financials"]);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["manualSales"]);
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error resetting sales:", error);
      toast.error("Failed to reset sales records", { id: toastId });
    } finally {
      setIsResettingSales(false);
    }
  };

  const handleResetFinancials = async () => {
    const confirmFirst = confirm("WARNING: This will permanently delete all sales data (online orders and manual sales), recorded expenses, and reinvestments. This action cannot be undone.\n\nAre you sure you want to proceed?");
    if (!confirmFirst) return;

    const confirmSecond = prompt("To confirm, type 'RESET' in the box below:");
    if (confirmSecond !== "RESET") {
      toast.error("Confirmation failed. Reset cancelled.");
      return;
    }

    setIsResetting(true);
    const toastId = toast.loading("Resetting financial history...");

    try {
      // 1. Delete expenses
      const expensesSnapshot = await getDocs(collection(db, "expenses"));
      const expenseDeletes = expensesSnapshot.docs.map(docRef => deleteDoc(doc(db, "expenses", docRef.id)));

      // 2. Delete reinvestments
      const reinvestmentsSnapshot = await getDocs(collection(db, "reinvestments"));
      const reinvestmentDeletes = reinvestmentsSnapshot.docs.map(docRef => deleteDoc(doc(db, "reinvestments", docRef.id)));

      // 3. Delete manual sales
      const manualSalesSnapshot = await getDocs(collection(db, "manualSales"));
      const manualSalesDeletes = manualSalesSnapshot.docs.map(docRef => deleteDoc(doc(db, "manualSales", docRef.id)));

      // 4. Delete orders
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const ordersDeletes = ordersSnapshot.docs.map(docRef => deleteDoc(doc(db, "orders", docRef.id)));

      await Promise.all([
        ...expenseDeletes,
        ...reinvestmentDeletes,
        ...manualSalesDeletes,
        ...ordersDeletes
      ]);

      toast.success("Financial ledger reset successfully!", { id: toastId });
      
      // Invalidate queries to refresh dashboard and ledger charts
      queryClient.invalidateQueries(["admin-financials"]);
      queryClient.invalidateQueries(["expenses"]);
      queryClient.invalidateQueries(["reinvestments"]);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["manualSales"]);
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error resetting financials:", error);
      toast.error("Failed to reset financial records", { id: toastId });
    } finally {
      setIsResetting(false);
    }
  };

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

  // Sort reinvestments to find the oldest entry dynamically
  const chronologicalReinvestments = [...reinvestments].sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.date || a.createdAt));
    const dateB = b.date?.toDate ? b.date.toDate() : (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.date || b.createdAt));
    return dateA - dateB;
  });
  const oldestReinvestmentId = chronologicalReinvestments[0]?.id;

  // Helper to identify capital inflows
  const isCapitalInflow = (r) => {
    if (r.id && r.id === oldestReinvestmentId) return true;
    if (r.reinvestmentType === "capital" || r.entryType === "inflow" || r.reinvestmentType === "simple") return true;
    const desc = (r.description || "").toLowerCase();
    return desc.includes("initial") || desc.includes("capital") || desc.includes("injection") || desc.includes("starting");
  };

  // Financial Computations
  const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const grossProfit = filteredTransactions.reduce((sum, tx) => sum + tx.totalProfit, 0);
  const totalExpenses = filteredExpenses.reduce((sum, ex) => sum + ex.totalAmount, 0);
  
  // Total Capital Injected (Inflows)
  const totalCapital = filteredReinvestments
    .filter(isCapitalInflow)
    .reduce((sum, re) => sum + re.totalAmount, 0);

  // Total Reinvested in Stock (Outflows)
  const totalReinvested = filteredReinvestments
    .filter(re => !isCapitalInflow(re))
    .reduce((sum, re) => sum + re.totalAmount, 0);

  const netBalance = grossProfit - totalExpenses;
  const cogs = totalRevenue - grossProfit;

  // Cartly Hub Custom Accounting Double-Pot Calculations
  const rawCostCapitalPool = totalCapital + cogs - totalReinvested;
  const costCapitalPool = Math.max(0, rawCostCapitalPool);

  const restockDeficit = Math.max(0, totalReinvested - (totalCapital + cogs));
  const savingsUsed = Math.min(restockDeficit, companySavings);
  const remainingDeficitAfterSavings = Math.max(0, restockDeficit - savingsUsed);
  const borrowedFromProfit = remainingDeficitAfterSavings;

  const pureProfitPool = grossProfit - totalExpenses - borrowedFromProfit;
  
  // Current Company Cash Balance = Initial Capital + Net Profit - Capital spent on stock
  const totalCompanyCash = totalCapital + netBalance - totalReinvested;
  
  // Remaining profit displays the Pure Profit Pool balance under Cartly Hub rules
  const remainingProfit = pureProfitPool;
  
  const avgMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Simulator Calculations
  const simCost = Number(simUnitCost) || 0;
  const simTargetQty = Number(simQty) || 0;
  const simTargetTotal = simCost * simTargetQty;
  
  let simCalculatedQty = 0;
  let simTotalCost = 0;
  let simDrawnCapital = 0;
  let simDrawnSavings = 0;
  let simDrawnProfit = 0;

  if (simCost > 0 && simTargetQty > 0) {
    if (allowProfitDeduction) {
      simCalculatedQty = simTargetQty;
      simTotalCost = simTargetTotal;
      simDrawnCapital = Math.min(simTotalCost, costCapitalPool);
      const remainingAfterCapital = Math.max(0, simTotalCost - simDrawnCapital);
      simDrawnSavings = Math.min(remainingAfterCapital, companySavings);
      simDrawnProfit = Math.max(0, remainingAfterCapital - simDrawnSavings);
    } else {
      const maxSafeBudget = costCapitalPool + companySavings;
      if (simTargetTotal <= maxSafeBudget) {
        simCalculatedQty = simTargetQty;
        simTotalCost = simTargetTotal;
        simDrawnCapital = Math.min(simTotalCost, costCapitalPool);
        const remainingAfterCapital = Math.max(0, simTotalCost - simDrawnCapital);
        simDrawnSavings = Math.min(remainingAfterCapital, companySavings);
        simDrawnProfit = 0;
      } else {
        simCalculatedQty = Math.floor(maxSafeBudget / simCost);
        simTotalCost = simCalculatedQty * simCost;
        simDrawnCapital = Math.min(simTotalCost, costCapitalPool);
        const remainingAfterCapital = Math.max(0, simTotalCost - simDrawnCapital);
        simDrawnSavings = Math.min(remainingAfterCapital, companySavings);
        simDrawnProfit = 0;
      }
    }
  }

  const simIsSafe = simDrawnProfit === 0;

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

  // Export to Excel Function with Colors
  const handleExportExcel = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `CartlyHub-Ledger-${activeTab}-${dateStr}.xls`;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Financial Ledger</x:Name>
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
          th { background-color: #111827; color: #ffffff; font-weight: bold; padding: 12px 10px; border: 1px solid #d1d5db; text-transform: uppercase; font-size: 9pt; }
          td { padding: 8px 10px; border: 1px solid #e5e7eb; }
          .revenue { background-color: #DEF7EC; color: #03543F; font-weight: bold; }
          .expense { background-color: #FDE8E8; color: #9B1C1C; }
          .reinvestment { background-color: #E0E7FF; color: #3730A3; }
          .amount { text-align: right; }
        </style>
      </head>
      <body>
        <h2>CartlyHub Financial Ledger - Exported on ${new Date().toLocaleDateString()}</h2>
        <br/>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Reference</th>
              <th>Type</th>
              <th>Source / Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Net Profit</th>
              <th>COGS</th>
            </tr>
          </thead>
          <tbody>
    `;

    displayEntries.forEach(t => {
      const date = t.createdAt?.toDate ? t.createdAt.toDate() : (t.date?.toDate ? t.date.toDate() : new Date(t.createdAt || t.date));
      const ref = t.paymentReference || t.id?.slice(0, 8) || 'N/A';
      const typeStr = t.type.toUpperCase();
      const sourceStr = t.source === 'manual' ? 'Manual POS' : t.source === 'online' ? 'Online Store' : t.source || t.category || 'N/A';
      const desc = t.description || (t.items ? t.items.map(i => i.productName).join(', ') : 'Direct Sale');
      
      const amountVal = t.totalAmount;
      const profitVal = t.totalProfit || 0;
      const cogsVal = t.type === 'revenue' ? (t.totalAmount - t.totalProfit) : 0;

      let rowClass = '';
      let amountPrefix = '';
      if (t.type === 'revenue') {
        rowClass = 'revenue';
        amountPrefix = '+';
      } else if (t.type === 'expense') {
        rowClass = 'expense';
        amountPrefix = '-';
      } else {
        if (isCapitalInflow(t)) {
          rowClass = 'revenue'; // Green style
          amountPrefix = '+';
        } else {
          rowClass = 'reinvestment';
          amountPrefix = '-';
        }
      }

      html += `
        <tr>
          <td>${date.toLocaleDateString()}</td>
          <td>${date.toLocaleTimeString()}</td>
          <td>${ref}</td>
          <td class="${rowClass}">${typeStr}</td>
          <td>${sourceStr}</td>
          <td>${desc}</td>
          <td class="amount ${rowClass}">${amountPrefix}GH¢${amountVal.toFixed(2)}</td>
          <td class="amount" style="${profitVal > 0 ? 'color: #03543F; font-weight: bold; background-color: #DEF7EC;' : ''}">GH¢${profitVal.toFixed(2)}</td>
          <td class="amount">GH¢${cogsVal.toFixed(2)}</td>
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
    toast.success("Ledger exported to styled Excel sheet successfully!");
  };

  const handleExportCSV = () => {
    const exportData = displayEntries.map(t => {
      const date = t.createdAt?.toDate ? t.createdAt.toDate() : (t.date?.toDate ? t.date.toDate() : new Date(t.createdAt || t.date));
      const isInflow = t.type === 'revenue' || (t.type === 'reinvestment' && isCapitalInflow(t));
      return {
        "Date": date.toLocaleDateString('en-US'),
        "Time": date.toLocaleTimeString('en-US'),
        "Reference": t.paymentReference || t.id?.slice(0, 8) || 'N/A',
        "Type": t.type === 'reinvestment' && isCapitalInflow(t) ? 'CAPITAL' : t.type.toUpperCase(),
        "Source/Category": t.source === 'manual' ? 'Manual POS' : t.source === 'online' ? 'Online Store' : t.source || t.category || 'N/A',
        "Description": t.description || (t.items ? t.items.map(i => i.productName).join(', ') : 'Direct Sale'),
        "Amount (GH¢)": (isInflow ? '+' : '-') + t.totalAmount.toFixed(2),
        "Net Profit (GH¢)": (t.totalProfit || 0).toFixed(2),
        "COGS (GH¢)": t.type === 'revenue' ? (t.totalAmount - (t.totalProfit || 0)).toFixed(2) : '0.00',
      };
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CartlyHub-Ledger-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Ledger exported to CSV successfully!");
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Accounting
          </span>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter uppercase">Financial Ledger</h1>
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
            title="Refresh Ledger"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center space-x-2 bg-white text-black border-2 border-black px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Record Expense</span>
          </button>

          <button
            onClick={() => setIsReinvestmentModalOpen(true)}
            className="flex items-center space-x-2 bg-white text-indigo-600 border-2 border-indigo-600 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all shadow-sm"
          >
            <ArrowUpRight className="h-4 w-4" />
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

          <button
            onClick={handleResetSalesOnly}
            disabled={isResettingSales}
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-md shadow-amber-100 disabled:opacity-50"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>{isResettingSales ? "Resetting Sales..." : "Reset Sales Only"}</span>
          </button>

          <button
            onClick={handleResetFinancials}
            disabled={isResetting}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-md shadow-red-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isResetting ? "Resetting..." : "Reset"}</span>
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
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 w-max">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cost Capital Pool</p>
                <h3 className="text-2xl font-black text-indigo-600 tracking-tighter">GH¢{costCapitalPool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Locked restock pot</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 w-max">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Company Savings</p>
                <div className="flex items-center space-x-1 border-b border-transparent hover:border-gray-200 focus-within:border-black transition-colors pb-0.5 mt-1">
                  <span className="text-2xl font-black text-blue-600">₵</span>
                  <input
                    type="number"
                    className="text-2xl font-black text-blue-600 bg-transparent outline-none w-full p-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={companySavingsStr}
                    onChange={(e) => handleSavingsChange(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Priority 2 backup pot</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-green-50 rounded-xl text-green-600 w-max">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Pure Profit Pool</p>
                <h3 className={`text-2xl font-black tracking-tighter ${pureProfitPool >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  GH¢{pureProfitPool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Safe profit earnings</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 space-y-4">
              <div className="p-3 bg-green-50 rounded-xl text-green-600 w-max">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Company Cash Balance</p>
                <h3 className={`text-2xl font-black tracking-tighter ${totalCompanyCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  GH¢{totalCompanyCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Total liquid company cash</p>
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

          {/* Restock Funding Calculator & Guardrail */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-indigo-100 bg-gradient-to-r from-indigo-50/20 via-white to-white space-y-6">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-1 block">
                Simulator
              </span>
              <h4 className="text-lg font-black uppercase tracking-tighter text-gray-900">
                Restock Funding Calculator & Profit Guardrail
              </h4>
              <p className="text-xs text-gray-500 font-medium">
                Simulate bulk restocking orders under the Cartly Hub Double-Pot sequential priority rules.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Simulator Inputs */}
              <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Parameters</h5>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Unit Cost (GH₵)</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-black"
                    value={simUnitCost}
                    onChange={(e) => setSimUnitCost(e.target.value)}
                    placeholder="e.g. 35"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Target Quantity (pcs)</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-black"
                    value={simQty}
                    onChange={(e) => setSimQty(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-700">Allow Profit Deduction</label>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Priority 3 Pool usage</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowProfitDeduction(!allowProfitDeduction)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${allowProfitDeduction ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowProfitDeduction ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Calculator Output */}
              <div className="lg:col-span-2 space-y-6">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Restock Funding Analysis</h5>
                {(!simUnitCost || !simQty || Number(simUnitCost) <= 0 || Number(simQty) <= 0) ? (
                  <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-xs font-bold uppercase">
                    Enter positive unit cost and quantity to run simulation
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Funding Allocation Details */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-500 uppercase">Simulated Quantity:</span>
                        <span className="text-sm font-black text-black">{simCalculatedQty} units</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-500 uppercase">Total Cash Required:</span>
                        <span className="text-sm font-black text-black">GH₵{simTotalCost.toFixed(2)}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-indigo-600 uppercase">1. Cost Capital Pool:</span>
                          <span className="font-black text-black">GH₵{simDrawnCapital.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full" style={{ width: `${simTotalCost > 0 ? (simDrawnCapital / simTotalCost) * 100 : 0}%` }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-blue-600 uppercase">2. Company Savings Pot:</span>
                          <span className="font-black text-black">GH₵{simDrawnSavings.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${simTotalCost > 0 ? (simDrawnSavings / simTotalCost) * 100 : 0}%` }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-violet-600 uppercase">3. Pure Profit Pool:</span>
                          <span className="font-black text-black">GH₵{simDrawnProfit.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-violet-600 h-full" style={{ width: `${simTotalCost > 0 ? (simDrawnProfit / simTotalCost) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Guardrail Decisions Card */}
                    <div className="bg-gray-50 p-6 rounded-2xl flex flex-col justify-between border border-gray-100" style={{ backgroundColor: '#F9FAFB' }}>
                      <div>
                        <h6 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Guardrail Evaluation</h6>
                        {simIsSafe ? (
                          <div className="space-y-2">
                            <span className="inline-flex px-3 py-1 bg-green-50 text-green-600 border border-green-200 rounded-full text-[9px] font-black uppercase tracking-widest">
                              Fully Funded (Safe)
                            </span>
                            <p className="text-xs font-bold text-gray-600 leading-relaxed uppercase">
                              This restock is fully covered by your Cost Capital Pool and Company Savings. Your Pure Profit Pool is completely untouched!
                            </p>
                          </div>
                        ) : allowProfitDeduction ? (
                          <div className="space-y-2">
                            <span className="inline-flex px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[9px] font-black uppercase tracking-widest">
                              Profit Deducted (Allowed)
                            </span>
                            <p className="text-xs font-bold text-gray-600 leading-relaxed uppercase">
                              Funding exceeded Capital and Savings. Borrowing <span className="text-amber-600 font-black">GH₵{simDrawnProfit.toFixed(2)}</span> from your Pure Profit Pool to cover the remaining balance.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <span className="inline-flex px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                              Guardrail Triggered
                            </span>
                            <p className="text-[11px] font-black text-red-600 leading-tight uppercase">
                              Scaled down order from {simQty} to {simCalculatedQty} units.
                            </p>
                            <p className="text-xs font-bold text-gray-500 leading-normal uppercase">
                              Profit guardrail prevents borrowing from the Pure Profit Pool. The order has been dynamically resized to fit available safe funds (GH₵{(costCapitalPool + companySavings).toFixed(2)}).
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Display Safe Funding Total */}
                      <div className="pt-4 border-t border-gray-200/50 mt-4 flex justify-between items-baseline">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Effective Spend:</span>
                        <span className="text-lg font-black text-black">GH₵{(simCalculatedQty * Number(simUnitCost)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <h4 className="text-xs font-black uppercase tracking-widest">
                Financial Ledger
              </h4>
              <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto whitespace-nowrap scrollbar-none">
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
                                : isCapitalInflow(entry)
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {entry.type === 'reinvestment' && isCapitalInflow(entry) ? 'capital' : entry.type}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-xs font-black ${
                          entry.type === 'revenue' 
                            ? 'text-green-600' 
                            : entry.type === 'expense' 
                              ? 'text-red-600' 
                              : isCapitalInflow(entry)
                                ? 'text-emerald-600'
                                : 'text-indigo-600'
                        }`}>
                          {entry.type === 'revenue' || (entry.type === 'reinvestment' && isCapitalInflow(entry)) ? '+' : '-'}GH¢{entry.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
