"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import useUpload from "@/utils/useUpload";
import { toast } from "sonner";
import { getProducts, getCategories, createProduct } from "@/utils/firebaseData";

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [upload] = useUpload();
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    basePrice: "",
    costPrice: "",
    isFeatured: false,
    images: [],
    variants: [{ size: "", color: "", stock: 0, price: "", sku: "" }],
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
        variants: [{ size: "", color: "", stock: 0, price: "", sku: "" }],
      });
    },
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        // useUpload can handle URL, base64 or file (depending on platform)
        // Since we are on web, we use browser file
        const { url, error } = await upload({ url: URL.createObjectURL(file) });
        if (error) throw new Error(error);
        uploadedUrls.push(url);
      }
      setForm({ ...form, images: [...form.images, ...uploadedUrls] });
      toast.success("Images uploaded");
    } catch (err) {
      toast.error("Upload failed");
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
    const newVariants = [...form.variants];
    newVariants[index][field] = value;
    setForm({ ...form, variants: newVariants });
  };

  const removeVariant = (index) => {
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Mini Sidebar Link to Dashboard */}
      <aside className="w-20 bg-black flex flex-col items-center py-8 space-y-8">
        <a href="/admin" className="p-3 bg-white/10 rounded-xl text-white">
          <Edit className="h-6 w-6" />
        </a>
      </aside>

      <main className="flex-grow p-12">
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
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-widest pb-4 border-b border-gray-100">
                General Info
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Product Name
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
                    Category
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

            <section className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-widest pb-4 border-b border-gray-100">
                Media
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

            <section className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h2 className="text-xl font-black uppercase tracking-widest">
                  Variants & Stock
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
                    className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-2xl relative group"
                  >
                    <input
                      placeholder="Size"
                      className="bg-white px-4 py-2 rounded-xl outline-none font-bold"
                      value={v.size}
                      onChange={(e) => updateVariant(i, "size", e.target.value)}
                    />
                    <input
                      placeholder="Color"
                      className="bg-white px-4 py-2 rounded-xl outline-none font-bold"
                      value={v.color}
                      onChange={(e) =>
                        updateVariant(i, "color", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      className="bg-white px-4 py-2 rounded-xl outline-none font-bold"
                      value={v.stock}
                      onChange={(e) =>
                        updateVariant(i, "stock", Number(e.target.value))
                      }
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      className="bg-white px-4 py-2 rounded-xl outline-none font-bold"
                      value={v.price}
                      onChange={(e) =>
                        updateVariant(i, "price", Number(e.target.value))
                      }
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        placeholder="SKU"
                        className="flex-grow bg-white px-4 py-2 rounded-xl outline-none font-bold"
                        value={v.sku}
                        onChange={(e) =>
                          updateVariant(i, "sku", e.target.value)
                        }
                      />
                      <button
                        onClick={() => removeVariant(i)}
                        className="text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-widest pb-4 border-b border-gray-100">
                Pricing & Profit
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Buying Price (Cost)
                  </label>
                  <input
                    type="number"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                    value={form.cost_price}
                    onChange={(e) =>
                      setForm({ ...form, costPrice: e.target.value })
                    }
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
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4 p-6 bg-black text-white rounded-2xl">
                <div className="flex-grow">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                    Estimated Profit
                  </h4>
                  <p className="text-2xl font-black">
                    ₵{Number(form.basePrice - form.costPrice).toLocaleString()}
                  </p>
                </div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Featured
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

            <button
              onClick={() => createProductMutation.mutate(form)}
              disabled={
                createProductMutation.isLoading ||
                !form.name ||
                !form.category_id
              }
              className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:bg-gray-800 transition-all shadow-2xl shadow-black/20 disabled:opacity-50"
            >
              {createProductMutation.isLoading ? "Saving..." : "Deploy Product"}
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
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${totalStock > 10 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                        >
                          {totalStock} in stock
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black text-sm">
                        ₵{Number(p.basePrice).toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-right space-x-2">
                        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors">
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
      </main>
    </div>
  );
}
