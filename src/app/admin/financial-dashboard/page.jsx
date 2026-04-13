"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Trash2, RefreshCcw } from "lucide-react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { getOrders, getManualSales } from "@/utils/firebaseData";

export default function FinancialDashboard() {
  const [dateFilter, setDateFilter] = useState("all");
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    category: "supplies",
    date: new Date().toISOString().split('T')[0],
    type: "business"
  });

  const queryClient = useQueryClient();

  // Fetch expenses
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const q = query(collection(db, "expenses"), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  // Fetch orders for revenue calculation
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  // Fetch manual sales for revenue calculation
  const { data: manualSales, isLoading: manualSalesLoading } = useQuery({
    queryKey: ["manual-sales"],
    queryFn: async () => {
      const q = query(collection(db, "manual-sales"), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  });

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData) => {
      await addDoc(collection(db, "expenses"), {
        ...expenseData,
        amount: Number(expenseData.amount),
        date: Timestamp.fromDate(new Date(expenseData.date)),
        createdAt: Timestamp.now()
      });
    },
    onSuccess: () => {
      toast.success("Expense added successfully");
      setExpenseForm({
        description: "",
        amount: "",
        category: "supplies",
        date: new Date().toISOString().split('T')[0],
        type: "business"
      });
      queryClient.invalidateQueries(["expenses"]);
    },
    onError: (error) => {
      toast.error("Failed to add expense");
      console.error(error);
    }
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId) => {
      await deleteDoc(doc(db, "expenses", expenseId));
    },
    onSuccess: () => {
      toast.success("Expense deleted successfully");
      queryClient.invalidateQueries(["expenses"]);
    },
    onError: (error) => {
      toast.error("Failed to delete expense");
      console.error(error);
    }
  });

  // Calculate totals
  const calculateTotals = () => {
    const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const totalOrderRevenue = orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;
    const totalManualRevenue = manualSales?.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) || 0;
    const totalRevenue = totalOrderRevenue + totalManualRevenue;
    const profit = totalRevenue - totalExpenses;

    return {
      totalExpenses,
      totalRevenue,
      totalOrderRevenue,
      totalManualRevenue,
      profit,
      expenseCount: expenses?.length || 0,
      orderCount: orders?.length || 0,
      manualSaleCount: manualSales?.length || 0
    };
  };

  const totals = calculateTotals();

  const handleSubmitExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) {
      toast.error("Please fill in all fields");
      return;
    }
    addExpenseMutation.mutate(expenseForm);
  };

  const handleDeleteExpense = (expenseId) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(expenseId);
    }
  };

  if (expensesLoading || ordersLoading || manualSalesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-black mb-2">Financial Dashboard</h1>
          <p className="text-gray-600">Track your business expenses, revenue, and profit</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">GH₵{totals.totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">GH₵{totals.totalExpenses.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  GH₵{totals.profit.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-800">{totals.expenseCount + totals.orderCount + totals.manualSaleCount}</p>
              </div>
              <Package className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Expense Form */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-black mb-6">Add Expense</h2>
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Office supplies, fuel, materials..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (GH₵)</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="supplies">Supplies</option>
                  <option value="transport">Transport</option>
                  <option value="marketing">Marketing</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={addExpenseMutation.isLoading}
                className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {addExpenseMutation.isLoading ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-2xl shadow-sm p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">Recent Expenses</h2>
              <div className="text-sm text-gray-600">
                Total: <span className="font-bold text-red-600">GH₵{totals.totalExpenses.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {expenses?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No expenses recorded yet
                </div>
              ) : (
                expenses?.slice(0, 10).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                          {expense.category}
                        </span>
                        <span>{new Date(expense.date?.seconds * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-red-600">GH₵{expense.amount.toFixed(2)}</span>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-8">
          <h2 className="text-xl font-black mb-6">Revenue Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Online Orders</p>
              <p className="text-xl font-bold text-green-600">GH₵{totals.totalOrderRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{totals.orderCount} orders</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Manual Sales</p>
              <p className="text-xl font-bold text-blue-600">GH₵{totals.totalManualRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{totals.manualSaleCount} sales</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-purple-600">GH₵{totals.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{totals.orderCount + totals.manualSaleCount} transactions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
