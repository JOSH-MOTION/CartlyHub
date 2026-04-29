"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  X,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Store,
  ChevronLeft,
  CheckCircle2,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { getCategories, updateProduct, getProductById } from "@/utils/firebaseData";
import { useApp } from "@/context/AppContext";
import { PRODUCT_SIZES, GHANA_REGIONS } from "@/utils/constants";
import ColorPicker from "@/components/ColorPicker";
import CustomSelect from "@/components/CustomSelect";

export default function SellerEditProductPage({ params }) {
  const router = useRouter();
  const { sellerProfile } = useApp();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const productId = params.id;

  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    costPrice: "",
    basePrice: "",
    isFeatured: false,
    hasVariants: false,
    totalStock: 0,
    images: [],
    variants: [{ vId: Date.now().toString(), size: "", color: "", stock: 0, price: "", sku: "", hexColor: "" }],
    region: "",
    location: "",
    sellerId: sellerProfile?.uid,
    sellerName: sellerProfile?.storeName,
    sellerPhone: sellerProfile?.contactPhone,
    sellerEmail: sellerProfile?.contactEmail,
  });

  const { data: productData, isLoading: isProductLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId),
    enabled: !!productId,
  });

  useEffect(() => {
    if (productData) {
      // Determine if it has meaningful variants
      const hasMeaningfulVariants = productData.variants?.some(v => v.size || v.color || v.colorName || v.hexColor) || false;
      const totalStock = productData.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;

      setForm({
        name: productData.name || "",
        description: productData.description || "",
        categoryId: productData.categoryId || "",
        subcategoryId: productData.subcategoryId || "",
        costPrice: productData.costPrice || "",
        basePrice: productData.basePrice || "",
        isFeatured: productData.isFeatured || false,
        hasVariants: hasMeaningfulVariants,
        totalStock: totalStock,
        images: productData.images || [],
        variants: productData.variants?.map((v, idx) => ({
          vId: v.vId || (Date.now() + idx).toString(),
          size: v.size || "",
          color: v.colorName || v.color || "",
          stock: v.stock || 0,
          price: v.price || "",
          sku: v.sku || "",
          hexColor: v.hexColor || ""
        })) || [{ vId: Date.now().toString(), size: "", color: "", stock: 0, price: "", sku: "", hexColor: "" }],
        region: productData.region || "",
        location: productData.location || "",
        sellerId: productData.sellerId,
        sellerName: productData.sellerName,
        sellerPhone: productData.sellerPhone,
        sellerEmail: productData.sellerEmail,
      });
    }
  }, [productData]);


  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const mainCategories = categories?.filter(c => !c.parentId) || [];
  const getSubCategories = (parentId) => categories?.filter(c => c.parentId === parentId) || [];

  const updateProductMutation = useMutation({
    mutationFn: (data) => updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["seller", "products", sellerProfile?.uid]);
      queryClient.invalidateQueries(["product", productId]);
      toast.success("Product updated successfully");
      router.push("/seller/products");
    },
    onError: () => {
      toast.error("Failed to update product");
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

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        uploadedUrls.push(data.secure_url);
      }
      setForm({ ...form, images: [...form.images, ...uploadedUrls] });
      toast.success(`${uploadedUrls.length} image(s) uploaded!`);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    if (!form.name || !form.categoryId || !form.basePrice || form.images.length === 0) {
      toast.error("Please fill in all required fields (Name, Category, Selling Price, Images)");
      return false;
    }
    return true;
  };

  const submitProduct = () => {
    if (!validate()) return;
    
    // Construct payload
    let payload = { ...form };
    
    // If no variants, override the variants array with a single default variant
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
    
    updateProductMutation.mutate(payload);
  };

  if (isProductLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-5xl">
      <header className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="h-10 w-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-1 block">
              Inventory Management
            </span>
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              Edit Product
            </h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight pb-3 border-b border-gray-50 flex items-center space-x-2">
              <Info className="h-5 w-5 text-gray-300" />
              <span>Basic Information</span>
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Name *</label>
                <input
                  className="w-full px-5 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="E.g. Vintage Leather Jacket"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category *</label>
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
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                <textarea
                  className="w-full px-5 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none font-bold resize-none h-24 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your product in detail..."
                />
              </div>
            </div>
          </section>

          {/* Media */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight pb-3 border-b border-gray-50">Product Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {form.images.map((img, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-2xl relative group overflow-hidden border border-gray-200">
                  <img src={img} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
              ))}
              <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-black" /> : <ImageIcon className="h-8 w-8 text-gray-300" />}
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">Upload</span>
                <input type="file" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </section>

          {/* Simple Inventory vs Variants Toggle */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-1">
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

            {!form.hasVariants && (
               <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-5 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                  value={form.totalStock}
                  onChange={(e) => setForm({ ...form, totalStock: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            )}
          </section>

          {/* Variants */}
          {form.hasVariants && (
            <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <h2 className="text-xl font-black uppercase tracking-tight">Variants</h2>
              <button
                onClick={() => setForm({ ...form, variants: [...form.variants, { vId: Date.now().toString(), size: "", color: "", stock: 0, price: "", sku: "", hexColor: "" }] })}
                className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-gray-50 rounded-xl hover:bg-black hover:text-white transition-all"
              >
                Add Variant
              </button>
            </div>
            <div className="space-y-4">
              {form.variants.map((v, i) => (
                <div key={v.vId} className="bg-gray-50 p-6 rounded-2xl space-y-4 relative border border-gray-100">
                  <button onClick={() => setForm({ ...form, variants: form.variants.filter((_, idx) => idx !== i) })} className="absolute right-4 top-4 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <CustomSelect
                      value={v.size}
                      onChange={(value) => setForm({ ...form, variants: form.variants.map((varItem, idx) => idx === i ? { ...varItem, size: value } : varItem) })}
                      options={PRODUCT_SIZES.map(size => ({ value: size, label: size }))}
                      placeholder="Size"
                      className="!py-3 !rounded-xl !bg-white"
                    />
                    <input
                      placeholder="Stock"
                      type="number"
                      className="bg-white px-4 py-3 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-black"
                      value={v.stock}
                      onChange={(e) => setForm({ ...form, variants: form.variants.map((varItem, idx) => idx === i ? { ...varItem, stock: Number(e.target.value) } : varItem) })}
                    />
                    <input
                      placeholder="Price"
                      type="number"
                      className="bg-white px-4 py-3 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-black"
                      value={v.price}
                      onChange={(e) => setForm({ ...form, variants: form.variants.map((varItem, idx) => idx === i ? { ...varItem, price: Number(e.target.value) } : varItem) })}
                    />
                    <div className="flex items-center space-x-2">
                       <ColorPicker value={v.hexColor} onChange={(hex) => setForm({ ...form, variants: form.variants.map((varItem, idx) => idx === i ? { ...varItem, hexColor: hex } : varItem) })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          )}
        </div>

        {/* Sidebar / Quick Actions */}
        <div className="space-y-4">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Publish Details</h3>
            
             <div className="space-y-4">
               <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Wholesale / Cost Price (Optional)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>

               <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Selling Price (GHS) *</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none font-black text-lg"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              {(form.basePrice && form.costPrice) ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Estimated Profit</span>
                  <span className="font-black text-emerald-600">GHS {Number(form.basePrice - form.costPrice).toLocaleString()}</span>
                </div>
              ) : null}

            </div>

            <button
              onClick={submitProduct}
              disabled={updateProductMutation.isLoading}
              className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-black/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {updateProductMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Update Product</span><CheckCircle2 className="h-4 w-4" /></>}
            </button>
          </section>

          <section className="bg-gray-900 p-8 rounded-[2.5rem] shadow-sm text-white space-y-4">
             <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
             </div>
             <h3 className="text-sm font-black uppercase tracking-widest">Store Attribution</h3>
             <p className="text-xs text-gray-400 font-medium leading-relaxed">
               This product will be listed under <span className="text-white font-bold">{sellerProfile?.storeName}</span>.
             </p>
          </section>
        </div>
      </div>
    </div>
  );
}
