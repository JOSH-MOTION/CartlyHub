"use client";

import Navbar from "@/components/Navbar";
import useCart from "@/store/useCart";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotal } = useCart();
  const total = getTotal();

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4 block">
            Your Selection
          </span>
          <h1 className="text-5xl font-black tracking-tighter uppercase">
            Shopping Bag
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-8 bg-gray-50 rounded-full mb-8">
              <ShoppingBag className="h-16 w-16 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-gray-400 mb-4">
              Your bag is empty
            </h2>
            <p className="text-gray-500 font-medium mb-8 max-w-md text-center">
              Looks like you haven't added anything to your bag yet. Start
              shopping to fill it up!
            </p>
            <a
              href="/products"
              className="inline-flex items-center bg-black text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all transform hover:-translate-y-1"
            >
              Explore Products
              <ArrowRight className="ml-3 h-5 w-5" />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Items */}
            <div className="lg:col-span-8 space-y-8">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.variant.id}`}
                  className="bg-white border border-gray-100 rounded-3xl p-8 flex space-x-6 hover:shadow-lg transition-all"
                >
                  <div className="h-32 w-28 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                    <img
                      src={
                        item.product.images?.[0] ||
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                      }
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight mb-2">
                          {item.product.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                          {item.variant.size && (
                            <span>Size: {item.variant.size}</span>
                          )}
                          {item.variant.color && (
                            <span>Color: {item.variant.color}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          removeItem(item.product.id, item.variant.id)
                        }
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.variant.id,
                              item.quantity - 1,
                            )
                          }
                          className="hover:text-black text-gray-400"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-black w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.variant.id,
                              item.quantity + 1,
                            )
                          }
                          className="hover:text-black text-gray-400"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-2xl font-black">
                        ₵
                        {Number(
                          (item.variant.price || item.product.basePrice) *
                            item.quantity,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-4">
              <div className="bg-black text-white p-10 rounded-3xl sticky top-32 shadow-2xl">
                <h2 className="text-xl font-black uppercase tracking-widest mb-8 pb-6 border-b border-white/10">
                  Order Summary
                </h2>
                <div className="space-y-6 mb-10">
                  <div className="flex justify-between text-gray-300 font-bold uppercase tracking-widest text-xs">
                    <span>Subtotal</span>
                    <span>₵{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-300 font-bold uppercase tracking-widest text-xs">
                    <span>Items</span>
                    <span>
                      {items.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300 font-bold uppercase tracking-widest text-xs">
                    <span>Delivery</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="pt-6 border-t border-white/10 flex justify-between text-white font-black uppercase tracking-widest text-lg">
                    <span>Total</span>
                    <span>₵{total.toLocaleString()}</span>
                  </div>
                </div>
                <a
                  href="/checkout"
                  className="flex items-center justify-center w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all transform hover:-translate-y-1"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-3 h-5 w-5" />
                </a>
                <a
                  href="/products"
                  className="block text-center mt-6 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                >
                  Continue Shopping
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
