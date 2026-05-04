"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
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
import { getProducts } from "@/utils/firebaseData";
import { shuffleArray } from "@/utils/helpers";
import { categories } from "@/utils/categories";
import FilterSidebar from "@/components/FilterSidebar";
import HomeCategorySidebar from "@/components/HomeCategorySidebar";
import MobileCategoryCircles from "@/components/MobileCategoryCircles";
import { useApp } from "@/context/AppContext";

export default function ProductsPage() {
  const { searchQuery, setSearchQuery } = useApp();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("latest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Initialize search from URL params
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams, setSearchQuery]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", category, searchQuery, sortBy, selectedRegion, priceRange],
    queryFn: async () => {
      let products = await getProducts();
      
      // Filter by category (hierarchical)
      if (category && category !== "all" && category !== "") {
        products = products.filter(p => {
          if (p.categoryId === category) return true;
          
          const mainCat = categories.find(c => c.id === category);
          if (mainCat) {
            return mainCat.subcategories.some(sub => 
              sub.id === p.categoryId || 
              sub.subcategories?.some(leaf => leaf.id === p.categoryId)
            );
          }
          
          for (const main of categories) {
            const subCat = main.subcategories.find(s => s.id === category);
            if (subCat) {
              return subCat.subcategories?.some(leaf => leaf.id === p.categoryId);
            }
          }
          
          return false;
        });
      }
      // Filter by region if set
      if (selectedRegion !== "all") {
        products = products.filter(p => p.region === selectedRegion);
      }

      // Filter by price range if set
      if (priceRange.min || priceRange.max) {
        products = products.filter(p => {
          const firstVariant = p.variants?.[0];
          const price = firstVariant?.price || p.basePrice || 0;
          const minPrice = priceRange.min ? Number(priceRange.min) : 0;
          const maxPrice = priceRange.max ? Number(priceRange.max) : Infinity;
          return price >= minPrice && price <= maxPrice;
        });
      }

      // Search filtering
      if (searchQuery) {
        products = products.filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Sorting
      if (sortBy === "latest") {
        if (!searchQuery && (!category || category === "all") && selectedRegion === "all" && !priceRange.min && !priceRange.max) {
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
    enabled: !!categories,
  });

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
      <Navbar />

      <div className="flex-grow flex overflow-hidden">
        {/* Desktop Sidebar - Static Pillar */}
        <aside className="hidden lg:block w-72 h-full border-r border-gray-100 flex-shrink-0 bg-white">
          <HomeCategorySidebar 
            selectedCategory={category || "all"} 
            setSelectedCategory={(val) => setCategory(val === "all" ? "" : val)} 
          />
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow h-full overflow-y-auto scrollbar-hide bg-white px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-6xl mx-auto">
            {/* Mobile Category Circles */}
            <div className="lg:hidden mb-10">
              <MobileCategoryCircles 
                selectedCategory={category || "all"} 
                setSelectedCategory={(val) => setCategory(val === "all" ? "" : val)} 
              />
            </div>

            {/* Header */}
            <div className="mb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-3 block">
                Official Collection
              </span>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                {category === "" ? "Marketplace" : categories.find(c => c.id === category)?.name || category}
              </h1>
            </div>

            {/* Search & Sort Toolbar */}
            <div className="flex flex-col lg:flex-row gap-6 mb-12 items-center justify-between pb-8 border-b border-gray-100">
              <div className="w-full lg:max-w-md relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-12 pr-4 py-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none transition-all font-bold uppercase tracking-widest text-[10px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-3 w-full lg:w-auto">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="flex items-center justify-center space-x-3 bg-black text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all shadow-xl shadow-black/10 group h-[58px]"
                >
                  <SlidersHorizontal className="h-4 w-4 transform group-hover:rotate-180 transition-transform duration-500" />
                  <span>More Filters</span>
                </button>

                <div className="relative group flex-grow lg:flex-grow-0 min-w-[160px]">
                  <select
                    className="appearance-none w-full bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-2xl px-8 py-5 font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer pr-12 transition-all h-[58px]"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="latest">Sort: Latest</option>
                    <option value="price-low">Price: Low-High</option>
                    <option value="price-high">Price: High-Low</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none opacity-50" />
                </div>
              </div>
            </div>

            {/* Filter Badges */}
            {(category || selectedRegion !== "all" || priceRange.min || priceRange.max) && (
              <div className="flex flex-wrap items-center gap-2 mb-10">
                {category && category !== "" && category !== "all" && (
                  <button onClick={() => setCategory("")} className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                    <span>Category: {categories.find(c => c.id === category)?.name || category}</span>
                    <CloseIcon className="h-3 w-3" />
                  </button>
                )}
                {selectedRegion !== "all" && (
                  <button onClick={() => setSelectedRegion("all")} className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                    <span>Region: {selectedRegion}</span>
                    <CloseIcon className="h-3 w-3" />
                  </button>
                )}
                <button onClick={() => { setCategory(""); setSelectedRegion("all"); setPriceRange({ min: "", max: "" }); }} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 underline underline-offset-4 ml-2">
                  Clear All
                </button>
              </div>
            )}

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="bg-gray-100 aspect-[4/5] rounded-3xl"></div>
                    <div className="h-4 bg-gray-100 w-3/4 rounded"></div>
                    <div className="h-4 bg-gray-100 w-1/2 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {products?.map((product) => (
                    <ProductCard key={product.id} product={product} categories={categories} />
                  ))}
                </div>
                {products?.length === 0 && (
                  <div className="text-center py-32">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-gray-400">No products found</h3>
                    <button onClick={() => { setSearchQuery(""); setCategory(""); }} className="mt-6 text-black font-black uppercase tracking-widest underline underline-offset-4">Clear all filters</button>
                  </div>
                )}
              </div>
            )}
            
            {/* Footer Spacer */}
            <div className="mt-32 pb-10 text-center">
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">© 2026 CartlyHub Ghana</p>
            </div>
          </div>
        </main>
      </div>

      <FilterSidebar 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        selectedCategory={category === "" ? "all" : category}
        setSelectedCategory={(val) => setCategory(val === "all" ? "" : val)}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
      />
    </div>
  );
}
