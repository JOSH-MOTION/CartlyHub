"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";
import { ArrowRight, ShoppingBag, Truck, ShieldCheck, Zap, Filter, Grid3x3, List, SlidersHorizontal, X as CloseIcon } from "lucide-react";
import { getProducts, getCategories } from "../utils/firebaseData";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const GHANA_REGIONS = [
    "Greater Accra",
    "Ashanti",
    "Central",
    "Eastern",
    "Western",
    "Northern",
    "Volta",
    "Upper East",
    "Upper West",
    "Bono",
    "Bono East",
    "Ahafo",
    "Savannah",
    "North East",
    "Oti",
    "Western North"
  ];

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        return await getCategories();
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        return [];
      }
    },
  });

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        return await getProducts();
      } catch (error) {
        console.error('Failed to fetch products:', error);
        return [];
      }
    },
  });

  // Filter products based on selected category AND region
  const filteredProducts = allProducts.filter(product => {
    const categoryMatch = selectedCategory === "all" ||
      product.categoryId === selectedCategory ||
      categories.find(cat => cat.id === product.categoryId)?.parentId === selectedCategory;

    const regionMatch = selectedRegion === "all" ||
      product.region === selectedRegion;

    return categoryMatch && regionMatch;
  });

  const displayProducts = filteredProducts.slice(0, 12); // Show more products on front page

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          {/* Background with abstract shape and geometric grid */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gray-200 rounded-full transform translate-x-1/2 -translate-y-1/2 opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gray-300 rounded-full transform -translate-x-1/3 translate-y-1/3 opacity-20"></div>
          </div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left">
              <div className="mb-6">
                <span className="inline-block px-4 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-sm">
                  Spring Collection
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-[1.1] md:leading-[0.9] mb-6">
                Premium Collection <span className="text-gray-600">2026</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
                Discover our exclusive collection with modern designs for your lifestyle
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/products"
                  className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-gray-800 transition-all transform hover:-translate-y-1"
                >
                  Shop Now
                  <ArrowRight className="ml-3 h-5 w-5" />
                </a>
                <a
                  href="/products?category=fashion"
                  className="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-900 font-bold uppercase tracking-widest text-sm rounded-lg border border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-all transform hover:-translate-y-1"
                >
                  Browse Fashion
                  <ArrowRight className="ml-3 h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Right Side - Product Showcase */}
            <div className="relative">
              <div className="relative bg-gray-50 rounded-2xl p-8 shadow-lg">
                <img
                  src="/mart.jpg"
                  alt="Store Showcase"
                  className="w-full h-80 object-cover rounded-xl mb-6 shadow-md"
                />
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-20 h-20">
                <img
                  src="https://images.unsplash.com/photo-1524863234450-c61b952b2e0?w=400&q=80"
                  alt="Accessory decoration"
                  className="w-full h-full object-cover rounded-lg opacity-80"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2 block">
                Featured Products
              </span>
              <h2 className="text-4xl font-black text-black tracking-tighter uppercase">
                {selectedCategory === "all" ? "All Products" : selectedCategory}
              </h2>
              <p className="text-gray-600 mt-2">
                Showing {displayProducts.length} of {filteredProducts.length} products
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center justify-center space-x-3 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-xl shadow-black/10 group"
              >
                <SlidersHorizontal className="h-4 w-4 transform group-hover:rotate-180 transition-transform duration-500" />
                <span>Filters</span>
              </button>

              <div className="flex items-center bg-white rounded-2xl border border-gray-200 p-1 h-[52px]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 px-3 rounded-xl transition-colors ${viewMode === "grid" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  <Grid3x3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 px-3 rounded-xl transition-colors ${viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>

              <a
                href="/products"
                className="inline-flex items-center px-8 py-4 bg-white text-black border-2 border-black font-bold uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-50 transition-all h-[52px]"
              >
                Explore All
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Active Filter Badges */}
          {(selectedCategory !== "all" || selectedRegion !== "all") && (
            <div className="flex flex-wrap items-center gap-2 mb-12 animate-in fade-in slide-in-from-left-4 duration-500">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">Filtering by:</span>

              {selectedCategory !== "all" && (
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-colors"
                >
                  <span>Category: {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}</span>
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
                onClick={() => { setSelectedCategory("all"); setSelectedRegion("all"); }}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 underline decoration-2 underline-offset-4 ml-2"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Products Grid/List */}
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[4/5] rounded-3xl"></div>
                  <div className="h-4 bg-gray-200 w-3/4 rounded mt-2"></div>
                  <div className="h-4 bg-gray-200 w-1/2 rounded mt-1"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                : "space-y-6"
            }>
              {displayProducts.map((product) => (
                <div key={product.id} className={
                  viewMode === "grid" ? "" : "bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
                }>
                  <ProductCard
                    key={product.id}
                    product={product}
                    categories={categories}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {displayProducts.length < filteredProducts.length && (
            <div className="text-center mt-16">
              <a
                href="/products"
                className="inline-flex items-center px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-2xl border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all"
              >
                Load More Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section - Moved below products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 block">
                Browse Marketplace
              </span>
              <h2 className="text-4xl font-black text-black tracking-tighter uppercase">
                Popular Categories
              </h2>
              <p className="text-gray-500 mt-2 font-medium">Explore curated strictly for your lifestyle</p>
            </div>

            <a
              href="/products"
              className="text-xs font-black uppercase tracking-widest text-gray-900 border-b-2 border-black pb-1 hover:text-emerald-600 hover:border-emerald-600 transition-all"
            >
              See all collections
            </a>
          </div>

          {/* Featured Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {categories.slice(0, 6).map((category) => (
              <a
                key={category.id}
                href={`/products?category=${category.name}`}
                className="group relative h-[300px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white border border-gray-100 transform hover:scale-[1.02]"
              >
                {/* Category Image Background */}
                {category.image ? (
                  <div className="absolute inset-0">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-500"></div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
                )}

                <div className="relative h-full p-10 flex flex-col justify-end text-white">
                  <div className="transform transition-all duration-500 group-hover:-translate-y-2">
                    <h3 className="text-2xl font-black text-white mb-2 drop-shadow-lg leading-tight uppercase tracking-tighter">
                      {category.name}
                    </h3>
                    <p className="text-white/80 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-500 max-w-xs">
                      {category.description || "Discover premium quality items in this collection"}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-yellow-400 font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 opacity-0 group-hover:opacity-100">
                    <span>Explore Now</span>
                    <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Truck, title: "Fast Delivery", desc: "Across Ghana within 24hrs" },
              { icon: ShieldCheck, title: "Secure Payment", desc: "Paystack & MoMo Protected" },
              { icon: ShoppingBag, title: "Quality Guaranteed", desc: "100% Authentic Products" },
              { icon: Zap, title: "24/7 Support", desc: "Customer Service Available" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-3 p-8">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                  <item.icon className="h-8 w-8 text-gray-900" />
                </div>
                <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 font-medium text-center max-w-xs">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-8">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-4 leading-tight">
              Join cartly Hub <br /> Inner Circle
            </h2>
            <p className="text-gray-400 mb-10 font-medium text-lg">
              Get exclusive access to new drops, special discounts, and fashion tips tailored for Ghana
            </p>
          </div>

          <form className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white transition-all"
            />
            <button className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors">
              Subscribe Now
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <a
                href="/"
                className="text-2xl font-black text-black tracking-tighter uppercase"
              >
                cartly<span className="text-gray-500">Hub</span>
              </a>
              <p className="text-gray-600 font-medium leading-relaxed mt-4">
                Premium fashion marketplace delivering quality across Ghana
              </p>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-6">Shop</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-600">
                <li>
                  <a href="/products" className="hover:text-black transition-colors">
                    All Products
                  </a>
                </li>
                <li>
                  <a href="/products?category=fashion" className="hover:text-black transition-colors">
                    Fashion
                  </a>
                </li>
                <li>
                  <a href="/products?category=shoes" className="hover:text-black transition-colors">
                    Shoes
                  </a>
                </li>
                <li>
                  <a href="/products?category=accessories" className="hover:text-black transition-colors">
                    Accessories
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-6">Account</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-600">
                <li>
                  <a href="/account/orders" className="hover:text-black transition-colors">
                    Order Tracking
                  </a>
                </li>
                <li>
                  <a href="/cart" className="hover:text-black transition-colors">
                    My Cart
                  </a>
                </li>
                <li>
                  <a href="/account/wishlist" className="hover:text-black transition-colors">
                    Wishlist
                  </a>
                </li>
                <li>
                  <a href="/account/signin" className="hover:text-black transition-colors">
                    Login
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-6">Contact</h4>
              <ul className="space-y-3 text-sm font-bold text-gray-600">
                <li>Email: support@cartlyhub.com.gh</li>
                <li>WhatsApp: +233 242 403 450</li>
                <li>Location: Accra, Ghana</li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-black uppercase tracking-widest">
              © 2026 cartly Hub. All Rights Reserved.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Delivering quality fashion across Ghana
            </p>
          </div>
        </div>
      </footer>

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
      />
    </div>
  );
}
