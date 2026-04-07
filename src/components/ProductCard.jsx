"use client";

import { ShoppingCart, Heart, ArrowRight } from "lucide-react";
import { useApp } from '../context/AppContext';
import { toast } from "sonner";

export default function ProductCard({ product, categories = [] }) {
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const defaultVariant = product.variants?.[0];
  const price = defaultVariant?.price || product.basePrice;

  // Get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!defaultVariant) {
      toast.error("Product has no available variants");
      return;
    }
    addToCart(product.id, defaultVariant.id, 1);
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product.id);
    const isInWishlist = wishlist.includes(product.id);
    toast.success(isInWishlist ? `${product.name} removed from wishlist` : `${product.name} added to wishlist`);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <a
        href={`/product/${product.id}`}
        className="block relative overflow-hidden aspect-[4/5]"
      >
        <img
          src={
            product.images?.[0] ||
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
          }
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 right-4 space-y-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
          <button 
            onClick={handleToggleWishlist}
            className={`p-2 rounded-full shadow-lg transition-colors ${
              wishlist.includes(product.id) 
                ? 'bg-red-500 text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-900'
            }`}
          >
            <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
          </button>
        </div>
        {product.isFeatured && (
          <div className="absolute top-4 left-4 bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            Featured
          </div>
        )}
      </a>

      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-2">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {getCategoryName(product.categoryId)}
          </p>
          <a href={`/product/${product.id}`} className="block">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </a>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between">
          <p className="text-xl font-black text-gray-900 tracking-tight">
            {process.env.NEXT_PUBLIC_STORE_CURRENCY || '₵'}{Number(price).toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-3 rounded-xl transition-all duration-300 ${
                wishlist.includes(product.id) 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 hover:bg-red-500 hover:text-white'
              }`}
            >
              <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleAddToCart}
              className="p-3 bg-gray-100 rounded-xl hover:bg-black hover:text-white transition-all duration-300"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
