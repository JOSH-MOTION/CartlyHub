"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";
import { ArrowRight, ShoppingBag, Truck, ShieldCheck, Zap, Filter, Grid3x3, List, SlidersHorizontal, Search, X as CloseIcon } from "lucide-react";
import { getProducts } from "../utils/firebaseData";
import { shuffleArray } from "../utils/helpers";
import { categories } from "../utils/categories";
import HomeCategorySidebar from "../components/HomeCategorySidebar";
import MobileCategoryCircles from "../components/MobileCategoryCircles";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import FilterSidebar from "@/components/FilterSidebar";
import Footer from "@/components/Footer";

export default function HomePage() {
  const { searchQuery, setSearchQuery } = useApp();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [viewMode, setViewMode] = useState("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const data = await getProducts();
      return data;
    },
  });

  const filteredProducts = allProducts.filter(product => {
    // Search filter
    const matchesSearch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter (hierarchical)
    let matchesCategory = true;
    if (selectedCategory !== "all") {
      matchesCategory = product.categoryId === selectedCategory;
      
      if (!matchesCategory) {
        // Check if selected is a parent
        const mainCat = categories.find(c => c.id === selectedCategory);
        if (mainCat) {
          matchesCategory = mainCat.subcategories.some(sub => 
            sub.id === product.categoryId || 
            sub.subcategories?.some(leaf => leaf.id === product.categoryId)
          );
        }
        
        // Check if selected is a subcategory
        if (!matchesCategory) {
          for (const main of categories) {
            const subCat = main.subcategories.find(s => s.id === selectedCategory);
            if (subCat) {
              matchesCategory = subCat.subcategories?.some(leaf => leaf.id === product.categoryId);
              break;
            }
          }
        }
      }
    }

    // Region filter
    const matchesRegion = selectedRegion === "all" || product.region === selectedRegion;

    // Price filter
    const firstInStockVariant = product.variants?.find(v => v.stock > 0) || product.variants?.[0];
    const price = firstInStockVariant?.price || product.basePrice || 0;
    const matchesPrice = (!priceRange.min || price >= Number(priceRange.min)) &&
                         (!priceRange.max || price <= Number(priceRange.max));

    return matchesSearch && matchesCategory && matchesRegion && matchesPrice;
  });

  const shuffledProducts = selectedCategory === "all" && selectedRegion === "all" && !priceRange.min && !priceRange.max && !searchQuery
    ? shuffleArray(filteredProducts) 
    : filteredProducts;

  const displayProducts = shuffledProducts;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
      <Navbar />

      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar - Desktop Only */}
        <aside className="hidden lg:block w-60 h-full border-r border-gray-100 flex-shrink-0 bg-white">
          <HomeCategorySidebar 
            selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory} 
          />
        </aside>

        {/* Main Content Area */}
        <div className="flex-grow h-full overflow-y-auto scrollbar-hide bg-white relative">
          
          {/* Hero Section Container */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
              </div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <div className="text-left animate-in fade-in slide-in-from-left-8 duration-700">
                  {/* <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-sm">
                      Premium Marketplace
                    </span>
                  </div> */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-[1.1] mb-6">
                    Discover Quality <span className="text-[#442efb]">Everywhere</span>
                  </h1>
                  <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed font-medium">
                    The most trusted platform for buying and selling in Ghana. Modern, secure, and fast.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                      className="inline-flex items-center justify-center px-8 py-4 bg-[#fa8929] text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-black transition-all transform hover:-translate-y-1 shadow-xl shadow-black/10"
                    >
                      Shop Now
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </button>
                    <a
                      href="/products"
                      className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-bold uppercase tracking-widest text-xs rounded-xl border-2 border-gray-100 hover:border-gray-900 hover:bg-gray-50 transition-all transform hover:-translate-y-1"
                    >
                      Browse All
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </a>
                  </div>
                </div>

                {/* Right Side - Visual */}
                <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-8 duration-1000">
                  <div className="relative bg-white rounded-3xl p-4 shadow-2xl rotate-2">
                    <img
                      src="/mart.jpg"
                      alt="Marketplace Showcase"
                      className="w-full h-[400px] object-cover rounded-2xl shadow-inner"
                    />
                    <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-50">
                       <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                             <ShieldCheck className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verified</p>
                             <p className="text-xs font-bold text-gray-900">Secure Trading</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Feed Section */}
          <div id="products" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
            {/* Mobile Category Circles */}
            <div className="lg:hidden mb-12">
              <MobileCategoryCircles 
                selectedCategory={selectedCategory} 
                setSelectedCategory={setSelectedCategory} 
              />
            </div>

            {/* Section Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-3 block">
                  Curated For You
                </span>
                <h2 className="text-4xl font-black text-black tracking-tighter uppercase leading-none">
                  {selectedCategory === "all" ? "Latest Arrivals" : categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3">
                  Showing {displayProducts?.length || 0} of {allProducts?.length || 0} products
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-grow md:min-w-[350px]">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for items..."
                    className="w-full pl-12 pr-4 py-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all text-[11px] font-bold uppercase tracking-widest"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="flex items-center justify-center space-x-3 bg-black text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all shadow-xl shadow-black/10 group"
                >
                  <SlidersHorizontal className="h-4 w-4 transform group-hover:rotate-180 transition-transform duration-500" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="bg-gray-100 aspect-[4/5] rounded-3xl"></div>
                    <div className="h-4 bg-gray-100 w-3/4 rounded"></div>
                    <div className="h-4 bg-gray-100 w-1/2 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categories={categories}
                  />
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="mt-32 pt-20 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-10">
              {[
                { icon: Truck, title: "Fast Delivery", desc: "Door-to-door nationwide" },
                { icon: ShieldCheck, title: "Verified Sellers", desc: "Safe trading environment" },
                { icon: ShoppingBag, title: "Best Prices", desc: "Deals directly from sellers" },
                { icon: Zap, title: "Instant Chat", desc: "Connect via WhatsApp" },
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all group-hover:bg-black group-hover:text-white group-hover:scale-110">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-black mb-1">{item.title}</h4>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <Footer />
          </div>
        </div>
      </div>

      <FilterSidebar 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
      />
    </div>
  );
}
