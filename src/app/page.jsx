"use client";

import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { ArrowRight, ShoppingBag, Truck, ShieldCheck, Zap } from "lucide-react";
import { getProducts } from "../utils/firebaseData";

export default function HomePage() {
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      return await getProducts({ featured: true });
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden bg-gray-50 pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80"
            className="w-full h-full object-cover"
            alt="Hero"
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6">
              New Arrivals 2026 - Ghana
            </span>
            <h1 className="text-6xl sm:text-8xl font-black text-black tracking-tighter leading-[0.9] mb-8">
              STYLE IS A <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
                REFLEX.
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-lg font-medium leading-relaxed">
              Discover the latest premium fashion, shoes, and accessories
              curated for the modern lifestyle. Quality meets affordability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/products"
                className="inline-flex items-center justify-center px-10 py-5 bg-black text-white font-bold uppercase tracking-widest text-sm rounded-2xl hover:bg-gray-800 transition-all transform hover:-translate-y-1"
              >
                Shop Collection
                <ArrowRight className="ml-3 h-5 w-5" />
              </a>
              <a
                href="/products?category=fashion"
                className="inline-flex items-center justify-center px-10 py-5 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-2xl border-2 border-gray-100 hover:border-black transition-all"
              >
                Browse Fashion
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Truck, title: "Fast Delivery", desc: "Across Ghana" },
              {
                icon: ShieldCheck,
                title: "Secure Payment",
                desc: "Paystack Powered",
              },
              {
                icon: ShoppingBag,
                title: "100% Original",
                desc: "Quality Guaranteed",
              },
              { icon: Zap, title: "24/7 Support", desc: "Always here" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center space-y-2"
              >
                <item.icon className="h-8 w-8 text-black" />
                <h4 className="font-black text-sm uppercase tracking-widest">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2 block">
                Curation
              </span>
              <h2 className="text-4xl font-black text-black tracking-tighter uppercase">
                Featured Drop
              </h2>
            </div>
            <a
              href="/products"
              className="text-sm font-bold uppercase tracking-widest hover:underline flex items-center group"
            >
              View All{" "}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse space-y-4">
                  <div className="bg-gray-200 aspect-[4/5] rounded-2xl"></div>
                  <div className="h-4 bg-gray-200 w-3/4 rounded"></div>
                  <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts?.map((product) => (
                <ProductCard key={product.id} product={product} categories={categories} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-black tracking-tighter uppercase text-center mb-16">
            Shop by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Mens Fashion",
                img: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&q=80",
                link: "/products?category=fashion",
              },
              {
                name: "Premium Shoes",
                img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
                link: "/products?category=shoes",
              },
              {
                name: "Accessories",
                img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
                link: "/products?category=accessories",
              },
            ].map((cat, i) => (
              <a
                key={i}
                href={cat.link}
                className="group relative h-[400px] rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-10 left-10">
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">
                    {cat.name}
                  </h3>
                  <div className="inline-flex items-center text-white text-xs font-black uppercase tracking-widest group-hover:underline">
                    Explore <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-6 leading-tight">
            Join the Carly Hub <br /> Inner Circle
          </h2>
          <p className="text-gray-400 mb-10 font-medium text-lg">
            Be the first to hear about new drops, exclusive discounts, and
            fashion tips. No spam, just pure style.
          </p>
          <form className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-grow bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white transition-all"
            />
            <button className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors">
              Join Now
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <a
                href="/"
                className="text-2xl font-black tracking-tighter text-black uppercase"
              >
                Carly<span className="text-gray-500">Hub</span>
              </a>
              <p className="text-gray-500 font-medium leading-relaxed">
                Premium fashion marketplace delivering style across Ghana.
                Quality you can trust.
              </p>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8">
                Shop
              </h4>
              <ul className="space-y-4 text-sm font-bold text-gray-500">
                <li>
                  <a
                    href="/products"
                    className="hover:text-black transition-colors"
                  >
                    All Products
                  </a>
                </li>
                <li>
                  <a
                    href="/products?category=fashion"
                    className="hover:text-black transition-colors"
                  >
                    Fashion
                  </a>
                </li>
                <li>
                  <a
                    href="/products?category=shoes"
                    className="hover:text-black transition-colors"
                  >
                    Shoes
                  </a>
                </li>
                <li>
                  <a
                    href="/products?category=accessories"
                    className="hover:text-black transition-colors"
                  >
                    Accessories
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8">
                Account
              </h4>
              <ul className="space-y-4 text-sm font-bold text-gray-500">
                <li>
                  <a
                    href="/account/orders"
                    className="hover:text-black transition-colors"
                  >
                    Order Tracking
                  </a>
                </li>
                <li>
                  <a
                    href="/cart"
                    className="hover:text-black transition-colors"
                  >
                    My Cart
                  </a>
                </li>
                <li>
                  <a
                    href="/account/wishlist"
                    className="hover:text-black transition-colors"
                  >
                    Wishlist
                  </a>
                </li>
                <li>
                  <a
                    href="/account/signin"
                    className="hover:text-black transition-colors"
                  >
                    Login
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-8">
                Contact
              </h4>
              <ul className="space-y-4 text-sm font-bold text-gray-500">
                <li>Email: support@carlyhub.com</li>
                <li>WhatsApp: +233 123 456 789</li>
                <li>Accra, Ghana</li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-black uppercase tracking-widest">
              © 2026 Carly Hub. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
