"use client";

import { useState, useEffect, useMemo } from "react";
import { X, DollarSign, Calendar, FileText, Loader2, ArrowUpRight, Plus, RefreshCw, Sparkles } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { getProducts, getCategories } from "@/utils/firebaseData";
import { validateInventorySizes } from "@/utils/helpers";

export default function ReinvestmentModal({ isOpen, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  // Tab configuration: 'simple', 'restock', 'new'
  const [mode, setMode] = useState("restock"); 

  // Simple form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryType, setEntryType] = useState("outflow"); // "inflow" or "outflow"

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

  // Bulk state
  const [bulkText, setBulkText] = useState("");
  const [bulkActionType, setBulkActionType] = useState("new"); // "new" or "restock"
  const [bulkSelectedProductId, setBulkSelectedProductId] = useState("");

  // Fetch admin products
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const prod = await getProducts();
      return prod.filter(p => !p.sellerId);
    },
    enabled: isOpen,
  });

  // Auto-detect and auto-select product if header contains product name in bulk restock
  useEffect(() => {
    if (mode === "bulk" && bulkActionType === "restock" && bulkText) {
      const lines = bulkText.split("\n").map(l => l.trim());
      const headerLine = lines.find(l => l.includes("📦") || l.toLowerCase().includes("remaining stock"));
      if (headerLine) {
        let parsedName = headerLine
          .replace(/📦/g, "")
          .replace(/remaining stock/gi, "")
          .replace(/[:\-：]/g, "")
          .trim();
        if (parsedName) {
          const matchedProd = products.find(p => p.name.toLowerCase() === parsedName.toLowerCase());
          if (matchedProd) {
            setBulkSelectedProductId(matchedProd.id);
            if (matchedProd.costPrice && !newProductCostPrice) {
              setNewProductCostPrice(matchedProd.costPrice.toString());
            }
            if (matchedProd.basePrice && !newProductSellingPrice) {
              setNewProductSellingPrice(matchedProd.basePrice.toString());
            }
          }
        }
      }
    }
  }, [bulkText, mode, bulkActionType, products]);

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

  // Bulk Qty Count
  const bulkQtyCount = useMemo(() => {
    if (mode !== "bulk" || !bulkText.trim()) return 0;
    const lines = bulkText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    let qtyCount = 0;
    for (const line of lines) {
      try {
        if (line.includes("📦") || line.toLowerCase().includes("remaining stock") || line.toLowerCase().includes("pieces left")) {
          continue;
        }
        if (line.toLowerCase().startsWith("total:") || line.toLowerCase().startsWith("total ")) {
          continue;
        }
        const cleanLine = line.replace(/^[•\-\*\s]+/, "").trim();
        const digitIdx = cleanLine.search(/\d/);
        if (digitIdx === -1) continue;
        let rest = cleanLine.substring(digitIdx).split("(")[0].trim();
        const segments = rest.split(",").map(s => s.trim()).filter(s => s.length > 0);
        for (const segment of segments) {
          const qtyMatch = segment.match(/\d+/);
          if (qtyMatch) {
            qtyCount += Number(qtyMatch[0]);
          }
        }
      } catch (err) {}
    }
    return qtyCount;
  }, [mode, bulkText]);

  // Compute calculated amounts dynamically
  let computedAmount = "";
  if (mode === "restock" && selectedProduct && selectedVariantId && restockQty) {
    const cost = Number(selectedProduct.costPrice || 0);
    computedAmount = (cost * Number(restockQty)).toFixed(2);
  } else if (mode === "new" && newProductCostPrice && newProductQty) {
    computedAmount = (Number(newProductCostPrice) * Number(newProductQty)).toFixed(2);
  } else if (mode === "bulk" && newProductCostPrice && bulkQtyCount) {
    computedAmount = (Number(newProductCostPrice) * bulkQtyCount).toFixed(2);
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
          reinvestmentType: entryType === "inflow" ? "capital" : "simple",
          entryType: entryType
        });
      }
      else if (mode === "restock") {
        if (!selectedProductId || !selectedVariantId || !restockQty || !date) {
          toast.error("Please select a product, variant, and quantity");
          setIsLoading(false);
          return;
        }

        const variantObj = selectedProduct?.variants?.find(v => v.vId === selectedVariantId);
        const sizeUpper = (variantObj?.size || "").trim().toUpperCase();
        if (sizeUpper === "M" || sizeUpper === "MED" || sizeUpper === "MEDIUM") {
          toast.error("Medium (M) sizes are strictly forbidden under the Cartly Hub policy.");
          setIsLoading(false);
          return;
        }
        if (sizeUpper === "L" || sizeUpper === "LARGE") {
          const proceed = confirm("Large (L) sizes must be kept to a strict minimum under the Cartly Hub policy. Do you have explicit authorization to proceed with restocking Large sizes?");
          if (!proceed) {
            setIsLoading(false);
            return;
          }
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

        const sizeUpper = (newProductSize || "").trim().toUpperCase();
        if (sizeUpper === "M" || sizeUpper === "MED" || sizeUpper === "MEDIUM") {
          toast.error("Medium (M) sizes are strictly forbidden under the Cartly Hub policy.");
          setIsLoading(false);
          return;
        }
        if (sizeUpper === "L" || sizeUpper === "LARGE") {
          const proceed = confirm("Large (L) sizes must be kept to a strict minimum under the Cartly Hub policy. Do you have explicit authorization to proceed with restocking Large sizes?");
          if (!proceed) {
            setIsLoading(false);
            return;
          }
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
      else if (mode === "bulk") {
        if (bulkActionType === "restock" && !bulkSelectedProductId) {
          toast.error("Please select a product to restock.");
          setIsLoading(false);
          return;
        }
        if (bulkActionType === "new" && !newProductName.trim()) {
          toast.error("Please enter a Product Name first.");
          setIsLoading(false);
          return;
        }
        if (!newProductCostPrice || !bulkText.trim() || !date) {
          toast.error("Please fill in all required fields.");
          setIsLoading(false);
          return;
        }

        const cost = Number(newProductCostPrice);
        const price = Number(newProductSellingPrice || 0);

        const lines = bulkText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        const parsedVariants = [];
        let totalQty = 0;

        for (const line of lines) {
          try {
            if (line.includes("📦") || line.toLowerCase().includes("remaining stock") || line.toLowerCase().includes("pieces left")) {
              continue;
            }
            if (line.toLowerCase().startsWith("total:") || line.toLowerCase().startsWith("total ")) {
              continue;
            }

            const cleanLine = line.replace(/^[•\-\*\s]+/, "").trim();
            const digitIdx = cleanLine.search(/\d/);
            if (digitIdx === -1) continue;

            let color = cleanLine.substring(0, digitIdx).trim().replace(/[:\-：]/g, "").trim();
            if (!color) color = "Standard";

            let rest = cleanLine.substring(digitIdx).split("(")[0].trim();
            const segments = rest.split(",").map(s => s.trim()).filter(s => s.length > 0);

            for (const segment of segments) {
              const qtyMatch = segment.match(/\d+/);
              if (qtyMatch) {
                const qty = Number(qtyMatch[0]);
                let size = segment.replace(qtyMatch[0], "").trim();
                if (!size) size = "Standard";

                if (qty > 0) {
                  parsedVariants.push({ color, size, qty });
                  totalQty += qty;
                }
              }
            }
          } catch (err) {
            console.error("Error parsing bulk line:", line, err);
          }
        }

        if (parsedVariants.length === 0) {
          toast.error("Could not parse any variants.");
          setIsLoading(false);
          return;
        }

        const sizeCheck = validateInventorySizes(parsedVariants);
        if (sizeCheck.hasMedium) {
          toast.error("Medium (M) sizes are strictly forbidden under the Cartly Hub policy.");
          setIsLoading(false);
          return;
        }
        if (sizeCheck.hasLarge && !sizeCheck.isWeightedXlXxl) {
          const proceed = confirm(`Large (L) sizes are set to ${sizeCheck.largeQty} units, but XL & XXL are only ${sizeCheck.xlXxlQty} units. Under Cartly Hub policies, Large (L) sizes must be kept to a strict minimum and stock focus must be heavily weighted toward XL & XXL. Do you have explicit permission to proceed with this sizing ratio?`);
          if (!proceed) {
            setIsLoading(false);
            return;
          }
        }

        if (bulkActionType === "restock") {
          const productRef = doc(db, "products", bulkSelectedProductId);
          const productSnap = await getDoc(productRef);
          if (!productSnap.exists()) {
            throw new Error("Selected product not found in database");
          }

          const productData = productSnap.data();
          const existingVariants = productData.variants || [];
          const updatedVariants = [...existingVariants];

          const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

          for (const parsed of parsedVariants) {
            const matchIndex = updatedVariants.findIndex(v => 
              (v.size || "Standard").toLowerCase() === parsed.size.toLowerCase() &&
              (v.color || "Standard").toLowerCase() === parsed.color.toLowerCase()
            );

            if (matchIndex > -1) {
              updatedVariants[matchIndex] = {
                ...updatedVariants[matchIndex],
                stock: (Number(updatedVariants[matchIndex].stock) || 0) + parsed.qty
              };
            } else {
              const newVId = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
              const cleanSize = parsed.size.toUpperCase().replace(/[^A-Z0-9]/g, "") || "STD";
              updatedVariants.push({
                vId: newVId,
                size: parsed.size,
                color: parsed.color,
                stock: parsed.qty,
                price: price || productData.basePrice || 0,
                sku: `${slug.toUpperCase()}-${cleanSize}-${updatedVariants.length}`,
                hexColor: ""
              });
            }
          }

          const updates = {
            variants: updatedVariants,
            updatedAt: Timestamp.now()
          };

          if (cost > 0) {
            updates.costPrice = cost;
          }
          if (price > 0) {
            updates.basePrice = price;
          }

          await updateDoc(productRef, updates);

          const totalCost = cost * totalQty;
          const desc = `Bulk restocked inventory for: ${productData.name} (${totalQty} items, Cost: GH¢${cost.toFixed(2)} each)`;
          await addDoc(collection(db, "reinvestments"), {
            description: desc,
            amount: totalCost,
            date: Timestamp.fromDate(new Date(date)),
            createdAt: Timestamp.now(),
            type: "reinvestment",
            reinvestmentType: "restock",
            linkedProductId: bulkSelectedProductId,
            linkedQty: totalQty
          });

          toast.success(`Successfully bulk restocked ${productData.name} with ${totalQty} items!`);
        } else {
          const name = newProductName.trim();
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");

          const variants = parsedVariants.map((parsed, index) => {
            const cleanSize = parsed.size.toUpperCase().replace(/[^A-Z0-9]/g, "") || "STD";
            return {
              vId: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
              size: parsed.size,
              color: parsed.color,
              stock: parsed.qty,
              price: price,
              sku: `${slug.toUpperCase()}-${cleanSize}-${index}`,
              hexColor: ""
            };
          });

          const productPayload = {
            name: name,
            slug: slug,
            description: `Inventory stock added for ${name}`,
            categoryId: newProductCategoryId || "uncategorized",
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
            isPrivate: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            variants: variants
          };

          const productDocRef = await addDoc(collection(db, "products"), productPayload);

          const totalCost = cost * totalQty;
          const desc = `Purchased inventory for new product: ${name} (${totalQty} items, Cost: GH¢${cost.toFixed(2)} each)`;
          await addDoc(collection(db, "reinvestments"), {
            description: desc,
            amount: totalCost,
            date: Timestamp.fromDate(new Date(date)),
            createdAt: Timestamp.now(),
            type: "reinvestment",
            reinvestmentType: "new_product",
            linkedProductId: productDocRef.id,
            linkedQty: totalQty
          });

          toast.success(`Successfully parsed and added ${name} with ${totalQty} items!`);
        }
        setBulkText("");
      }

      toast.success("Reinvestment and inventory updated successfully");;
      
      // Invalidate React Queries
      queryClient.invalidateQueries(["reinvestments"]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["admin", "products"]);
      queryClient.invalidateQueries(["admin-financials"]);

      // Reset Form fields
      setDescription("");
      setAmount("");
      setEntryType("outflow");
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
            onClick={() => setMode("bulk")}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              mode === "bulk" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-black"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>Bulk</span>
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
                  Transaction Type
                </label>
                <select
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all outline-none"
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                >
                  <option value="outflow">Inventory/Stock Purchase (Outflow)</option>
                  <option value="inflow">Capital Injection / Initial Investment (Inflow)</option>
                </select>
              </div>

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

          {/* Bulk mode form */}
          {mode === "bulk" && (
            <div className="space-y-6">
              <div className="flex bg-gray-100 p-1 rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => {
                    setBulkActionType("new");
                    setBulkSelectedProductId("");
                    setNewProductName("");
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    bulkActionType === "new" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-black"
                  }`}
                >
                  Create New Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkActionType("restock");
                    setNewProductName("");
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    bulkActionType === "restock" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-black"
                  }`}
                >
                  Restock Existing
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bulkActionType === "new" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pleated Linen Shirt"
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                        Category (Optional)
                      </label>
                      <select
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all outline-none"
                        value={newProductCategoryId}
                        onChange={(e) => setNewProductCategoryId(e.target.value)}
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.filter(c => !c.parentId).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                      Select Product to Restock *
                    </label>
                    <select
                      required
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all outline-none"
                      value={bulkSelectedProductId}
                      onChange={(e) => {
                        setBulkSelectedProductId(e.target.value);
                        const matched = products.find(p => p.id === e.target.value);
                        if (matched) {
                          if (matched.costPrice) setNewProductCostPrice(matched.costPrice.toString());
                          if (matched.basePrice) setNewProductSellingPrice(matched.basePrice.toString());
                        }
                      }}
                    >
                      <option value="">-- Choose Product --</option>
                      {products
                        .filter(p => p.isPrivate === true || p.supplier === "Bulk Import")
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Supplier: {p.supplier || 'N/A'})</option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Unit Cost Price *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      step="any"
                      placeholder="0.00"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                      value={newProductCostPrice}
                      onChange={(e) => setNewProductCostPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Selling Price (Optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                      value={newProductSellingPrice}
                      onChange={(e) => setNewProductSellingPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Paste Variant Counts here *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="e.g. Black: 5 Large, 3 XL"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all resize-none font-mono"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Calculated Cost
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

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading || (mode === "bulk" && bulkActionType === "restock" && !bulkSelectedProductId) || (mode === "bulk" && bulkActionType === "new" && !newProductName.trim())}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center space-x-2 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                <span>
                  {mode === "restock" ? "Reinvest & Restock Stock" : mode === "new" ? "Reinvest & Create Product" : mode === "bulk" ? (bulkActionType === "restock" ? "Bulk Reinvest & Restock" : "Bulk Reinvest & Create") : "Confirm Reinvestment"}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
