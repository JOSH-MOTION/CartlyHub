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
  X as CloseIcon,
} from "lucide-react";
import { getProducts, getCategories } from "@/utils/firebaseData";
import { shuffleArray } from "@/utils/helpers";
import FilterSidebar from "@/components/FilterSidebar";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return await getCategories();
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", category, search, sortBy],
    queryFn: async () => {
      // Determine what categories to filter by
      let categoryFilter = category;
      if (category && category !== "all") {
        // If it's a parent category, we should include all its children
        const children = categories.filter(c => c.parentId === category).map(c => c.id);
        if (children.length > 0) {
          categoryFilter = [category, ...children];
        }
      }

      let products = await getProducts(categoryFilter && categoryFilter !== "all" ? { category: categoryFilter } : {});
      
      // Filter by region if set
      if (selectedRegion !== "all") {
        products = products.filter(p => p.region === selectedRegion);
      }

      // Simple client-side filtering for search
      if (search) {
        products = products.filter(product => 
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Simple client-side sorting / shuffling
      if (sortBy === "latest") {
        // If searching or filtering by category, we keep the chronological order
        // Otherwise, shuffle to scatter sellers as requested
        if (!search && (!category || category === "all") && selectedRegion === "all") {
          products = shuffleArray(products);
        } else {
          products = products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      } else if (sortBy === "price-low") {
        products = products.sort((a, b) => a.basePrice - b.basePrice);
      } else if (sortBy === "price-high") {
        products = products.sort((a, b) => b.basePrice - a.basePrice);
      }
      
      return products;
    },
    enabled: !!categories, // Wait for categories to be able to do hierarchical filtering
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

          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center justify-center space-x-2 bg-black text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all shadow-xl shadow-black/10 group"
            >
              <SlidersHorizontal className="h-4 w-4 transform group-hover:rotate-180 transition-transform duration-500" />
              <span>Filter Categories</span>
            </button>

            <div className="relative group flex-grow lg:flex-grow-0 min-w-[140px]">
              <select
                className="appearance-none w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer pr-10 transition-all"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">Sort: Latest</option>
                <option value="price-low">Price: Low-High</option>
                <option value="price-high">Price: High-Low</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(category || selectedRegion !== "all") && (
          <div className="flex flex-wrap items-center gap-2 mb-12 animate-in fade-in slide-in-from-left-4 duration-500">
            {category && category !== "" && category !== "all" && (
              <button 
                onClick={() => setCategory("")}
                className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-colors"
              >
                <span>Category: {categories.find(c => c.id === category)?.name || category}</span>
                <CloseIcon className="h-3 w-3" />
              </button>
            )}
            
            {selectedRegion !== "all" && (
              <button 
                onClick={() => setSelectedRegion("all")}
                className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <span>Region: {selectedRegion}</span>
                <CloseIcon className="h-3 w-3" />
              </button>
            )}

            <button 
              onClick={() => { setCategory(""); setSelectedRegion("all"); }}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 underline decoration-2 underline-offset-4 ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
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

      <FilterSidebar 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        selectedCategory={category === "" ? "all" : category}
        setSelectedCategory={(val) => setCategory(val === "all" ? "" : val)}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
      />
    </div>
  );
}
