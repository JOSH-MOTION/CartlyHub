"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Image as ImageIcon,
  Loader2,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  MapPin,
  User,
  Store,
} from "lucide-react";
import useUpload from "@/utils/useUpload";
import { toast } from "sonner";
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, getAllSellers, getOrders, getManualSales, createManualSale } from "@/utils/firebaseData";
import ColorPicker from "@/components/ColorPicker";
import CustomSelect from "@/components/CustomSelect";
import { PRODUCT_SIZES, GHANA_REGIONS } from "@/utils/constants";
import { validateInventorySizes } from "@/utils/helpers";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const sellerIdFilter = searchParams.get("sellerId");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [upload] = useUpload();
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    basePrice: "",
    costPrice: "",
    supplier: "",
    isFeatured: false,
    isRental: false,
    isBulk: false,
    packSize: 1,
    images: [],
    variants: [{ vId: Date.now().toString(), size: "", color: "", stock: 0, price: "", sku: "", hexColor: "" }],
    region: "",
    location: "",
    sellerName: "cartly Hub Admin",
    sellerPhone: "",
    isService: false,
  });


  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      return await getProducts({ includePrivate: true });
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return await getCategories();
    },
  });

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const querySnapshot = await getDocs(collection(db, 'expenses'));
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        amount: Number(doc.data().amount || 0)
      }));
    },
  });

  // Fetch reinvestments
  const { data: reinvestments = [] } = useQuery({
    queryKey: ["reinvestments"],
    queryFn: async () => {
      const querySnapshot = await getDocs(collection(db, 'reinvestments'));
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        amount: Number(doc.data().amount || 0)
      }));
    },
  });

  // Fetch consolidated transactions
  const { data: transactions = [] } = useQuery({
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
        return [];
      }
    },
  });

  const sellOneMutation = useMutation({
    mutationFn: async ({ product, variant }) => {
      const cost = Number(product.costPrice || 0);
      const price = Number(variant.price || product.basePrice || 0);
      const profit = price - cost;

      const salePayload = {
        customerName: "Quick POS Tick-to-Sell",
        customerPhone: "N/A",
        totalAmount: price,
        totalProfit: profit,
        saleType: "manual",
        items: [
          {
            productId: product.id,
            productName: product.name,
            variantId: variant.vId,
            variantInfo: {
              size: variant.size || "Standard",
              color: variant.color || "Standard",
            },
            price: price,
            quantity: 1,
            costPrice: cost,
            profit: profit,
          }
        ]
      };

      return await createManualSale(salePayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "products"]);
      queryClient.invalidateQueries(["admin-financials"]);
      queryClient.invalidateQueries(["reinvestments"]);
      queryClient.invalidateQueries(["expenses"]);
      toast.success("POS sale recorded instantly!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to record POS sale");
    }
  });

  const adjustStockMutation = useMutation({
    mutationFn: async ({ product, variant, adjustment }) => {
      const productRef = doc(db, "products", product.id);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        throw new Error("Product not found");
      }

      const productData = productSnap.data();
      const updatedVariants = productData.variants.map(v => {
        if (v.vId === variant.vId) {
          return {
            ...v,
            stock: Math.max(0, (Number(v.stock) || 0) + adjustment)
          };
        }
        return v;
      });

      await updateDoc(productRef, {
        variants: updatedVariants,
        updatedAt: Timestamp.now()
      });

      if (adjustment > 0) {
        const cost = Number(product.costPrice || 0);
        const desc = `Adjusted stock (+1): ${product.name} (Size: ${variant.size || "Standard"}, Color: ${variant.color || "Standard"})`;
        await addDoc(collection(db, "reinvestments"), {
          description: desc,
          amount: cost,
          date: Timestamp.now(),
          createdAt: Timestamp.now(),
          type: "reinvestment",
          reinvestmentType: "restock",
          linkedProductId: product.id,
          linkedVariantId: variant.vId,
          linkedQty: 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "products"]);
      queryClient.invalidateQueries(["reinvestments"]);
      queryClient.invalidateQueries(["admin-financials"]);
      toast.success("Stock count adjusted!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to adjust stock");
    }
  });

  const mainCategories = categories?.filter(c => !c.parentId) || [];
  const getSubCategories = (parentId) => categories?.filter(c => c.parentId === parentId) || [];

  // Create category mapping for display
  const getCategoryName = (categoryId, subcategoryId) => {
    const category = categories?.find(cat => cat.id === categoryId);
    const subcategory = categories?.find(cat => cat.id === subcategoryId);
    const catName = category ? category.name : categoryId;
    if (subcategory) {
      return `${catName} > ${subcategory.name}`;
    }
    return catName;
  };

  const { data: sellers } = useQuery({
    queryKey: ["admin", "sellers"],
    queryFn: getAllSellers,
  });

  const filteredProducts = products?.filter(p => {
    const matchesSearch = (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (p.slug || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeller = sellerIdFilter ? p.sellerId === sellerIdFilter : !p.sellerId;
    const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? p.isActive !== false : p.isActive === false);
    
    return matchesSearch && matchesSeller && matchesStatus;
  });

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      return await createProduct(data);
    },
    onError: () => {
      throw new Error("Failed to create product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "products"]);
      setIsAdding(false);
      toast.success("Product created successfully");
      setForm({
        name: "",
        description: "",
        categoryId: "",
        subcategoryId: "",
        basePrice: "",
        costPrice: "",
        supplier: "",
        isFeatured: false,
        isRental: false,
        hasVariants: false,
        totalStock: 0,
        images: [],
        variants: [{ vId: Date.now().toString(), size: "", color: "", stock: 0, price: "", sku: "", hexColor: "" }],
        region: "",
        location: "",
        sellerName: "cartly Hub Admin",
        sellerPhone: "",
        isService: false,
      });
    },
  });

  const validateProduct = (data) => {
    if (!data.name || data.name.trim().length < 3) {
      toast.error('Product name must be at least 3 characters');
      return false;
    }
    if (!data.categoryId) {
      toast.error('Please select a category');
      return false;
    }
    if (data.basePrice <= 0) {
      toast.error('Price must be greater than 0');
      return false;
    }

    // Cartly Hub Custom Stock Restrictions
    if (data.hasVariants && data.variants && data.variants.length > 0) {
      const { hasMedium, hasLarge, largeQty, xlXxlQty, isWeightedXlXxl } = validateInventorySizes(data.variants);

      if (hasMedium) {
        toast.error("Medium (M) sizes are strictly forbidden under the Cartly Hub policy.");
        return false;
      }

      if (hasLarge) {
        if (!isWeightedXlXxl) {
          const proceed = confirm(`Large (L) sizes are set to ${largeQty} units, but XL & XXL are only ${xlXxlQty} units. Under Cartly Hub policies, Large (L) sizes must be kept to a strict minimum and stock focus must be heavily weighted toward XL & XXL. Do you have explicit permission to proceed with this sizing ratio?`);
          if (!proceed) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await updateProduct(id, data);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "products"]);
      toast.success("Product updated successfully");
      setEditingId(null);
      setIsAdding(false);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      return await deleteProduct(id);
    },
    onError: () => {
      throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "products"]);
      toast.success("Product deleted successfully");
    },
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const hasLargeFiles = files.some(file => file.size > MAX_FILE_SIZE);

    if (hasLargeFiles) {
      toast.error("Image too large. Please upload files smaller than 2MB.");
      e.target.value = null;
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'eccomerce');

        const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dlng6dqtl'}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Upload failed');
        }

        const data = await response.json();
        uploadedUrls.push(data.secure_url);
      }

      setForm({ ...form, images: [...form.images, ...uploadedUrls] });
      toast.success(`${uploadedUrls.length} image(s) uploaded!`);

    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };
  const addVariant = () => {
    setForm({
      ...form,
      variants: [
        { vId: Date.now().toString(), size: "", color: "", stock: 0, price: "", sku: "", hexColor: "" },
        ...form.variants,
      ],
    });
  };

  const updateVariant = (vId, field, value) => {
    setForm((prev) => {
      const newVariants = prev.variants.map(v =>
        v.vId === vId ? { ...v, [field]: value } : v
      );
      return { ...prev, variants: newVariants };
    });
  };

  const removeVariant = (vId) => {
    setForm({ ...form, variants: form.variants.filter((v) => v.vId !== vId) });
  };

  // Get Company Savings from localStorage (client-side only)
  let companySavings = 0;
  if (typeof window !== "undefined") {
    companySavings = Number(localStorage.getItem("cartly-savings") || "0");
  }

  // Calculate inventory stats
  const targetProducts = products?.filter(p => sellerIdFilter ? p.sellerId === sellerIdFilter : !p.sellerId) || [];
  const activeProducts = targetProducts.filter(p => p.isActive !== false);

  const totalStock = activeProducts.reduce((sum, p) => {
    return sum + (p.variants?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || 0);
  }, 0);

  // Helper to identify capital inflows
  const chronologicalReinvestments = [...reinvestments].sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.date || a.createdAt));
    const dateB = b.date?.toDate ? b.date.toDate() : (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.date || b.createdAt));
    return dateA - dateB;
  });
  const oldestReinvestmentId = chronologicalReinvestments[0]?.id;

  const isCapitalInflow = (r) => {
    if (r.id && r.id === oldestReinvestmentId) return true;
    if (r.reinvestmentType === "capital" || r.entryType === "inflow" || r.reinvestmentType === "simple") return true;
    const desc = (r.description || "").toLowerCase();
    return desc.includes("initial") || desc.includes("capital") || desc.includes("injection") || desc.includes("starting");
  };

  const adminProductIds = new Set(targetProducts.map(p => p.id));
  
  const adminTransactions = transactions.map(tx => {
    const adminItems = tx.items?.filter(item => adminProductIds.has(item.productId)) || [];
    const totalAmount = adminItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity || 1)), 0);
    const totalProfit = adminItems.reduce((acc, item) => acc + (Number(item.profit) || 0), 0);
    return { ...tx, totalAmount, totalProfit, items: adminItems };
  }).filter(tx => tx.items.length > 0);

  const totalRevenue = adminTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const grossProfit = adminTransactions.reduce((sum, tx) => sum + tx.totalProfit, 0);
  const totalExpenses = expenses.reduce((sum, ex) => sum + (ex.amount || 0), 0);
  
  const totalCapital = reinvestments
    .filter(isCapitalInflow)
    .reduce((sum, re) => sum + re.amount, 0);

  const totalReinvested = reinvestments
    .filter(re => !isCapitalInflow(re))
    .reduce((sum, re) => sum + re.amount, 0);

  const cogs = totalRevenue - grossProfit;

  // Cartly Hub Custom Accounting Double-Pot Calculations
  const rawCostCapitalPool = totalCapital + cogs - totalReinvested;
  const costCapitalPool = Math.max(0, rawCostCapitalPool);

  const restockDeficit = Math.max(0, totalReinvested - (totalCapital + cogs));
  const savingsUsed = Math.min(restockDeficit, companySavings);
  const remainingDeficitAfterSavings = Math.max(0, restockDeficit - savingsUsed);
  const borrowedFromProfit = remainingDeficitAfterSavings;

  const pureProfitPool = grossProfit - totalExpenses - borrowedFromProfit;

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-end mb-12">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Catalog
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            Product Management
          </h1>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-3 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
        >
          {isAdding ? (
            <X className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          <span>{isAdding ? "Cancel" : "New Product"}</span>
        </button>
      </header>

      {sellerIdFilter && (
        <div className="mb-8 flex items-center justify-between bg-blue-50 border border-blue-100 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Filtering by Seller</p>
              <h3 className="text-lg font-black uppercase tracking-tighter text-blue-900">
                {sellers?.find(s => s.id === sellerIdFilter)?.storeName || "Selected Seller"}
              </h3>
            </div>
          </div>
          <button 
            onClick={() => router.push('/admin/products')}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
          >
            <X className="h-3 w-3" />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {isAdding ? (
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Basic Information Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest pb-4 border-b border-gray-200">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Product Name *
                </label>
                <input
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="E.g. Premium White Tee"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                  <span>Category *</span>
                </label>
                <CustomSelect
                  value={form.categoryId}
                  onChange={(value) => setForm({ ...form, categoryId: value, subcategoryId: "" })}
                  options={mainCategories.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Select Category"
                />
              </div>

              {form.categoryId && getSubCategories(form.categoryId).length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subcategory</label>
                  <CustomSelect
                    value={form.subcategoryId}
                    onChange={(value) => setForm({ ...form, subcategoryId: value })}
                    options={getSubCategories(form.categoryId).map(c => ({ value: c.id, label: c.name }))}
                    placeholder="Select Subcategory"
                  />
                </div>
              )}
            </div>

            {/* Marketplace & Location Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span>Region *</span>
                </label>
                <CustomSelect
                  value={form.region}
                  onChange={(value) => setForm({ ...form, region: value })}
                  options={GHANA_REGIONS.map(r => ({ value: r, label: r }))}
                  placeholder="Select Region"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Precise Location / Coordinates
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    className="w-full pl-11 pr-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="E.g. East Legon, Near Shell"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Seller Name / Store
                </label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    className="w-full pl-11 pr-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                    value={form.sellerName}
                    onChange={(e) => setForm({ ...form, sellerName: e.target.value })}
                    placeholder="E.g. cartly Hub Admin"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Seller Phone
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    className="w-full pl-11 pr-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                    value={form.sellerPhone}
                    onChange={(e) => setForm({ ...form, sellerPhone: e.target.value })}
                    placeholder="E.g. 0241234567"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Description
              </label>
              <textarea
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold resize-none"
                rows="4"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Crafted from 100% Egyptian cotton..."
              />
            </div>
          </section>

          {/* Media Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest pb-4 border-b border-gray-200">
              Product Images (Optional)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {form.images.map((img, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 rounded-2xl relative group overflow-hidden"
                >
                  <img src={img} className="w-full h-full object-cover" />
                  <button
                    onClick={() =>
                      setForm({
                        ...form,
                        images: form.images.filter((_, idx) => idx !== i),
                      })
                    }
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
              ))}
              <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-black" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-300" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">
                  Upload
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </section>

          {/* Simple Inventory vs Variants Toggle */}
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-800 mb-1">
                    Service / Booking
                  </h4>
                  <p className="text-[10px] text-emerald-700/70 font-bold uppercase">
                    Enable for services (Spa, Jobs, etc.) to hide stock requirements.
                  </p>
                </div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-6 h-6 rounded-lg bg-white/10 accent-emerald-600"
                    checked={form.isService}
                    onChange={(e) => setForm({ ...form, isService: e.target.checked })}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border-2 border-transparent">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                    Product Options
                  </h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    Does this product come in different sizes, colors, or options?
                  </p>
                </div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-6 h-6 rounded-lg bg-white/10 accent-black"
                    checked={form.hasVariants}
                    onChange={(e) => setForm({ ...form, hasVariants: e.target.checked })}
                  />
                </label>
              </div>
            </div>

            {!form.hasVariants && !form.isService && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                  value={form.totalStock}
                  onChange={(e) => setForm({ ...form, totalStock: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            )}
          </section>

          {/* Variants Section */}
          {form.hasVariants && (
            <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <h2 className="text-xl font-black uppercase tracking-widest">
                  Product Variants
                </h2>
                <button
                  onClick={addVariant}
                  className="text-xs font-black uppercase tracking-widest px-4 py-2 bg-gray-100 rounded-xl hover:bg-black hover:text-white transition-all"
                >
                  Add Variant
                </button>
              </div>
              <div className="space-y-4">
                {[...form.variants].sort((a, b) => {
                  const colorA = (a.color || "").toLowerCase();
                  const colorB = (b.color || "").toLowerCase();
                  // Keep empty color names (newly added) at the top
                  if (!colorA && colorB) return -1;
                  if (colorA && !colorB) return 1;
                  return colorA.localeCompare(colorB);
                }).map((v, i) => (
                  <div
                    key={v.vId}
                    className="bg-gray-50 rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-600">
                        Variant {v.color ? v.color : (i + 1)}
                      </h3>
                      <button
                        onClick={() => removeVariant(v.vId)}
                        className="text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Size
                        </label>
                        <CustomSelect
                          value={v.size}
                          onChange={(value) => updateVariant(v.vId, "size", value)}
                          options={PRODUCT_SIZES.map(size => ({ value: size, label: size }))}
                          placeholder="Size"
                          className="!py-2 !rounded-xl !bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Stock Quantity
                        </label>
                        {!form.isService ? (
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full bg-white px-4 py-2 rounded-xl outline-none font-bold"
                            value={v.stock}
                            onChange={(e) =>
                              updateVariant(v.vId, "stock", Number(e.target.value))
                            }
                          />
                        ) : (
                          <div className="w-full bg-white px-4 py-2 rounded-xl text-[10px] font-bold text-emerald-600 uppercase flex items-center h-[38px]">
                            Service Mode
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Price
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full bg-white px-4 py-2 rounded-xl outline-none font-bold"
                          value={v.price}
                          onChange={(e) =>
                            updateVariant(v.vId, "price", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          SKU
                        </label>
                        <input
                          placeholder="e.g., TSHIRT-RED-M"
                          className="w-full bg-white px-4 py-2 rounded-xl outline-none font-bold"
                          value={v.sku}
                          onChange={(e) =>
                            updateVariant(v.vId, "sku", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Color Name
                        </label>
                        <input
                          placeholder="e.g., Navy Blue"
                          className="w-full bg-white px-4 py-2 rounded-xl outline-none font-bold"
                          value={v.colorName || v.color || ""}
                          onChange={(e) => updateVariant(v.vId, "color", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Color HEX
                        </label>
                        <ColorPicker
                          value={v.hexColor}
                          onChange={(hexColor) => updateVariant(v.vId, "hexColor", hexColor)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bulk & Pack Settings Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest pb-4 border-b border-gray-200">
              Bulk & Pack Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border-2 border-transparent">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                    Is this a Bulk/Pack Item?
                  </h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Enable if selling items as a set (e.g. 3-pack)</p>
                </div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-6 h-6 rounded-lg bg-white/10 accent-black"
                    checked={form.isBulk}
                    onChange={(e) =>
                      setForm({ ...form, isBulk: e.target.checked })
                    }
                  />
                </label>
              </div>

              {form.isBulk && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Items Per Pack (Pack Size)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                    value={form.packSize}
                    onChange={(e) =>
                      setForm({ ...form, packSize: Number(e.target.value) })
                    }
                    placeholder="E.g. 3"
                  />
                  <p className="text-[10px] text-gray-400 font-bold uppercase italic">Customers will be asked to select colors for each item.</p>
                </div>
              )}
            </div>
          </section>

          {/* Pricing Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest pb-4 border-b border-gray-200">
              Pricing & Featured
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Cost Price (Buying Price)
                </label>
                <input
                  type="number"
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm({ ...form, costPrice: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Base Selling Price
                </label>
                <input
                  type="number"
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm({ ...form, basePrice: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Supplier
                </label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                  value={form.supplier || ""}
                  onChange={(e) =>
                    setForm({ ...form, supplier: e.target.value })
                  }
                  placeholder="e.g. Nestlé Ghana"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-6 bg-black text-white rounded-2xl">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                  Estimated Profit
                </h4>
                <p className="text-2xl font-black">
                  GH¢{Number(form.basePrice - form.costPrice).toLocaleString()}
                </p>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Featured Product
                </span>
                <input
                  type="checkbox"
                  className="w-6 h-6 rounded-lg bg-white/10 accent-white"
                  checked={form.isFeatured}
                  onChange={(e) =>
                    setForm({ ...form, isFeatured: e.target.checked })
                  }
                />
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                  Rental Item
                </span>
                <input
                  type="checkbox"
                  className="w-6 h-6 rounded-lg bg-white/10 accent-orange-500"
                  checked={form.isRental}
                  onChange={(e) =>
                    setForm({ ...form, isRental: e.target.checked })
                  }
                />
              </label>
            </div>
          </section>

          {/* Submit Button */}
          <button
            onClick={() => {
              if (!validateProduct(form)) {
                return;
              }

              let payload = { ...form };
              if (!form.hasVariants) {
                payload.variants = [{
                  vId: Date.now().toString(),
                  size: "",
                  color: "",
                  colorName: "",
                  stock: Number(form.totalStock) || 0,
                  price: Number(form.basePrice) || 0,
                  sku: "",
                  hexColor: ""
                }];
              }

              if (editingId) {
                updateProductMutation.mutate({ id: editingId, data: payload });
              } else {
                createProductMutation.mutate(payload);
              }
            }}
            disabled={
              createProductMutation.isLoading ||
              updateProductMutation.isLoading ||
              !form.name ||
              !form.categoryId
            }
className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:bg-gray-800 transition-all shadow-2xl shadow-black/20 disabled:opacity-50"
          >
            {(createProductMutation.isLoading || updateProductMutation.isLoading) ? "Saving..." : editingId ? "Update Product" : "Create Product"}
          </button>
        </div>
      ) : (        <div className="space-y-6">
          {/* Inventory Health Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cost Capital Pool</p>
              <h3 className="text-3xl font-black text-indigo-600 tracking-tighter">
                GH¢{costCapitalPool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Locked restocking funds</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Pure Profit Pool</p>
              <h3 className="text-3xl font-black text-green-600 tracking-tighter">
                GH¢{pureProfitPool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Safe accumulated profits</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Items Left</p>
              <h3 className="text-3xl font-black text-black tracking-tighter">
                {totalStock.toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Across all product variants</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-11 pr-4 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-gray-400 hidden sm:inline" />
              <select
                className="appearance-none bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-black outline-none w-full sm:w-40"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>
          </div>

          {/* Interactive POS Grid */}
          <div className="space-y-6">
            {filteredProducts?.length === 0 ? (
              <div className="bg-white p-16 text-center text-gray-400 font-bold uppercase border border-gray-100 rounded-3xl">
                No products found
              </div>
            ) : (
              filteredProducts?.map((product) => {
                return (
                  <div key={product.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Product Header */}
                    <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-white border border-gray-100 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} className="w-full h-full object-cover" alt={product.name} />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-base uppercase tracking-tight text-gray-900">{product.name}</h4>
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${product.isActive !== false ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {product.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5 flex-wrap">
                            <span>#{product.slug}</span>
                            <span className="text-gray-300">•</span>
                            <span>Category: {getCategoryName(product.categoryId, product.subcategoryId)}</span>
                            {product.supplier && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span>Supplier: {product.supplier}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* Product details & Actions */}
                      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 w-full md:w-auto justify-end">
                        <div className="text-left xs:text-right">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Pricing Parameters</p>
                          <p className="text-xs font-bold text-gray-600">
                            Cost: <span className="text-black font-black">GH₵{Number(product.costPrice || 0).toFixed(2)}</span>
                            <span className="mx-2 text-gray-300">|</span>
                            Retail: <span className="text-emerald-600 font-black">GH₵{Number(product.basePrice || 0).toFixed(2)}</span>
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingId(product.id);
                              setForm({
                                name: product.name,
                                description: product.description,
                                categoryId: product.categoryId,
                                subcategoryId: product.subcategoryId || "",
                                basePrice: product.basePrice,
                                costPrice: product.costPrice || "",
                                supplier: product.supplier || "",
                                isFeatured: product.isFeatured,
                                isRental: product.isRental || false,
                                isBulk: product.isBulk || false,
                                hasVariants: product.variants ? product.variants.some(v => v.size || v.color || v.hexColor) : false,
                                totalStock: product.variants ? product.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0,
                                packSize: product.packSize || 1,
                                images: product.images || [],
                                variants: product.variants?.map((v, idx) => ({
                                  vId: v.vId || (Date.now() + idx).toString(),
                                  size: v.size || "",
                                  color: v.colorName || v.color || "",
                                  stock: v.stock || 0,
                                  price: v.price || "",
                                  sku: v.sku || "",
                                  hexColor: v.hexColor || ""
                                })) || [{ vId: Date.now().toString(), size: "", color: "", stock: 0, price: "", sku: "", hexColor: "" }],
                                region: product.region || "",
                                location: product.location || "",
                                sellerName: product.sellerName || "cartly Hub Admin",
                                sellerPhone: product.sellerPhone || "",
                                isService: product.isService || false,
                              });
                              setIsAdding(true);
                            }}
                            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 text-gray-500 hover:text-black shadow-sm"
                            title="Edit Product Settings"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm('Delete this product permanently? This action cannot be undone.')) return;
                              deleteProductMutation.mutate(product.id);
                            }}
                            disabled={deleteProductMutation.isLoading}
                            className="p-2.5 hover:bg-red-50 rounded-xl transition-all border border-gray-200 text-red-500 hover:text-red-600 shadow-sm disabled:opacity-50"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Variants list (Tick-to-Sell Grid) */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50/30 border-b border-gray-100">
                          <tr>
                            <th className="px-8 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400">Color</th>
                            <th className="px-8 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400">Size</th>
                            <th className="px-8 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400">Stock Qty</th>
                            <th className="px-8 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Stock Control</th>
                            <th className="px-8 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">POS Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {product.variants?.map((variant) => {
                            const stock = Number(variant.stock) || 0;
                            const isOutOfStock = stock <= 0;
                            const isSellingThis = sellOneMutation.isLoading && sellOneMutation.variables?.variant.vId === variant.vId;
                            const isAdjustingThis = adjustStockMutation.isLoading && adjustStockMutation.variables?.variant.vId === variant.vId;
                            
                            return (
                              <tr key={variant.vId} className="hover:bg-gray-50/30 transition-colors">
                                <td className="px-8 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <span 
                                      className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                                      style={{ backgroundColor: variant.hexColor || variant.color || variant.colorName?.toLowerCase() || '#ccc' }}
                                    />
                                    <span className="text-xs font-bold text-gray-900">{variant.color || "Standard"}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-4 whitespace-nowrap">
                                  <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-black rounded uppercase">
                                    {variant.size || "Standard"}
                                  </span>
                                </td>
                                <td className="px-8 py-4 whitespace-nowrap">
                                  <span className={`text-xs font-black px-2 py-0.5 rounded ${isOutOfStock ? 'bg-red-50 text-red-600' : 'bg-gray-900'}`}>
                                    {stock} left
                                  </span>
                                </td>
                                <td className="px-8 py-4 whitespace-nowrap text-center">
                                  <div className="inline-flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => adjustStockMutation.mutate({ product, variant, adjustment: -1 })}
                                      disabled={isOutOfStock || isAdjustingThis}
                                      className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center font-black text-gray-600 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Adjust Stock Down (-1)"
                                    >
                                      -
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => adjustStockMutation.mutate({ product, variant, adjustment: 1 })}
                                      disabled={isAdjustingThis}
                                      className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center font-black text-gray-600 hover:text-black transition-all disabled:opacity-50"
                                      title="Adjust Stock Up (+1, Logs Reinvestment)"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="px-8 py-4 whitespace-nowrap text-right">
                                  <button
                                    type="button"
                                    onClick={() => sellOneMutation.mutate({ product, variant })}
                                    disabled={isOutOfStock || isSellingThis}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm ${
                                      isOutOfStock 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-black text-white hover:bg-gray-800 hover:scale-[1.02] shadow-black/10'
                                    }`}
                                  >
                                    {isSellingThis ? (
                                      <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                                    ) : (
                                      "Sell 1"
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>  </div>
      )}

      {productsLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
