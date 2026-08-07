"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
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
  MapPin,
  Store,
  Phone,
  Zap,
  Eye,
  Bookmark,
  PhoneCall,
  Loader2,
  Share2,
} from "lucide-react";
import useCart from "@/store/useCart";
import { toast } from "sonner";
import { getProducts, getProductReviews, submitReview, incrementProductViews, getSellerReviews } from "@/utils/firebaseData";
import { useApp } from "@/context/AppContext";
import { useQueryClient } from "@tanstack/react-query";
import { getTimeOnPlatform, getTimeAgo } from "@/utils/helpers";
import FilterSidebar from "@/components/FilterSidebar";
import { categories } from "@/utils/categories";
import { MessageSquare, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  acceptsOnlinePayments,
  acceptsWhatsappOrders,
} from "@/services/marketplace/constants";
import { resolvePricing } from "@/lib/pricing";
import ReviewsSection from "@/components/marketplace/ReviewsSection";

export default function ProductDetailClient({ params, productId }) {
  // The URL segment is a slug (`name-words-<id>`), so the resolved document id
  // is passed down from the server component. params is kept as a fallback.
  const id = productId || params?.id;
  const router = useRouter();
  const { addItem } = useCart();
  const { toggleWishlist, wishlist } = useApp();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (id) {
      incrementProductViews(id);
    }
  }, [id]);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const allProducts = await getProducts();
      const foundProduct = allProducts.find(p => p.id === id);
      if (!foundProduct) throw new Error("Product not found");

      return foundProduct;
    },
  });

  const { data: sellerInfo } = useQuery({
    queryKey: ["seller", product?.sellerId],
    queryFn: async () => {
      if (!product?.sellerId) return null;
      const { getSeller } = await import("@/utils/firebaseData");
      return await getSeller(product.sellerId);
    },
    enabled: !!product?.sellerId,
  });

  const { data: sellerReviews } = useQuery({
    queryKey: ["seller-reviews", product?.sellerName],
    queryFn: () => getSellerReviews(product?.sellerName),
    enabled: !!product?.sellerName,
  });

  const averageSellerRating = sellerReviews?.length > 0 
    ? sellerReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / sellerReviews.length 
    : 0;

  const { data: moreFromSeller = [], isLoading: moreFromSellerLoading } = useQuery({
    queryKey: ["moreFromSeller", product?.sellerId, product?.id],
    queryFn: async () => {
      if (!product?.sellerId) return [];
      const allProducts = await getProducts({ sellerId: product.sellerId });
      return allProducts.filter(p => p.id !== product.id).slice(0, 4);
    },
    enabled: !!product?.sellerId,
  });

  if (isLoading)
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
        <div className="relative">
          <div className="text-4xl font-black tracking-tighter text-black uppercase animate-pulse mb-8">
            cartly<span className="text-gray-400">Hub</span>
          </div>
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        </div>
      </div>
    );
  if (!product || product.error)
    return (
      <div className="min-h-screen flex items-center justify-center font-sans uppercase font-black tracking-widest">
        Product Not Found
      </div>
    );

  const variants = product.variants || [];
  const allColors = [...new Set(variants.map((v) => v.color || v.colorName))].filter(Boolean);
  const allSizes = [...new Set(variants.map((v) => v.size))].filter(Boolean);

  const availableSizes = selectedColor
    ? [...new Set(variants.filter(v => (v.color || v.colorName) === selectedColor).map(v => v.size))].filter(Boolean)
    : allSizes;

  const availableColors = selectedSize
    ? [...new Set(variants.filter(v => v.size === selectedSize).map(v => v.color || v.colorName))].filter(Boolean)
    : allColors;

  const selectedVariant = variants.find(
    (v) =>
      (!selectedSize || v.size === selectedSize) &&
      (!selectedColor || (v.color || v.colorName) === selectedColor),
  );

  const pricing = resolvePricing(product, selectedVariant);
  const price = pricing.price;

  const handleSizeSelect = (size) => {
    setSelectedSize(size === selectedSize ? "" : size);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color === selectedColor ? "" : color);
  };

  // What this vendor accepts decides the primary button. WhatsApp-only vendors
  // get "Order on WhatsApp"; everyone else gets the Pay Now path.
  const vendorAcceptsOnline = sellerInfo
    ? acceptsOnlinePayments(sellerInfo)
    : !product.sellerId; // Cartly Hub's own listings are always payable online
  const vendorAcceptsWhatsapp = acceptsWhatsappOrders(sellerInfo);

  // Both routes go through checkout, where the order is saved to Cartly Hub
  // before anything is handed to WhatsApp or the payment gateway.
  const handleStartOrder = () => {
    if (!selectedVariant) {
      toast.error("Choose the options you want first");
      return;
    }

    addItem(product, selectedVariant, quantity, []);
    router.push("/checkout");
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product.id);
    const isInWishlist = wishlist?.includes(product.id);
    toast.success(isInWishlist ? `${product.name} removed from wishlist` : `${product.name} added to wishlist`);
  };

  const isInWishlist = wishlist?.includes(product.id);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Images & Main Info */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden relative group shadow-sm">
                <img
                  src={product.images?.[activeImage] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 border ${isInWishlist ? 'bg-red-500 text-white border-transparent' : 'bg-white text-gray-400 border-gray-100 hover:text-red-500'}`}
                  >
                    <Heart className={`h-6 w-6 ${isInWishlist ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        if (navigator.share) {
                          await navigator.share({
                            title: product.name,
                            text: `Check out ${product.name} for GH₵${price} on CartlyHub!`,
                            url: window.location.href,
                          });
                        } else {
                          await navigator.clipboard.writeText(window.location.href);
                          toast.success("Link copied to clipboard!");
                        }
                      } catch (error) {
                        console.error("Error sharing:", error);
                      }
                    }}
                    className="p-3 bg-white text-gray-400 border border-gray-100 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:text-black"
                  >
                    <Share2 className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {product.images?.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === i ? "border-black" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={img} alt={`${product.name} ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Stats & Attributes (Under Images on Mobile, Left Side on Desktop) */}
            <div className="space-y-6 pt-6">
              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pb-4 border-b border-gray-100">
                <div className="flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">
                  <div className="p-1.5 bg-gray-50 rounded-lg mr-2">
                    <Eye className="h-3 w-3 text-gray-400" />
                  </div>
                  {product.views || 0} Views
                </div>
                <div className="flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">
                  <div className="p-1.5 bg-gray-50 rounded-lg mr-2">
                    <Bookmark className="h-3 w-3 text-gray-400" />
                  </div>
                  {product.saves || 0} Saved
                </div>
                <div className="flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">
                  <div className="p-1.5 bg-gray-50 rounded-lg mr-2">
                    <MapPin className="h-3 w-3 text-gray-400" />
                  </div>
                  {product.region}
                </div>
                <div className="flex items-center text-[10px] font-black uppercase text-emerald-500 tracking-widest whitespace-nowrap ml-auto sm:ml-0">
                  <div className="p-1.5 bg-emerald-50 rounded-lg mr-2">
                    <Zap className="h-3 w-3 text-emerald-500" />
                  </div>
                  Posted {getTimeAgo(product.createdAt)}
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
                {product.category_name && (
                  <div className="flex justify-between border-b border-gray-50 py-3">
                    <span className="text-[10px] font-black uppercase text-gray-400">Type</span>
                    <span className="text-[10px] font-black uppercase text-black">{product.category_name}</span>
                  </div>
                )}
                {product.brand && (
                  <div className="flex justify-between border-b border-gray-50 py-3">
                    <span className="text-[10px] font-black uppercase text-gray-400">Brand</span>
                    <span className="text-[10px] font-black uppercase text-black">{product.brand}</span>
                  </div>
                )}
                {product.gender && (
                  <div className="flex justify-between border-b border-gray-50 py-3">
                    <span className="text-[10px] font-black uppercase text-gray-400">Gender</span>
                    <span className="text-[10px] font-black uppercase text-black">{product.gender}</span>
                  </div>
                )}
                {(selectedColor || product.color) && (
                  <div className="flex justify-between border-b border-gray-50 py-3">
                    <span className="text-[10px] font-black uppercase text-gray-400">Color</span>
                    <span className="text-[10px] font-black uppercase text-black">{selectedColor || product.color}</span>
                  </div>
                )}
                {product.condition && (
                  <div className="flex justify-between border-b border-gray-50 py-3">
                    <span className="text-[10px] font-black uppercase text-gray-400">Condition</span>
                    <span className="text-[10px] font-black uppercase text-black">{product.condition}</span>
                  </div>
                )}
                {product.closure && (
                  <div className="flex justify-between border-b border-gray-50 py-3">
                    <span className="text-[10px] font-black uppercase text-gray-400">Closure</span>
                    <span className="text-[10px] font-black uppercase text-black">{product.closure}</span>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Product Insight</h3>
                <div className={`prose prose-sm text-gray-600 font-medium leading-relaxed max-w-none whitespace-pre-wrap transition-all duration-500 overflow-hidden ${!isExpanded && (product.description?.length > 200) ? 'max-h-24' : 'max-h-[2000px]'}`}>
                  {product.description || "No description available for this premium piece."}
                </div>
                {product.description?.length > 200 && (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[10px] font-black uppercase text-emerald-600 hover:underline pt-2"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>

              {/* Address / Store Link */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                <div className="flex items-center space-x-3">
                   <div className="p-3 bg-white rounded-xl shadow-sm">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                   </div>
                   <div>
                      <h4 className="text-[10px] font-black uppercase text-black">Store Address</h4>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{product.location || "Accra, Ghana"}</p>
                   </div>
                </div>
                <button className="text-[10px] font-black uppercase text-emerald-600">Show 1 options</button>
              </div>
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="flex flex-col space-y-4">
            
            {/* Price & Primary Action Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
              <div className="flex items-baseline justify-between mb-4">
                <div className="flex items-baseline space-x-2">
                  <span
                    className={`text-3xl font-black tracking-tight ${
                      pricing.isDiscounted ? "text-red-600" : "text-black"
                    }`}
                  >
                    GH₵ {price?.toLocaleString()}
                  </span>
                  {pricing.isDiscounted && (
                    <>
                      <span className="text-base font-bold text-gray-400 line-through">
                        GH₵ {pricing.compareAtPrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 px-2 py-1 rounded-full">
                        -{pricing.percentOff}%
                      </span>
                    </>
                  )}
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline">
                  Price History
                </button>
              </div>

              <button
                onClick={handleStartOrder}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all transform hover:-translate-y-0.5 shadow-md mb-4 ${
                  vendorAcceptsOnline
                    ? "bg-black text-white hover:bg-gray-800 shadow-black/10"
                    : "bg-[#25D366] text-white hover:bg-[#1da851] shadow-[#25D366]/20"
                }`}
              >
                {vendorAcceptsOnline ? (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Pay now</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 fill-current" />
                    <span>Order on WhatsApp</span>
                  </>
                )}
              </button>

              {vendorAcceptsOnline && vendorAcceptsWhatsapp && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center -mt-2 mb-4">
                  Or chat with {sellerInfo?.storeName || "the vendor"} after ordering
                </p>
              )}

              {/* Size & Color Selectors (Integrated) */}
              {(allSizes.length > 0 || allColors.length > 0) && (
                <div className="space-y-6 pt-6 border-t border-gray-50">
                  {allSizes.length > 0 && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Size</label>
                      <div className="flex flex-wrap gap-2">
                        {allSizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => handleSizeSelect(size)}
                            className={`h-10 w-12 flex items-center justify-center rounded-lg text-xs font-black transition-all border-2 
                              ${selectedSize === size ? "bg-black text-white border-black" : "bg-white text-black border-gray-100 hover:border-black"}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {allColors.length > 0 && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Color</label>
                      <div className="flex flex-wrap gap-2">
                        {allColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorSelect(color)}
                            className={`px-4 h-10 flex items-center justify-center rounded-lg text-[10px] font-black transition-all border-2 
                              ${selectedColor === color ? "bg-black text-white border-black" : "bg-white text-black border-gray-100 hover:border-black"}`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Seller Info Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
              <div className="mb-4">
                <h1 className="text-xl font-black text-black tracking-tight uppercase mb-1">{product.name}</h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Listed in {product.category_name} • {product.region}
                </p>
              </div>

              <div className="flex items-center space-x-3 mb-6">
                <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white font-black text-lg shadow-sm">
                  {product.sellerName?.charAt(0).toUpperCase() || "C"}
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm tracking-tight">{product.sellerName || "Cartly Hub Admin"}</h3>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">
                    {getTimeOnPlatform(sellerInfo?.createdAt)}
                  </p>
                  <Link href={`/opinions/${product.sellerId || sellerInfo?.id || "admin"}`} className="flex items-center space-x-1 mt-1 group">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star 
                          key={s} 
                          className={`h-2 w-2 ${s <= (averageSellerRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[8px] font-black uppercase text-gray-400 group-hover:text-emerald-600 transition-colors">({sellerReviews?.length || 0})</span>
                  </Link>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-[10px] font-black uppercase text-gray-500 tracking-widest">
                  <ShieldCheck className="h-4 w-4 mr-2.5 text-blue-500" />
                  Verified ID
                </div>
                <div className="flex items-center text-[10px] font-black uppercase text-gray-500 tracking-widest">
                  <Zap className="h-4 w-4 mr-2.5 text-emerald-500" />
                  Typically replies within a day
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setShowPhone(!showPhone)}
                  className="w-full bg-black text-white py-3 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all shadow-md shadow-black/5 flex items-center justify-center space-x-2"
                >
                  <Phone className="h-3 w-3" />
                  <span>{showPhone ? (product.sellerPhone || "No Number") : "Show contact"}</span>
                </button>
                <button 
                  className="w-full bg-white text-black border border-black py-3 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-all"
                >
                  Make an offer
                </button>
                <button 
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-50 text-emerald-700 py-3 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-100 transition-all border border-emerald-100"
                >
                  <PhoneCall className="h-3 w-3" />
                  <span>Request call back</span>
                </button>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                <Link 
                  href={`/opinions/${product.sellerId || sellerInfo?.id || "admin"}`}
                  className="flex items-center space-x-2 group cursor-pointer"
                >
                   <span className="text-[10px] font-black uppercase text-gray-900 group-hover:text-emerald-600 transition-colors">{sellerReviews?.length || 0} Feedback</span>
                   <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </Link>
                <a href={`/store/${encodeURIComponent(product.sellerName || "Admin")}`} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline">View All</a>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 flex items-center justify-between shadow-sm">
                <button className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors">Mark unavailable</button>
                <div className="h-4 w-[1px] bg-gray-100"></div>
                <button className="text-[10px] font-black uppercase text-emerald-600 hover:underline">Request Price History</button>
            </div>

            {/* Safety & Report Card */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Safety Tips</h4>
                <button className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline">Report Abuse</button>
              </div>
              <ul className="space-y-4">
                {[
                  "Avoid paying in advance, even for delivery",
                  "Meet with the seller at a safe public place",
                  "Inspect the item and ensure it's exactly what you want",
                  "Make sure that the packed item is the one you've inspected",
                  "Only pay if you're satisfied"
                ].map((tip, i) => (
                  <li key={i} className="flex items-start">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tight leading-tight">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>

            <button className="w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:border-black hover:text-black transition-all">
              Post Ad Like This
            </button>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-20 pt-20 border-t border-gray-100">
          <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center">
             <span className="w-12 h-[2px] bg-black mr-4"></span>
             Product Insight
          </h3>
          <div className="prose prose-sm text-gray-600 font-medium leading-relaxed max-w-4xl whitespace-pre-wrap">
            {product.description || "No description available for this premium piece."}
          </div>
        </div>

        {/* Public feedback — visible to everyone, signed in or not */}
        <ReviewsSection
          reviews={sellerReviews || []}
          sellerId={product.sellerId || sellerInfo?.id}
          sellerName={product.sellerName || sellerInfo?.storeName}
        />

        {/* More from Seller Section */}
        {moreFromSeller.length > 0 && (
          <div className="mt-32 pt-24 border-t border-gray-100">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
               <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3 block">From the Boutique</span>
                  <h2 className="text-4xl font-black text-black tracking-tighter uppercase">More from {product.sellerName || "this seller"}</h2>
               </div>
               <a href={`/store/${encodeURIComponent(product.sellerName || "Admin")}`} className="px-8 py-5 bg-white border-2 border-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">View Store</a>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {moreFromSeller.map((p) => <ProductCard key={p.id} product={p} categories={categories} />)}
            </div>
          </div>
        )}

      </main>

      <FilterSidebar 
        isOpen={false} 
        onClose={() => {}} 
        categories={categories}
        selectedCategory="all"
        setSelectedCategory={() => {}}
        selectedRegion="all"
        setSelectedRegion={() => {}}
        priceRange={{ min: "", max: "" }}
        setPriceRange={() => {}}
      />
      <Footer />
    </div>
  );
}
