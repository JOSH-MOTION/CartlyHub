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
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, getAllSellers } from "@/utils/firebaseData";
import ColorPicker from "@/components/ColorPicker";
import CustomSelect from "@/components/CustomSelect";
import { PRODUCT_SIZES, GHANA_REGIONS } from "@/utils/constants";

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

  // Calculate inventory stats
  const targetProducts = products?.filter(p => sellerIdFilter ? p.sellerId === sellerIdFilter : !p.sellerId) || [];
  const activeProducts = targetProducts.filter(p => p.isActive !== false);

  const totalStock = activeProducts.reduce((sum, p) => {
    return sum + (p.variants?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || 0);
  }, 0);

  const capitalTiedUp = activeProducts.reduce((sum, p) => {
    const cost = Number(p.costPrice || 0);
    const productStock = p.variants?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || 0;
    return sum + (cost * productStock);
  }, 0);

  const expectedSellingValue = activeProducts.reduce((sum, p) => {
    const variantsValue = p.variants?.reduce((acc, v) => {
      const price = Number(v.price || p.basePrice || 0);
      return acc + (price * (Number(v.stock) || 0));
    }, 0) || 0;
    return sum + variantsValue;
  }, 0);

  const expectedProfitMargin = expectedSellingValue - capitalTiedUp;

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
      ) : (
        <div className="space-y-6">
          {/* Inventory Health Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Items in Stock</p>
              <h3 className="text-3xl font-black text-black tracking-tighter">
                {totalStock.toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Across all variants</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Capital Tied Up (Cost Value)</p>
              <h3 className="text-3xl font-black text-black tracking-tighter">
                GH¢{capitalTiedUp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Investment in active stock</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Expected Profit Margin</p>
              <h3 className="text-3xl font-black text-green-600 tracking-tighter">
                GH¢{expectedProfitMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Expected profit if all items sell</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Product
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Category
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Inventory
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Price
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Seller
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts?.map((p) => {
                const totalStock =
                  p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) ||
                  0;
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              className="w-full h-full object-cover"
                              alt={p.name}
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5 flex-wrap">
                            <span>#{p.slug}</span>
                            {p.supplier && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-500 font-black">Supplier: {p.supplier}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-gray-500 uppercase tracking-widest">
                      {getCategoryName(p.categoryId, p.subcategoryId)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${totalStock > 10 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                        >
                          {totalStock} in stock
                        </div>
                        {p.variants && p.variants.length > 0 && (
                          <div className="mt-2 space-y-1 bg-gray-50/50 p-2 rounded-xl border border-gray-100/50 max-w-[200px]">
                            {p.variants.slice(0, 4).map((variant, idx) => (
                              <div key={idx} className="text-[9px] text-gray-500 font-bold uppercase flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span 
                                    className="w-2 h-2 rounded-full border border-gray-200 flex-shrink-0"
                                    style={{
                                      backgroundColor: variant.hexColor || variant.color || variant.colorName?.toLowerCase() || '#ccc'
                                    }}
                                  />
                                  <span className="truncate max-w-[100px]">{variant.color || 'Std'} / {variant.size || 'M'}</span>
                                </div>
                                <span className="font-black text-black">{variant.stock} left</span>
                              </div>
                            ))}
                            {p.variants.length > 4 && (
                              <div className="text-[8px] text-gray-400 font-black uppercase text-center pt-1 border-t border-gray-100">
                                +{p.variants.length - 4} more variants
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-sm">
                      ₵{Number(p.basePrice).toLocaleString()}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2">
                        <Store className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                          {p.sellerName || sellers?.find(s => s.id === p.sellerId)?.storeName || "Admin"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingId(p.id);
                          setForm({
                            name: p.name,
                            description: p.description,
                            categoryId: p.categoryId,
                            subcategoryId: p.subcategoryId || "",
                            basePrice: p.basePrice,
                            costPrice: p.costPrice || "",
                            supplier: p.supplier || "",
                            isFeatured: p.isFeatured,
                            isRental: p.isRental || false,
                            isBulk: p.isBulk || false,
                            hasVariants: p.variants ? p.variants.some(v => v.size || v.color || v.hexColor) : false,
                            totalStock: p.variants ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0,
                            packSize: p.packSize || 1,
                            images: p.images || [],
                            variants: p.variants?.map((v, idx) => ({
                              vId: v.vId || (Date.now() + idx).toString(),
                              size: v.size || "",
                              color: v.colorName || v.color || "",
                              stock: v.stock || 0,
                              price: v.price || "",
                              sku: v.sku || "",
                              hexColor: v.hexColor || ""
                            })) || [{ vId: Date.now().toString(), size: "", color: "", stock: 0, price: "", sku: "", hexColor: "" }],
                            region: p.region || "",
                            location: p.location || "",
                            sellerName: p.sellerName || "cartly Hub Admin",
                            sellerPhone: p.sellerPhone || "",
                            isService: p.isService || false,
                          });
                          setIsAdding(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm('Are you sure? This action cannot be undone.')) {
                            return;
                          }
                          deleteProductMutation.mutate(p.id);
                        }}
                        disabled={deleteProductMutation.isLoading}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {productsLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
