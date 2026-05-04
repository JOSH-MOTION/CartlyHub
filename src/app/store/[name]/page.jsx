"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import {
  Search,
  ChevronDown,
  Store,
  MapPin,
  ArrowLeft,
  Package,
  Star,
  MessageCircle,
  User,
} from "lucide-react";
import { getProducts, getCategories, getSellerReviews, incrementStoreViews } from "@/utils/firebaseData";
import Link from "next/link";

export default function StoreFrontPage({ params }) {
  const sellerName = decodeURIComponent(params.name);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    incrementStoreViews(sellerName);
  }, [sellerName]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "seller", sellerName, category, search],
    queryFn: async () => {
      let allProducts = await getProducts(category ? { category } : {});

      // Filter by seller
      let sellerProducts = allProducts.filter(p => (p.sellerName || "cartly Hub Admin") === sellerName);

      // Simple client-side filtering for search
      if (search) {
        sellerProducts = sellerProducts.filter(product =>
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.description.toLowerCase().includes(search.toLowerCase())
        );
      }

      return sellerProducts;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return await getCategories();
    },
  });

  const { data: sellerReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", "seller", sellerName],
    queryFn: () => getSellerReviews(sellerName),
  });

  const sellerLocation = products?.[0]?.region || "Ghana";

  const averageRating = sellerReviews.length > 0
    ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
    : 5.0;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Breadcrumb / Back */}
        <Link
          href="/"
          className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="h-3 w-3 mr-2" />
          Back to Marketplace
        </Link>

        {/* Store Header */}
        <div className="bg-gray-50 rounded-[2.5rem] p-10 md:p-16 mb-12 border border-gray-100 relative overflow-hidden">
          {/* Abstract Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-black rounded-2xl">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                  Verified Store
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                {sellerName}
              </h1>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <MapPin className="h-4 w-4 mr-2 text-emerald-500" />
                  {sellerLocation}
                </div>
                <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <Package className="h-4 w-4 mr-2 text-blue-500" />
                  {products?.length || 0} Listed Items
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm min-w-[200px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Store Rating</span>
              <div className="text-3xl font-black">{averageRating.toFixed(1)}</div>
              <div className="flex mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= averageRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <Link href={`/opinions/${products?.[0]?.sellerId || ""}`} className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest hover:text-emerald-600 transition-colors">
                ({sellerReviews.length} Reviews)
              </Link>
            </div>
          </div>
        </div>

        {/* Search & Categories */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12 items-center justify-between pb-8 border-b border-gray-100">
          <div className="w-full lg:max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search in ${sellerName}'s store...`}
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
                <option value="">All Seller's Categories</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product Grid */}
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
                <ProductCard key={product.id} product={product} categories={categories || []} />
              ))}
            </div>
            {products?.length === 0 && (
              <div className="text-center py-24">
                <h3 className="text-2xl font-black uppercase tracking-widest text-gray-400">
                  No products found in this store
                </h3>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                  }}
                  className="mt-6 text-black font-black uppercase tracking-widest underline decoration-2 underline-offset-4"
                >
                  View all items from {sellerName}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-20 pt-12 border-t border-gray-100">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2 block">
                  Customer Feedback
                </span>
                <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                  Reviews for {sellerName}
                </h2>
                <p className="text-gray-600 mt-2">
                  What customers are saying about this store
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black">{averageRating.toFixed(1)}</div>
                <div className="flex mt-1 justify-center">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s <= averageRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <Link href={`/opinions/${products?.[0]?.sellerId || ""}`} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-emerald-600">
                  {sellerReviews.length} Reviews
                </Link>
              </div>
            </div>
          </div>

          {reviewsLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 w-1/3 rounded"></div>
                      <div className="h-3 bg-gray-200 w-1/2 rounded"></div>
                      <div className="h-3 bg-gray-200 w-full rounded"></div>
                      <div className="h-3 bg-gray-200 w-3/4 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sellerReviews.length > 0 ? (
            <div className="space-y-6">
              {sellerReviews.map((review, index) => (
                <div key={review.id || index} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-black text-sm uppercase tracking-widest">
                            {review.name || "Anonymous Customer"}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                              {review.rating}/5
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {review.createdAt?.toDate ? 
                              new Date(review.createdAt.toDate()).toLocaleDateString('en-GH', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              }) : 'Recently'
                            }
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mt-3">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-gray-400 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Be the first to leave a review for {sellerName}. Purchase a product and share your experience!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
