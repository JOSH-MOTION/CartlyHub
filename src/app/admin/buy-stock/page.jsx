"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, RefreshCw, DollarSign, Calendar, FileText, ArrowUpRight, Sparkles, FolderPlus, Layers, UserCheck, Loader2, ListPlus } from "lucide-react";
import { collection, addDoc, doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { getProducts, getCategories } from "@/utils/firebaseData";
import { useRouter } from "next/navigation";
import { validateInventorySizes } from "@/utils/helpers";

export default function AdminBuyStockPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState("new"); // "new", "restock", or "bulk"
  const [isLoading, setIsLoading] = useState(false);
  const [bulkText, setBulkText] = useState("");

  // Date shared state
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);

  // RESTOCK MODE STATE
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [restockQty, setRestockQty] = useState("");

  // ADD NEW PRODUCT MODE STATE
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  const [newProductCostPrice, setNewProductCostPrice] = useState("");
  const [newProductSellingPrice, setNewProductSellingPrice] = useState("");
  const [newProductSupplier, setNewProductSupplier] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  
  // List of variant combinations for new product
  const [newVariants, setNewVariants] = useState([
    { size: "Standard", color: "Standard", stock: "" }
  ]);

  const [bulkActionType, setBulkActionType] = useState("new"); // "new" or "restock"
  const [bulkSelectedProductId, setBulkSelectedProductId] = useState("");

  // Fetch admin products
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const prod = await getProducts({ includePrivate: true });
      return prod.filter(p => !p.sellerId);
    },
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
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Auto-select variant in Restock mode
  useEffect(() => {
    if (selectedProduct && selectedProduct.variants?.length > 0) {
      setSelectedVariantId(selectedProduct.variants[0].vId);
    } else {
      setSelectedVariantId("");
    }
  }, [selectedProductId, selectedProduct]);

  // Handle dynamic variant additions/deletions in New mode
  const handleAddVariantRow = () => {
    setNewVariants([...newVariants, { size: "Standard", color: "Standard", stock: "" }]);
  };

  const handleRemoveVariantRow = (idx) => {
    if (newVariants.length === 1) {
      toast.error("Products must have at least one size/color variant combination");
      return;
    }
    setNewVariants(newVariants.filter((_, i) => i !== idx));
  };

  const handleUpdateVariantRow = (idx, field, value) => {
    const updated = newVariants.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setNewVariants(updated);
  };

  // Compute calculated values
  let totalQty = 0;
  let totalReinvestmentCost = 0;

  if (mode === "restock" && selectedProduct && restockQty) {
    totalQty = Number(restockQty);
    totalReinvestmentCost = totalQty * Number(selectedProduct.costPrice || 0);
  } else if (mode === "new" && newProductCostPrice) {
    totalQty = newVariants.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
    totalReinvestmentCost = totalQty * Number(newProductCostPrice);
  }

  const bulkStats = useMemo(() => {
    if (mode !== "bulk" || !bulkText.trim()) {
      return { totalQty: 0, totalCost: 0, totalSales: 0, estimatedProfit: 0 };
    }

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
      } catch (err) {
        // ignore parse error during typing
      }
    }

    const cost = Number(newProductCostPrice || 0);
    const price = Number(newProductSellingPrice || 0);
    const totalCost = cost * qtyCount;
    const totalSales = price * qtyCount;
    const estimatedProfit = Math.max(0, totalSales - totalCost);

    return { totalQty: qtyCount, totalCost, totalSales, estimatedProfit };
  }, [mode, bulkText, newProductCostPrice, newProductSellingPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "restock") {
        if (!selectedProductId || !selectedVariantId || !restockQty || !purchaseDate) {
          toast.error("Please fill in all restocking fields");
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
        const amount = costPrice * qty;

        const productRef = doc(db, "products", selectedProductId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
          throw new Error("Product not found in database");
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

        // 1. Update Firestore stock
        await updateDoc(productRef, {
          variants: updatedVariants,
          updatedAt: Timestamp.now()
        });

        // 2. Log reinvestment
        const variantObj = productData.variants.find(v => v.vId === selectedVariantId);
        const desc = `Restocked ${qty}x ${selectedProduct.name} ${variantObj?.size ? `(Size: ${variantObj.size})` : ""} ${variantObj?.color ? `(Color: ${variantObj.color})` : ""}`;
        
        await addDoc(collection(db, "reinvestments"), {
          description: desc,
          amount: amount,
          date: Timestamp.fromDate(new Date(purchaseDate)),
          createdAt: Timestamp.now(),
          type: "reinvestment",
          reinvestmentType: "restock",
          linkedProductId: selectedProductId,
          linkedVariantId: selectedVariantId,
          linkedQty: qty
        });

        toast.success(`Successfully restocked ${qty} items!`);
      }
      else if (mode === "new") {
        if (!newProductName || !newProductCostPrice || totalQty <= 0) {
          toast.error("Please fill in all required product details and variant quantities");
          setIsLoading(false);
          return;
        }

        const sizeCheck = validateInventorySizes(newVariants);
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

        const cost = Number(newProductCostPrice);
        const price = Number(newProductSellingPrice || 0);

        const slug = newProductName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

        // 1. Build variants payload
        const variantsPayload = newVariants.map((item, idx) => ({
          vId: `${Date.now()}-${idx}`,
          size: item.size || "Standard",
          color: item.color || "Standard",
          stock: Number(item.stock) || 0,
          price: price,
          sku: `${slug.toUpperCase()}-${(item.size || 'STD').toUpperCase()}-${idx}`,
          hexColor: ""
        }));

        // 2. Create product in Firestore
        const productPayload = {
          name: newProductName,
          slug: slug,
          description: `Inventory stock added for ${newProductName}`,
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
          isPrivate: !isPublic,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          variants: variantsPayload
        };

        const productDocRef = await addDoc(collection(db, "products"), productPayload);

        // 3. Log reinvestment
        const desc = `Purchased inventory for new product: ${newProductName} (${totalQty} items, Cost: GH¢${cost.toFixed(2)} each)`;
        await addDoc(collection(db, "reinvestments"), {
          description: desc,
          amount: totalReinvestmentCost,
          date: Timestamp.fromDate(new Date(purchaseDate)),
          createdAt: Timestamp.now(),
          type: "reinvestment",
          reinvestmentType: "new_product",
          linkedProductId: productDocRef.id,
          linkedQty: totalQty
        });

        toast.success(`Successfully created ${newProductName} with ${totalQty} items!`);
      }

      // Invalidate queries to refresh dashboard and ledger charts
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["admin", "products"]);
      queryClient.invalidateQueries(["reinvestments"]);
      queryClient.invalidateQueries(["admin-financials"]);

      // Reset Form fields
      setSelectedProductId("");
      setSelectedVariantId("");
      setRestockQty("");
      setNewProductName("");
      setNewProductCategoryId("");
      setNewProductCostPrice("");
      setNewProductSellingPrice("");
      setNewProductSupplier("");
      setIsPublic(false);
      setNewVariants([{ size: "Standard", color: "Standard", stock: "" }]);

      refetchProducts();
      router.push("/admin/products");
    } catch (error) {
      console.error("Error creating stock item:", error);
      toast.error("Failed to register stock purchase");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    if (bulkActionType === "restock" && !bulkSelectedProductId) {
      toast.error("Please select a product to restock.");
      return;
    }
    if (bulkActionType === "new" && !newProductName.trim()) {
      toast.error("Please enter a Product Name first.");
      return;
    }
    if (!newProductCostPrice) {
      toast.error("Please enter the Unit Cost Price.");
      return;
    }
    if (!bulkText.trim()) {
      toast.error("Please enter the variant list.");
      return;
    }

    setIsLoading(true);
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
      toast.error("Could not parse any variants. Please make sure the format is correct (e.g., 'Black: 5 Large, 3 XL').");
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

    try {
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
          date: Timestamp.fromDate(new Date(purchaseDate)),
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
          supplier: "Bulk Import",
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
          date: Timestamp.fromDate(new Date(purchaseDate)),
          createdAt: Timestamp.now(),
          type: "reinvestment",
          reinvestmentType: "new_product",
          linkedProductId: productDocRef.id,
          linkedQty: totalQty
        });

        toast.success(`Successfully parsed and added ${name} with ${totalQty} items!`);
      }

      setBulkText("");
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["admin", "products"]);
      queryClient.invalidateQueries(["reinvestments"]);
      queryClient.invalidateQueries(["admin-financials"]);
      refetchProducts();
      router.push("/admin/products");
    } catch (err) {
      console.error("Error saving bulk stock:", err);
      toast.error("Failed to save inventory.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormLoading = productsLoading || categoriesLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <header className="flex justify-between items-end pb-6 border-b border-gray-100">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Purchasing & Supply
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Buy Stock / Restock</h1>
        </div>
      </header>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl max-w-xl">
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            mode === "new" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-black"
          }`}
        >
          <FolderPlus className="h-4 w-4" />
          <span>Add New Product</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("restock")}
          className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            mode === "restock" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-black"
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Restock Existing</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            mode === "bulk" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-black"
          }`}
        >
          <ListPlus className="h-4 w-4" />
          <span>Bulk Paste List</span>
        </button>
      </div>

      {isFormLoading ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : mode === "bulk" ? (
        <form onSubmit={handleBulkSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Paste Purchased Items</h2>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Enter or select the product details, then paste your inventory counts by color and size. If pasting from POS stock list, it will auto-detect the product.
                  </p>
                </div>
                
                {/* Bulk Action Type Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkActionType("new");
                      setBulkSelectedProductId("");
                      setNewProductName("");
                    }}
                    className={`flex-grow sm:flex-initial px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      bulkActionType === "new" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-black"
                    }`}
                  >
                    Create New
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkActionType("restock");
                      setNewProductName("");
                    }}
                    className={`flex-grow sm:flex-initial px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      bulkActionType === "restock" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-black"
                    }`}
                  >
                    Restock Existing
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bulkActionType === "new" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pleated Linen Shirt"
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Category (Optional)</label>
                      <select
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Select Product *</label>
                    <select
                      required
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Unit Cost Price *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      step="any"
                      placeholder="0.00"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                      value={newProductCostPrice}
                      onChange={(e) => setNewProductCostPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Selling Price (Optional)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                      value={newProductSellingPrice}
                      onChange={(e) => setNewProductSellingPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-700 space-y-1.5 font-medium">
                <p className="font-bold uppercase tracking-wider text-[10px] text-indigo-800">Required Format Example:</p>
                <pre className="font-mono bg-white/50 p-3 rounded-lg overflow-x-auto leading-normal">
{`Black: 5 Large, 3 XL, 2 XXL (Total: 10)
White: 1 Large, 3 XL (Total: 4)
Khaki: 1 Medium, 2 Large, 2 XL, 2 XXL (Total: 7)`}
                </pre>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Paste Variant Counts here *</label>
                <textarea
                  rows="10"
                  required
                  placeholder="Paste your items list here..."
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none font-mono"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Summary & Submit */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Checkout Summary</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Purchase Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      required
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all outline-none"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3 font-bold text-xs uppercase tracking-widest text-gray-500">
                  <div className="flex justify-between">
                    <span>Parsed Qty:</span>
                    <span className="text-black font-black">{bulkStats.totalQty} item(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span className="text-black font-black">GH¢{bulkStats.totalCost.toFixed(2)}</span>
                  </div>
                  {bulkStats.totalSales > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>Total Est. Sales:</span>
                        <span className="text-black font-black">GH¢{bulkStats.totalSales.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-gray-100 pt-3 text-green-600">
                        <span>Est. Profit:</span>
                        <span className="text-green-600 font-black text-sm">GH¢{bulkStats.estimatedProfit.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !bulkText.trim() || !newProductCostPrice || (bulkActionType === "new" ? !newProductName.trim() : !bulkSelectedProductId)}
                className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <DollarSign className="h-4 w-4" />
                    <span>Process Bulk List</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Input Form */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* New Product Fields */}
            {mode === "new" && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Basic Information</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Floral Chiffon Dress"
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Category (Optional)</label>
                      <select
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                        value={newProductCategoryId}
                        onChange={(e) => setNewProductCategoryId(e.target.value)}
                      >
                        <option value="">-- Choose Category (Optional) --</option>
                        {categories.filter(c => !c.parentId).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Cost Price (Buying Cost) *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          required
                          step="0.01"
                          placeholder="0.00"
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                          value={newProductCostPrice}
                          onChange={(e) => setNewProductCostPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Base Selling Price (Optional)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                          value={newProductSellingPrice}
                          onChange={(e) => setNewProductSellingPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Supplier / Vendor</label>
                      <input
                        type="text"
                        placeholder="e.g. Kantamanto Market"
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                        value={newProductSupplier}
                        onChange={(e) => setNewProductSupplier(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100 mt-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1">
                        List on public storefront
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        If disabled, this item is treated as a personal purchase and will not show on your shop home page or product catalog.
                      </p>
                    </div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-6 h-6 rounded-lg bg-white accent-indigo-600"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                      />
                    </label>
                  </div>
                </div>

                {/* Variants List Builder */}
                <div className="pt-6 border-t border-gray-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Sizes, Colors & Quantities</h2>
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-black hover:text-white transition-all"
                    >
                      Add Variant Combination
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newVariants.map((item, idx) => (
                      <div key={idx} className="flex items-end gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-in fade-in duration-300">
                        <div className="flex-grow grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Size</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. M"
                              className="w-full bg-white border-none rounded-xl py-2.5 px-3 font-bold text-xs focus:ring-2 focus:ring-black outline-none"
                              value={item.size}
                              onChange={(e) => handleUpdateVariantRow(idx, "size", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Color</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Blue"
                              className="w-full bg-white border-none rounded-xl py-2.5 px-3 font-bold text-xs focus:ring-2 focus:ring-black outline-none"
                              value={item.color}
                              onChange={(e) => handleUpdateVariantRow(idx, "color", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Quantity Bought</label>
                            <input
                              type="number"
                              required
                              min="1"
                              placeholder="0"
                              className="w-full bg-white border-none rounded-xl py-2.5 px-3 font-bold text-xs focus:ring-2 focus:ring-black outline-none"
                              value={item.stock}
                              onChange={(e) => handleUpdateVariantRow(idx, "stock", Number(e.target.value))}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all self-end"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Restock Product Fields */}
            {mode === "restock" && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Select Product to Restock</h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Choose Product</label>
                    <select
                      required
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Supplier: {p.supplier || 'N/A'})</option>
                      ))}
                    </select>
                  </div>

                  {selectedProduct && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Select Size/Color Variant</label>
                        <select
                          required
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                          value={selectedVariantId}
                          onChange={(e) => setSelectedVariantId(e.target.value)}
                        >
                          {selectedProduct.variants?.map(v => (
                            <option key={v.vId} value={v.vId}>
                              Size: {v.size || 'STD'} / Color: {v.color || 'STD'} (Currently: {v.stock} in stock)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Additional Quantity Purchased</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 50"
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                          value={restockQty}
                          onChange={(e) => setRestockQty(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Summary & Submit */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Checkout Summary</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Purchase Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      required
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-black transition-all outline-none"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <span>Total Quantity:</span>
                    <span className="text-black font-black">{totalQty} item(s)</span>
                  </div>
                  {mode === "new" && newProductCostPrice && (
                    <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                      <span>Unit Cost Price:</span>
                      <span className="text-black font-black">GH¢{Number(newProductCostPrice).toFixed(2)}</span>
                    </div>
                  )}
                  {mode === "restock" && selectedProduct && (
                    <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                      <span>Unit Cost Price:</span>
                      <span className="text-black font-black">GH¢{Number(selectedProduct.costPrice || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest border-t border-dashed border-gray-100 pt-3">
                    <span>Reinvestment Cost:</span>
                    <span className="text-indigo-600 font-black text-sm">GH¢{totalReinvestmentCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || (mode === "restock" && !selectedProductId)}
                className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <DollarSign className="h-4 w-4" />
                    <span>Confirm Purchase</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
