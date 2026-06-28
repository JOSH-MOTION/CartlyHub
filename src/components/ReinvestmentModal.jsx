"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, Calendar, FileText, Loader2, ArrowUpRight, Plus, RefreshCw, Sparkles } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { getProducts, getCategories } from "@/utils/firebaseData";

export default function ReinvestmentModal({ isOpen, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  // Tab configuration: 'simple', 'restock', 'new'
  const [mode, setMode] = useState("restock"); 

  // Simple form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Restock form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [restockQty, setRestockQty] = useState("");

  // New product form state
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  const [newProductCostPrice, setNewProductCostPrice] = useState("");
  const [newProductSellingPrice, setNewProductSellingPrice] = useState("");
  const [newProductSize, setNewProductSize] = useState("");
  const [newProductColor, setNewProductColor] = useState("");
  const [newProductQty, setNewProductQty] = useState("");
  const [newProductSupplier, setNewProductSupplier] = useState("");

  // Fetch admin products
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const prod = await getProducts();
      return prod.filter(p => !p.sellerId);
    },
    enabled: isOpen,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    enabled: isOpen,
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Auto-select first variant when product changes
  useEffect(() => {
    if (selectedProduct && selectedProduct.variants?.length > 0) {
      setSelectedVariantId(selectedProduct.variants[0].vId);
    } else {
      setSelectedVariantId("");
    }
  }, [selectedProductId, selectedProduct]);

  // Compute calculated amounts dynamically
  let computedAmount = "";
  if (mode === "restock" && selectedProduct && selectedVariantId && restockQty) {
    const cost = Number(selectedProduct.costPrice || 0);
    computedAmount = (cost * Number(restockQty)).toFixed(2);
  } else if (mode === "new" && newProductCostPrice && newProductQty) {
    computedAmount = (Number(newProductCostPrice) * Number(newProductQty)).toFixed(2);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "simple") {
        if (!description || !amount || !date) {
          toast.error("Please fill in all fields");
          setIsLoading(false);
          return;
        }

        await addDoc(collection(db, "reinvestments"), {
          description,
          amount: Number(amount),
          date: Timestamp.fromDate(new Date(date)),
          createdAt: Timestamp.now(),
          type: "reinvestment",
          reinvestmentType: "simple"
        });
      }
      else if (mode === "restock") {
        if (!selectedProductId || !selectedVariantId || !restockQty || !date) {
          toast.error("Please select a product, variant, and quantity");
          setIsLoading(false);
          return;
        }

        const qty = Number(restockQty);
        const costPrice = Number(selectedProduct.costPrice || 0);
        const totalCost = costPrice * qty;

        const productRef = doc(db, "products", selectedProductId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
          throw new Error("Product does not exist in database");
        }

        const productData = productSnap.data();
        const updatedVariants = productData.variants.map(v => {
          if (v.vId === selectedVariantId) {
            return {
              ...v,
              stock: (Number(v.stock) || 0) + qty
            };
          }
          return v;
        });

        // 1. Update product stock
        await updateDoc(productRef, {
          variants: updatedVariants,
          updatedAt: Timestamp.now()
        });

        // 2. Log reinvestment
        const variantObj = productData.variants.find(v => v.vId === selectedVariantId);
        const desc = `Restocked ${qty}x ${selectedProduct.name} ${variantObj?.size ? `(Size: ${variantObj.size})` : ""} ${variantObj?.color ? `(Color: ${variantObj.color})` : ""}`;
        
        await addDoc(collection(db, "reinvestments"), {
          description: desc,
          amount: totalCost,
          date: Timestamp.fromDate(new Date(date)),
          createdAt: Timestamp.now(),
          type: "reinvestment",
          reinvestmentType: "restock",
          linkedProductId: selectedProductId,
          linkedVariantId: selectedVariantId,
          linkedQty: qty
        });
      }
      else if (mode === "new") {
        if (!newProductName || !newProductCategoryId || !newProductCostPrice || !newProductSellingPrice || !newProductQty || !date) {
          toast.error("Please fill in all required fields for the new product");
          setIsLoading(false);
          return;
        }

        const qty = Number(newProductQty);
        const cost = Number(newProductCostPrice);
        const price = Number(newProductSellingPrice);
        const totalCost = cost * qty;

        // Generate clean URL slug from name
        const slug = newProductName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

        // 1. Create product document
        const newProductPayload = {
          name: newProductName,
          description: `Quick added inventory for ${newProductName}`,
          categoryId: newProductCategoryId,
          basePrice: price,
          costPrice: cost,
          supplier: newProductSupplier || "N/A",
          sellerName: "cartly Hub Admin",
          sellerPhone: "",
          isFeatured: false,
          isRental: false,
          isBulk: false,
          packSize: 1,
          images: [],
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          variants: [{
            vId: Date.now().toString(),
            size: newProductSize || "Standard",
            color: newProductColor || "Standard",
            stock: qty,
            price: price,
            sku: `${slug.toUpperCase()}-${newProductSize || 'STD'}`,
            hexColor: ""
          }]
        };

        const productDocRef = await addDoc(collection(db, "products"), newProductPayload);

        // 2. Log reinvestment
        const desc = `Purchased inventory for new product: ${newProductName} (${qty} items, Cost: GH¢${cost.toFixed(2)} each)`;
        await addDoc(collection(db, "reinvestments"), {
          description: desc,
          amount: totalCost,
          date: Timestamp.fromDate(new Date(date)),
          createdAt: Timestamp.now(),
          type: "reinvestment",
          reinvestmentType: "new_product",
          linkedProductId: productDocRef.id,
          linkedQty: qty
        });
      }

      toast.success("Reinvestment and inventory updated successfully");
      
      // Invalidate React Queries
      queryClient.invalidateQueries(["reinvestments"]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["admin", "products"]);
      queryClient.invalidateQueries(["admin-financials"]);

      // Reset Form fields
      setDescription("");
      setAmount("");
      setSelectedProductId("");
      setSelectedVariantId("");
      setRestockQty("");
      setNewProductName("");
      setNewProductCategoryId("");
      setNewProductCostPrice("");
      setNewProductSellingPrice("");
      setNewProductSize("");
      setNewProductColor("");
      setNewProductQty("");
      setNewProductSupplier("");

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error processing reinvestment:", error);
      toast.error(error.message || "Failed to process reinvestment");
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

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-8 pb-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
              <span>Log Reinvestment</span>
              <ArrowUpRight className="h-6 w-6 text-indigo-600 animate-pulse" />
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Growth & Inventory</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-gray-50 p-2 mx-8 mt-4 rounded-2xl flex-shrink-0">
          <button
            type="button"
            onClick={() => setMode("restock")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              mode === "restock" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-black"
            }`}
          >
            <RefreshCw className="h-3 w-3" />
            <span>Restock</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              mode === "new" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-black"
            }`}
          >
            <Plus className="h-3 w-3" />
            <span>Add Product</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("simple")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              mode === "simple" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-black"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>General</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-8 pt-4 space-y-6">
          
          {/* General mode form */}
          {mode === "simple" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Description / Purpose
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marketing reinvestment or stock purchases"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Restock Mode Form */}
          {mode === "restock" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Select Product to Restock
                </label>
                <select
                  required
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all outline-none"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Supplier: {p.supplier || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                      Choose Variant (Size/Color)
                    </label>
                    <select
                      required
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all outline-none"
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                    >
                      {selectedProduct.variants?.map(v => (
                        <option key={v.vId} value={v.vId}>
                          {v.size || 'STD'} / {v.color || 'STD'} (Stock: {v.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                      Quantity to Buy
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 50"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Calculated Cost (Reinvested Amount)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      readOnly
                      placeholder="GH¢0.00"
                      className="w-full bg-indigo-50/50 text-indigo-600 border-none rounded-2xl py-4 pl-12 pr-4 font-black text-sm outline-none"
                      value={computedAmount ? `GH¢${computedAmount}` : ""}
                    />
                  </div>
                  {selectedProduct && (
                    <p className="text-[10px] text-gray-400 font-bold uppercase ml-1">
                      Based on unit Cost Price: GH¢{Number(selectedProduct.costPrice || 0).toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* New Product Form */}
          {mode === "new" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Floral Chiffon Dress"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Category *
                  </label>
                  <select
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all outline-none"
                    value={newProductCategoryId}
                    onChange={(e) => setNewProductCategoryId(e.target.value)}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.filter(c => !c.parentId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Cost Price (Buying Price) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="e.g. 50.00"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={newProductCostPrice}
                    onChange={(e) => setNewProductCostPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="e.g. 100.00"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={newProductSellingPrice}
                    onChange={(e) => setNewProductSellingPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Size (e.g. M, L)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. XL"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={newProductSize}
                    onChange={(e) => setNewProductSize(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Color
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Yellow"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={newProductColor}
                    onChange={(e) => setNewProductColor(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Qty Purchased *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 100"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={newProductQty}
                    onChange={(e) => setNewProductQty(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Makola Market Vendor"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={newProductSupplier}
                    onChange={(e) => setNewProductSupplier(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Calculated Cost (Reinvested Amount)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    readOnly
                    placeholder="GH¢0.00"
                    className="w-full bg-indigo-50/50 text-indigo-600 border-none rounded-2xl py-4 pl-12 pr-4 font-black text-sm outline-none"
                    value={computedAmount ? `GH¢${computedAmount}` : ""}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center space-x-2 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                <span>
                  {mode === "restock" ? "Reinvest & Restock Stock" : mode === "new" ? "Reinvest & Create Product" : "Confirm Reinvestment"}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
