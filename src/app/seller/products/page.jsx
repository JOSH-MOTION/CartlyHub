"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  Loader2,
  Package,
  ChevronRight,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { getSellerProducts, deleteProduct } from "@/utils/firebaseData";
import { useApp } from "@/context/AppContext";

export default function SellerProductsPage() {
  const router = useRouter();
  const { sellerProfile } = useApp();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["seller", "products", sellerProfile?.uid],
    queryFn: () => getSellerProducts(sellerProfile?.uid),
    enabled: !!sellerProfile?.uid,
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["seller", "products", sellerProfile?.uid]);
      toast.success("Product deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete product");
    }
  });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 max-w-6xl">
      <header className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Inventory
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            My Products
          </h1>
        </div>
        <button
          onClick={() => router.push("/seller/products/add")}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center space-x-3"
        >
          <Plus className="h-5 w-5" />
          <span>Add Product</span>
        </button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border border-gray-100 outline-none font-bold text-sm focus:border-black transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-6 py-4 bg-white border border-gray-100 rounded-2xl flex items-center space-x-3 text-sm font-bold text-gray-500 hover:text-black transition-all">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-50">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Product</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Price</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-14 w-14 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={p.images?.[0]} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">{p.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.categoryId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.isActive !== false ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                      {p.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-sm">₵{Number(p.basePrice).toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6 text-right space-x-2">
                    <button 
                      onClick={() => router.push(`/seller/products/edit/${p.id}`)}
                      className="p-3 hover:bg-black hover:text-white rounded-xl transition-all text-gray-400"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this product?")) {
                          deleteProductMutation.mutate(p.id);
                        }
                      }}
                      className="p-3 hover:bg-red-500 hover:text-white rounded-xl transition-all text-gray-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-20 text-center space-y-6">
            <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight">No products found</h3>
              <p className="text-gray-400 font-medium text-sm">Start selling by adding your first product.</p>
            </div>
            <button
              onClick={() => router.push("/seller/products/add")}
              className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.05] transition-all shadow-xl shadow-black/10"
            >
              Add Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
