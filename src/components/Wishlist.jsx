import React from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from './ProductCard';
import { ArrowLeft, Heart, ShoppingBag, Sparkles } from 'lucide-react';

const Wishlist = ({ navigate, addToCart }) => {
  const { products, wishlist, isLoading } = useApp();

  const isSyncing = wishlist.length > 0 && products.length === 0;
  const wishlistProducts = products.filter(product => wishlist.includes(product.id));

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Hero Header */}
      <div className="pt-32 pb-16 px-6 max-w-7xl mx-auto border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/products')}
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-all"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Collections</span>
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-6xl md:text-8xl font-black text-black tracking-tighter uppercase leading-none">
                Wishlist
              </h1>
              <div className="h-4 w-4 rounded-full bg-red-500 animate-pulse mt-4" />
            </div>
            <p className="text-sm font-medium text-gray-500 max-w-md leading-relaxed uppercase tracking-widest opacity-80">
              {wishlist.length === 0 
                ? "Your selection is currently empty. Curate your dream collection." 
                : `Currently curating ${wishlist.length} premium piece${wishlist.length === 1 ? '' : 's'} in your personal vault.` 
              }
            </p>
          </div>
          
          {wishlist.length > 0 && (
            <div className="hidden lg:block">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center gap-8">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Items</p>
                  <p className="text-2xl font-black text-black">{wishlist.length}</p>
                </div>
                <div className="h-8 w-[1px] bg-gray-200" />
                <button 
                  onClick={() => navigate('/products')}
                  className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all transform hover:-translate-y-1"
                >
                  Shop More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-16 px-6">
        {/* Wishlist Items */}
        {isSyncing ? (
           <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 animate-pulse">
             <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing your vault...</p>
           </div>
        ) : wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full blur-3xl opacity-30 animate-pulse" />
              <div className="relative p-12 bg-gray-50 rounded-[3rem] border border-gray-100">
                <Heart size={80} strokeWidth={1} className="text-gray-200" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-black uppercase tracking-tight">Your Vault is Empty</h2>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Discover our latest masterpieces</p>
            </div>
            <button 
              onClick={() => navigate('/products')}
              className="flex items-center gap-3 bg-black text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition-all transform hover:-translate-y-1 shadow-2xl shadow-black/10"
            >
              <ShoppingBag size={16} />
              <span>Enter Store</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {wishlistProducts.map(product => (
              <div key={product.id} className="relative group">
                <ProductCard 
                  product={product} 
                  addToCart={addToCart}
                />
              </div>
            ))}
            
            {/* Add More Inspiration Card */}
            <button 
              onClick={() => navigate('/products')}
              className="group aspect-[4/5] bg-gray-50 rounded-[1.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-8 hover:border-black hover:bg-white transition-all duration-500"
            >
              <div className="p-5 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <Sparkles size={24} className="text-gray-300 group-hover:text-black transition-colors" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black">Keep Adding</p>
            </button>
          </div>
        )}
      </div>

      {/* Footer Decoration */}
      <div className="max-w-7xl mx-auto px-6 pb-24 opacity-20">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </div>
    </div>
  );
};

export default Wishlist;
