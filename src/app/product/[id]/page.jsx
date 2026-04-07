"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import {
  ShoppingCart,
  Heart,
  Truck,
  ShieldCheck,
  Check,
  Star,
  Minus,
  Plus,
  MessageCircle,
} from "lucide-react";
import useCart from "@/store/useCart";
import { toast } from "sonner";
import { getProducts } from "@/utils/firebaseData";

export default function ProductDetailPage({ params }) {
  const { id } = params;
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [paymentMade, setPaymentMade] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const allProducts = await getProducts();
      const foundProduct = allProducts.find(p => p.id === id);
      if (!foundProduct) throw new Error("Product not found");
      return foundProduct;
    },
  });

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center font-sans uppercase font-black tracking-widest">
        Loading Carly Hub...
      </div>
    );
  if (!product || product.error)
    return (
      <div className="min-h-screen flex items-center justify-center font-sans uppercase font-black tracking-widest">
        Product Not Found
      </div>
    );

  const variants = product.variants || [];
  const sizes = [...new Set(variants.map((v) => v.size))].filter(Boolean);
  const colors = [...new Set(variants.map((v) => v.color))].filter(Boolean);

  const selectedVariant = variants.find(
    (v) =>
      (!selectedSize || v.size === selectedSize) &&
      (!selectedColor || v.color === selectedColor),
  );

  const price = selectedVariant?.price || product.basePrice;

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    if (!selectedVariant) {
      toast.error("This combination is currently unavailable");
      return;
    }

    addItem(product, selectedVariant, quantity);
    toast.success(`${product.name} added to cart`);
  };

  const handlePayment = () => {
    // Navigate to checkout page with cart data
    const checkoutData = {
      product: product,
      variant: selectedVariant,
      quantity: quantity,
      size: selectedSize,
      color: selectedColor
    };
    
    // Store checkout data in localStorage for checkout page to access
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    
    // Navigate to checkout page
    window.location.href = '/checkout';
  };

  const handleWhatsAppOrder = () => {
    const text = `Hi Carly Hub, I want to order:\nProduct: ${product.name}\n${selectedSize ? `Size: ${selectedSize}` : ""}\n${selectedColor ? `Color: ${selectedColor}` : ""}\nQuantity: ${quantity}\nPrice (₵)${Number(price * quantity).toLocaleString()}\nURL: ${window.location.href}`;
    window.open(
      `https://wa.me/233123456789?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Images */}
          <div className="space-y-6">
            <div className="aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden relative group">
              <img
                src={
                  product.images?.[activeImage] ||
                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80"
                }
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
              />
              <button className="absolute top-6 right-6 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                <Heart className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images?.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === i ? "border-black" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${i}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="mb-8">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-3 block">
                {product.category_name}
              </span>
              <h1 className="text-5xl font-black text-black tracking-tighter uppercase leading-tight mb-4">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                  (24 Reviews)
                </span>
              </div>
              <p className="text-3xl font-black text-black tracking-tight">
                GH¢{price?.toLocaleString()}
              </p>
            </div>

            <div className="space-y-8">
              {/* Size Selector */}
              {sizes.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-900">
                      Select Size
                    </label>
                    <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black underline">
                      Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`h-12 w-16 flex items-center justify-center rounded-xl font-bold transition-all border-2 ${selectedSize === size ? "bg-black text-white border-black" : "bg-white text-black border-gray-100 hover:border-black"}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {colors.length > 0 && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-900 mb-4">
                    Select Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-6 h-12 flex items-center justify-center rounded-xl font-bold transition-all border-2 ${selectedColor === color ? "bg-black text-white border-black" : "bg-white text-black border-gray-100 hover:border-black"}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-900 mb-4">
                  Quantity
                </label>
                <div className="inline-flex items-center p-1 bg-gray-50 rounded-2xl border border-gray-100">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-white rounded-xl transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-6 font-black text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-white rounded-xl transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <button
                  onClick={handleAddToCart}
                  className="flex items-center justify-center space-x-3 bg-black text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all transform hover:-translate-y-1 shadow-lg shadow-black/10"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Bag</span>
                </button>
                
                {!paymentMade ? (
                  <button
                    onClick={handlePayment}
                    className="flex items-center justify-center space-x-3 bg-blue-500 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all transform hover:-translate-y-1 shadow-lg shadow-blue-500/10"
                  >
                    <Check className="h-5 w-5" />
                    <span>Proceed to Payment</span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={handleWhatsAppOrder}
                      className="flex items-center justify-center space-x-3 bg-green-500 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-green-600 transition-all transform hover:-translate-y-1 shadow-lg shadow-green-500/10"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>WhatsApp Order</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const text = `Hi Carly Hub, I want to ask about delivery pricing for:\nProduct: ${product.name}\n${selectedSize ? `Size: ${selectedSize}` : ""}\n${selectedColor ? `Color: ${selectedColor}` : ""}\nQuantity: ${quantity}`;
                        window.open(
                          `https://wa.me/233123456789?text=${encodeURIComponent(text)}`,
                          "_blank",
                        );
                      }}
                      className="flex items-center justify-center space-x-3 bg-orange-500 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-orange-600 transition-all transform hover:-translate-y-1 shadow-lg shadow-orange-500/10"
                    >
                      <Truck className="h-5 w-5" />
                      <span>Ask Delivery Price</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Trust Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 border-t border-gray-100">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">
                      Fast Delivery
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Free delivery on orders over ₵150k.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">
                      Secure Check
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Encrypted Paystack payments.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-16 pt-16 border-t border-gray-100">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-6">
                Product Insight
              </h3>
              <div className="prose prose-sm text-gray-600 font-medium leading-relaxed max-w-none">
                {product.description ||
                  "No description available for this premium piece."}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
