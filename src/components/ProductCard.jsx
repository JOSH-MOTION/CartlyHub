"use client";

import { ShoppingCart, Heart, Star, MapPin, Store, MessageCircle } from "lucide-react";
import useCart from '../store/useCart';
import { useApp } from '../context/AppContext';
import { toast } from "sonner";

export default function ProductCard({ product, categories = [] }) {
  const { addItem } = useCart();
  const { toggleWishlist, wishlist } = useApp();
  const firstInStockVariant = product.variants?.find(v => v.stock > 0) || product.variants?.[0];
  const price = firstInStockVariant?.price || product.basePrice;
  const isOutOfStock = !product.isService && (product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? product.stock ?? 0) <= 0;
  const totalStock = product.isService ? 999 : (product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? product.stock ?? 0);

  // Get category name (searching through all levels)
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Uncategorized';
    
    for (const main of categories) {
      if (main.id === categoryId) return main.name;
      for (const sub of main.subcategories || []) {
        if (sub.id === categoryId) return sub.name;
        for (const leaf of sub.subcategories || []) {
          if (leaf.id === categoryId) return leaf.name;
        }
      }
    }
    return 'Uncategorized';
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!firstInStockVariant) {
      toast.error("Product has no available variants");
      return;
    }
    if (totalStock <= 0) {
      toast.error("Product is completely out of stock");
      return;
    }
    addItem(product, firstInStockVariant, 1);
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product.id);
    const isInWishlist = wishlist.includes(product.id);
    toast.success(isInWishlist ? `${product.name} removed from wishlist` : `${product.name} added to wishlist`);
  };

  const isInWishlist = wishlist.includes(product.id);

  return (
    <div className="group bg-white rounded-2xl sm:rounded-[1.5rem] overflow-hidden border border-gray-100 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 flex flex-col h-full relative">
      
      {/* Image Container with Floating Actions */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
        <a href={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={
              product.images?.[0] ||
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
            }
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out" />
        </a>
        
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 flex flex-col gap-1 sm:gap-2">
          {product.isFeatured && (
            <span className="bg-white/80 backdrop-blur-md text-gray-900 border border-white/20 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.05)] mb-1 sm:mb-2">
              Featured
            </span>
          )}
          {product.isRental && (
            <span className="bg-orange-500/90 backdrop-blur-md text-white border border-orange-500/20 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-[0_4px_10px_rgba(249,115,22,0.2)] mb-1 sm:mb-2 inline-block">
              Rental
            </span>
          )}
          {product.isBulk && product.packSize > 1 && (
            <span className="bg-emerald-500/90 backdrop-blur-md text-white border border-emerald-500/20 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-[0_4px_10px_rgba(16,185,129,0.2)]">
              Pack of {product.packSize}
            </span>
          )}
          {!product.isService && totalStock <= 5 && totalStock > 1 && (product.isBulk || (product.variants && product.variants.length > 1)) && (
            <span className="bg-red-500/90 backdrop-blur-md text-white border border-red-500/20 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-[0_4px_10px_rgba(239,68,68,0.2)]">
              Low Stock
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out">
          <button 
            onClick={handleToggleWishlist}
            className={`p-2 sm:p-3 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.06)] backdrop-blur-md border border-white/40 transition-all duration-300 hover:scale-110 active:scale-95 ${
              isInWishlist 
                ? 'bg-red-500 text-white border-transparent' 
                : 'bg-white/70 text-gray-900 hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow relative bg-white z-10">
        <div className="absolute top-0 left-4 right-4 sm:left-8 sm:right-8 h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out"></div>

        {/* Category & Title */}
        <div className="mb-2 sm:mb-3">
          <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em] mb-1 sm:mb-2 group-hover:text-black transition-colors duration-300 line-clamp-1">
            {getCategoryName(product.categoryId)}
          </p>
          <a href={`/product/${product.id}`} className="block group/link">
            <h3 className="text-sm sm:text-lg font-black text-gray-900 line-clamp-2 leading-[1.3] tracking-tight group-hover/link:text-emerald-600 transition-colors duration-300">
              {product.name}
            </h3>
          </a>
        </div>

        {/* Location & Seller */}
        <div className="flex flex-col gap-1 sm:gap-2 mb-2 sm:mb-4">
          {(product.region || product.location) && (
            <div className="flex items-center text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-emerald-500" />
              <span className="truncate">
                {product.region}{product.location ? `, ${product.location}` : ''}
              </span>
            </div>
          )}
          {product.sellerName && (
            <a 
              href={`/seller/${encodeURIComponent(product.sellerName)}`}
              className="flex items-center text-[8px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-black transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Store className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
              <span className="truncate">{product.sellerName}</span>
            </a>
          )}
        </div>

        {/* Rating Section */}
        <div className="flex items-center mb-2 sm:mb-4">
          <div className="flex gap-0.5 text-yellow-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                className={`h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 ${s <= (product.averageRating || 0) ? 'fill-current' : 'text-gray-200'}`} 
              />
            ))}
          </div>
          <span className="ml-1 sm:ml-2 text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            ({product.reviewCount || 0})
          </span>
        </div>

        <div className="flex-grow"></div>

        {/* Price and Action Section */}
        <div className="pt-3 sm:pt-5 border-t border-gray-50 flex items-center justify-between group-hover:border-transparent transition-colors duration-300">
          <div className="flex flex-col">
            {isOutOfStock && <span className="text-[8px] sm:text-[9px] font-black text-red-500 uppercase tracking-widest mb-0.5 sm:mb-1">Sold Out</span>}
            <div className="flex items-baseline gap-1">
              <span className={`text-xs sm:text-base font-bold ${isOutOfStock ? 'text-gray-400' : 'text-gray-900'}`}>
                {process.env.NEXT_PUBLIC_STORE_CURRENCY || '₵'}
              </span>
              <p className={`text-lg sm:text-2xl font-black tracking-tighter ${isOutOfStock ? 'text-gray-400' : 'text-gray-900'}`}>
                {Number(price).toLocaleString()}
              </p>
            </div>
          </div>
          
          {(product.isRental || product.isService || !!product.sellerId) ? (
            <button
              onClick={() => window.location.href = `/product/${product.id}`}
              className="flex items-center justify-center p-2 sm:p-3.5 rounded-lg sm:rounded-xl transition-all duration-300 border bg-white text-gray-900 border-gray-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-[0_8px_25px_rgba(249,115,22,0.25)] active:scale-95"
            >
              <MessageCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </button>
          ) : (
            <button
              onClick={!isOutOfStock ? handleAddToCart : undefined}
              disabled={isOutOfStock}
              className={`flex items-center justify-center p-2 sm:p-3.5 rounded-lg sm:rounded-xl transition-all duration-300 border ${
                isOutOfStock 
                  ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                  : 'bg-white text-gray-900 border-gray-200 hover:bg-black hover:text-white hover:border-black hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] active:scale-95'
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
