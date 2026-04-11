"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import useUpload from "@/utils/useUpload";
import { toast } from "sonner";
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from "@/utils/firebaseData";
import ColorPicker from "@/components/ColorPicker";

export default function AdminProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    basePrice: "",
    costPrice: "",
    isFeatured: false,
    isBulk: false,
    packSize: 1,
    images: [],
    variants: [{ size: "", color: "", stock: 0, price: "", sku: "", hexColor: "" }],
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      return await getProducts();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return await getCategories();
    },
  });

  // Create category mapping for display
  const getCategoryName = (categoryId) => {
    const category = categories?.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

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
        basePrice: "",
        costPrice: "",
        isFeatured: false,
        images: [],
        variants: [{ size: "", color: "", stock: 0, price: "", sku: "", hexColor: "" }],
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
        ...form.variants,
        { size: "", color: "", stock: 0, price: "", sku: "" },
      ],
    });
  };

  const updateVariant = (index, field, value) => {
    setForm((prev) => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const removeVariant = (index) => {
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) });
  };

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
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Category *
                </label>
                <select
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold appearance-none"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                >
                  <option value="">Select Category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
              Product Images
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

          {/* Variants Section */}
          <section className="space-y-6">
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
              {form.variants.map((v, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-600">
                      Variant {i + 1}
                    </h3>
                    <button
                      onClick={() => removeVariant(i)}
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
                      <input
                        placeholder="e.g., M, L, XL"
                        className="w-full bg-white px-4 py-2 rounded-xl outline-none font-bold"
                        value={v.size}
                        onChange={(e) => updateVariant(i, "size", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full bg-white px-4 py-2 rounded-xl outline-none font-bold"
                        value={v.stock}
                        onChange={(e) =>
                          updateVariant(i, "stock", Number(e.target.value))
                        }
                      />
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
                          updateVariant(i, "price", Number(e.target.value))
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
                          updateVariant(i, "sku", e.target.value)
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
                        onChange={(e) => updateVariant(i, "color", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Color HEX
                      </label>
                      <ColorPicker
                        value={v.hexColor}
                        onChange={(hexColor) => updateVariant(i, "hexColor", hexColor)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </section>

          {/* Submit Button */}
          <button
            onClick={() => {
              if (editingId) {
                if (!validateProduct(form)) {
                  return;
                }
                updateProductMutation.mutate({ id: editingId, data: form });
              } else {
                if (!validateProduct(form)) {
                  return;
                }
                createProductMutation.mutate(form);
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
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products?.map((p) => {
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
                        <div className="h-12 w-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={p.images?.[0]}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            #{p.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-gray-500 uppercase tracking-widest">
                      {getCategoryName(p.categoryId)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${totalStock > 10 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                        >
                          {totalStock} in stock
                        </div>
                        {p.variants && p.variants.length > 0 && (
                          <div className="flex items-center gap-1">
                            {p.variants.slice(0, 3).map((variant, idx) => (
                              (variant.color || variant.colorName || variant.hexColor) && (
                                <div
                                  key={idx}
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{
                                    backgroundColor: variant.hexColor || variant.color || variant.colorName?.toLowerCase() || '#ccc'
                                  }}
                                  title={variant.colorName || variant.color || 'Unknown color'}
                                />
                              )
                            ))}
                            {p.variants.length > 3 && (
                              <span className="text-xs text-gray-500">+{p.variants.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-sm">
                      ₵{Number(p.basePrice).toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingId(p.id);
                          setForm({
                            name: p.name,
                            description: p.description,
                            categoryId: p.categoryId,
                            basePrice: p.basePrice,
                            costPrice: p.costPrice || "",
                            isFeatured: p.isFeatured,
                            isBulk: p.isBulk || false,
                            packSize: p.packSize || 1,
                            images: p.images || [],
                            variants: p.variants?.map(v => ({
                              size: v.size || "",
                              color: v.colorName || v.color || "",
                              stock: v.stock || 0,
                              price: v.price || "",
                              sku: v.sku || "",
                              hexColor: v.hexColor || ""
                            })) || [{ size: "", color: "", stock: 0, price: "", sku: "", hexColor: "" }],
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
      )}

      {productsLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
