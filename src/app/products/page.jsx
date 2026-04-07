"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Grid3X3,
  List,
} from "lucide-react";
import { getProducts, getCategories } from "@/utils/firebaseData";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", category, search, sortBy],
    queryFn: async () => {
      let products = await getProducts(category ? { category } : {});
      
      // Simple client-side filtering for search
      if (search) {
        products = products.filter(product => 
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Simple client-side sorting
      if (sortBy === "latest") {
        products = products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === "price-low") {
        products = products.sort((a, b) => a.basePrice - b.basePrice);
      } else if (sortBy === "price-high") {
        products = products.sort((a, b) => b.basePrice - a.basePrice);
      }
      
      return products;
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
    return category ? category.name : 'Uncategorized';
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4 block">
            Archive
          </span>
          <h1 className="text-6xl font-black tracking-tighter uppercase">
            The Collection
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12 items-center justify-between pb-8 border-b border-gray-100">
          <div className="w-full lg:max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none transition-all font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-4 w-full lg:w-auto">
            <div className="relative group flex-grow lg:flex-grow-0">
              <select
                className="appearance-none w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-xs outline-none cursor-pointer pr-12 transition-all"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>

            <div className="relative group flex-grow lg:flex-grow-0">
              <select
                className="appearance-none w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-xs outline-none cursor-pointer pr-12 transition-all"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">Latest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="bg-gray-200 aspect-[4/5] rounded-2xl"></div>
                <div className="h-4 bg-gray-200 w-3/4 rounded"></div>
                <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} categories={categories} />
              ))}
            </div>
            {products?.length === 0 && (
              <div className="text-center py-24">
                <h3 className="text-2xl font-black uppercase tracking-widest text-gray-400">
                  No products found
                </h3>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                  }}
                  className="mt-6 text-black font-black uppercase tracking-widest underline decoration-2 underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
