import React from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from './ProductCard';
import { ArrowLeft, Heart } from 'lucide-react';

const Wishlist = ({ navigate, addToCart }) => {
  const { products, wishlist } = useApp();

  const wishlistProducts = products.filter(product => wishlist.includes(product.id));

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-6">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Store</span>
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <Heart size={28} className="text-red-500" fill="currentColor" />
          <h1 className="text-3xl font-bold text-stone-900">My Wishlist</h1>
        </div>
        
        <p className="text-stone-600">
          {wishlist.length === 0 
            ? "Your wishlist is empty" 
            : `You have ${wishlist.length} item${wishlist.length === 1 ? '' : 's'} in your wishlist` 
          }
        </p>
      </div>

      {/* Wishlist Items */}
      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={64} className="mx-auto text-stone-300 mb-4" />
          <h2 className="text-xl font-semibold text-stone-700 mb-2">No items in wishlist</h2>
          <p className="text-stone-600 mb-6">Start adding items to your wishlist</p>
          <button 
            onClick={() => navigate('/products')}
            className="bg-orange-500 text-white px-6 py-3 rounded-sm hover:bg-orange-600 transition-colors font-medium"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistProducts.map(product => (
            <div key={product.id} className="group">
              <ProductCard 
                product={product} 
                addToCart={addToCart}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
