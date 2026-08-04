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
  Search,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { getSellerProducts, deleteProduct } from "@/utils/firebaseData";
import { useApp } from "@/context/AppContext";

export default function SellerProductsPage() {
  const router = useRouter();
  const { sellerProfile } = useApp();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products = [], isLoading } = useQuery({
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

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = products.filter(p => p.isActive !== false).length;
  const inactiveCount = products.filter(p => p.isActive === false).length;

  return (
    <div className="space-y-8 md:space-y-12 max-w-6xl">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Inventory
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">
            Store Catalog
          </h1>
        </div>
        <button
          onClick={() => router.push("/seller/products/add")}
          className="bg-black text-white px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Listings</p>
          <h3 className="text-2xl font-black text-gray-900 tracking-tighter">{products.length}</h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase">All uploaded products</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Active Listings</p>
          <h3 className="text-2xl font-black text-emerald-600 tracking-tighter">{activeCount}</h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase">Visible to online buyers</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Inactive Listings</p>
          <h3 className="text-2xl font-black text-red-600 tracking-tighter">{inactiveCount}</h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase">Hidden draft items</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-grow relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search catalog products..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-semibold text-xs focus:border-black transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <table className="w-full text-left hidden md:table">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Product Info</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Retail Price</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                          <img src={p.images?.[0]} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-black text-xs uppercase tracking-tight text-gray-900">{p.name}</p>
                          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">{p.category_name || "Clothing"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        p.isActive !== false ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                      }`}>
                        {p.isActive !== false ? (
                          <>
                            <CheckCircle className="h-2.5 w-2.5" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-2.5 w-2.5" />
                            <span>Inactive</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-xs text-gray-900">
                      GH₵{Number(p.basePrice || p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => router.push(`/product/${p.id}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-all"
                        title="View Public Listing"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => router.push(`/seller/products/edit/${p.id}`)}
                        className="p-2 hover:bg-black hover:text-white rounded-lg border border-transparent hover:border-gray-100 transition-all text-gray-400"
                        title="Edit Details"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this listing?")) {
                            deleteProductMutation.mutate(p.id);
                          }
                        }}
                        className="p-2 hover:bg-red-500 hover:text-white rounded-lg border border-transparent hover:border-red-100 transition-all text-gray-400"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile List Card View */}
            <div className="md:hidden divide-y divide-gray-50">
              {filteredProducts.map((p) => (
                <div key={p.id} className="p-5 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                      <img src={p.images?.[0]} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-black text-xs uppercase tracking-tight text-gray-900 truncate">{p.name}</p>
                          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{p.category_name || "Clothing"}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                          p.isActive !== false ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                        }`}>
                          {p.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="font-black text-xs mt-1.5 text-gray-900">GH₵{Number(p.basePrice || p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button 
                      onClick={() => router.push(`/product/${p.id}`)}
                      className="flex items-center justify-center space-x-1 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-gray-600 font-black uppercase tracking-widest text-[8px]"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View</span>
                    </button>
                    <button 
                      onClick={() => router.push(`/seller/products/edit/${p.id}`)}
                      className="flex items-center justify-center space-x-1 py-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all text-gray-900 font-black uppercase tracking-widest text-[8px]"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this listing?")) {
                          deleteProductMutation.mutate(p.id);
                        }
                      }}
                      className="flex items-center justify-center space-x-1 py-2.5 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all text-red-600 font-black uppercase tracking-widest text-[8px]"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-16 text-center space-y-6">
            <div className="bg-gray-50 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
              <Package className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">No matching listings</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Start uploading clothes to open storefront sales</p>
            </div>
            <button
              onClick={() => router.push("/seller/products/add")}
              className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-black/10 hover:scale-[1.02] transition-all"
            >
              Add Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
