"use client";

import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import useCart from '../store/useCart';
import { ArrowRight } from "lucide-react";

export default function CartSidebar({ isOpen, onClose }) {
  const { items, updateQuantity, removeItem, getTotal } = useCart();
  const total = getTotal();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold uppercase tracking-widest">Shopping Bag</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-6 bg-gray-50 rounded-full mb-6">
                  <ShoppingBag className="h-12 w-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Your bag is empty</h3>
                <p className="text-gray-500 mb-6">Start adding items to see them here</p>
                <button
                  onClick={onClose}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.variant.id}`} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{item.product.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        {item.variant.size && <span>Size: {item.variant.size}</span>}
                        {item.variant.color && <span>Color: {item.variant.color}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.variant.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.variant.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            ₵{Number(item.variant.price || item.product.basePrice).toLocaleString()}
                          </span>
                          <button
                            onClick={() => removeItem(item.product.id, item.variant.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 p-6 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>₵{total.toLocaleString()}</span>
              </div>
              <a
                href="/checkout"
                onClick={onClose}
                className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="h-5 w-5" />
              </a>
              <button
                onClick={onClose}
                className="w-full text-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
