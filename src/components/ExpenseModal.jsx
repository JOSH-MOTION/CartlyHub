"use client";

import { useState } from "react";
import { X, DollarSign, Calendar, Tag, FileText, Loader2 } from "lucide-react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-hot-toast";

const EXPENSE_CATEGORIES = [
  { id: "stock", label: "Stock/Inventory", color: "bg-purple-100 text-purple-600" },
  { id: "supplies", label: "Supplies", color: "bg-blue-100 text-blue-600" },
  { id: "transport", label: "Transport", color: "bg-orange-100 text-orange-600" },
  { id: "marketing", label: "Marketing", color: "bg-pink-100 text-pink-600" },
  { id: "utilities", label: "Utilities", color: "bg-yellow-100 text-yellow-600" },
  { id: "rent", label: "Rent", color: "bg-green-100 text-green-600" },
  { id: "other", label: "Other", color: "bg-gray-100 text-gray-600" },
];

export default function ExpenseModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "stock",
    date: new Date().toISOString().split("T")[0],
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, "expenses"), {
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        date: Timestamp.fromDate(new Date(formData.date)),
        createdAt: Timestamp.now(),
        type: "business"
      });

      toast.success("Expense recorded successfully");
      setFormData({
        description: "",
        amount: "",
        category: "stock",
        date: new Date().toISOString().split("T")[0],
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error recording expense:", error);
      toast.error("Failed to record expense");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Record Expense</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Outflow Tracking</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Restocked 50 Packets of Milo"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Amount (GH₵)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`flex items-center justify-center py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                      formData.category === cat.id 
                      ? "border-black bg-black text-white" 
                      : "border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  <span>Confirm Expense</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
