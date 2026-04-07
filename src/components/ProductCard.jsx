"use client";

import { ShoppingCart, Heart, Star } from "lucide-react";
import useCart from '../store/useCart';
import { useApp } from '../context/AppContext';
import { toast } from "sonner";

export default function ProductCard({ product, categories = [] }) {
  const { addItem } = useCart();
  const { toggleWishlist, wishlist } = useApp();
  const defaultVariant = product.variants?.[0];
  const price = defaultVariant?.price || product.basePrice;
  const stock = defaultVariant?.stock || product.stock || 0;

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
    if (stock <= 0) {
      toast.error("Product is out of stock");
      return;
    }
    addItem(product, defaultVariant, 1);
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
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
      <a
        href={`/product/${product.id}`}
        className="block relative overflow-hidden aspect-[4/5] bg-gray-50"
      >
        <img
          src={
            product.images?.[0] ||
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
          }
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Overlay badges */}
        <div className="absolute top-4 left-4 space-y-2">
          {product.isFeatured && (
            <div className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Featured
            </div>
          )}
        </div>

        {/* Wishlist button */}
        <button 
          onClick={handleToggleWishlist}
          className={`absolute top-4 right-4 p-2.5 rounded-full shadow-lg transition-all duration-300 ${
            isInWishlist 
              ? 'bg-red-500 text-white' 
              : 'bg-white hover:bg-gray-50 text-gray-900'
          }`}
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
      </a>

      <div className="p-5 flex flex-col flex-grow">
        {/* Category and Name */}
        <div className="mb-3">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
            {getCategoryName(product.categoryId)}
          </p>
          <a href={`/product/${product.id}`} className="block">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2 leading-tight">
              {product.name}
            </h3>
          </a>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-3 w-3 fill-current" />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-2">(4.5)</span>
        </div>

        {/* Stock Status */}
        <div className="mb-4">
          <span className={`text-xs font-medium ${
            stock > 10 ? 'text-green-600' : 
            stock > 0 ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </span>
        </div>

        {/* Price and Actions */}
        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-gray-900 tracking-tight">
              {process.env.NEXT_PUBLIC_STORE_CURRENCY || '₵'}{Number(price).toLocaleString()}
            </p>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleWishlist}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  isInWishlist 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 hover:bg-red-500 hover:text-white'
                }`}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={stock <= 0}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  stock <= 0 
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 hover:bg-black hover:text-white'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={stock <= 0}
            className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 ${
              stock <= 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg'
            }`}
          >
            {stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
