"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  Search,
  User,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Store,
  ChevronRight,
  Instagram
} from "lucide-react";

const Tiktok = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 16 16" 
    fill="currentColor" 
    className={className}
  >
    <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
  </svg>
);
import { useApp } from '../context/AppContext';
import useCart from '../store/useCart';
import CartSidebar from './CartSidebar';
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Navbar() {
  const router = useRouter();
  const { user, profile, sellerProfile, signOut, wishlist, searchQuery, setSearchQuery } = useApp();
  const { items } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "seller_broadcast"));
        if (docSnap.exists() && docSnap.data().isActive) {
          setAnnouncement(docSnap.data());
        }
      } catch (e) {
        console.error("Error fetching announcement in navbar:", e);
      }
    };
    fetchAnnouncement();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // If not on homepage or products page, redirect to products page when starting to type
    const pathname = window.location.pathname;
    if (value.trim() && pathname !== '/' && pathname !== '/products') {
      router.push(`/products?search=${encodeURIComponent(value.trim())}`);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <>
      {announcement && sellerProfile && (() => {
        const alertText = `⚠️ ${announcement.title}: ${announcement.message} \u00a0\u00a0\u00a0\u00a0 • \u00a0\u00a0\u00a0\u00a0 ⚡ ${announcement.title}: ${announcement.message} \u00a0\u00a0\u00a0\u00a0 • \u00a0\u00a0\u00a0\u00a0`;
        return (
          <div className="w-full bg-black text-white border-b border-white/10 py-2.5 px-4 text-[9px] font-black uppercase tracking-widest relative overflow-hidden flex items-center z-[100] shadow-sm">
            <style>{`
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-100%); }
              }
              .custom-marquee {
                display: inline-block;
                animation: marquee 120s linear infinite;
                white-space: nowrap;
              }
            `}</style>
            <div className="relative w-full overflow-hidden flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-black mr-4 shrink-0 z-10 uppercase tracking-tight flex items-center gap-1 shadow-sm">
                <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
                Alert
              </span>
              <div className="w-full overflow-hidden relative flex gap-8">
                <div className="custom-marquee text-gray-200 shrink-0">
                  {alertText} {alertText}
                </div>
                <div className="custom-marquee text-gray-200 shrink-0" aria-hidden="true">
                  {alertText} {alertText}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      <nav
        className="w-full z-50 bg-white border-b border-gray-100 py-4"
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <a
              href="/"
              className="flex items-center group"
            >
              <img 
                src="/logo-bg.png" 
                alt="Cartly Hub" 
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </a>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="/products"
              className="text-sm font-semibold uppercase tracking-widest hover:text-gray-500 transition-colors"
            >
              Shop All
            </a>
            <a
              href="/category/fashion"
              className="text-sm font-semibold uppercase tracking-widest hover:text-gray-500 transition-colors"
            >
              Fashion
            </a>
            <a
              href="/category/shoes-footwear"
              className="text-sm font-semibold uppercase tracking-widest hover:text-gray-500 transition-colors"
            >
              Shoes
            </a>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-3 md:space-x-5">
            <div className="hidden md:flex items-center space-x-5">
              {/* Search Bar */}
              <div className={`relative transition-all duration-300 ${isSearchFocused ? 'w-80' : 'w-64'}`}>
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                      onKeyDown={handleSearchKeyPress}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-full border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </form>
              </div>
              <a
                href="/wishlist"
                aria-label="View wishlist"
                className="text-sm font-semibold uppercase tracking-widest hover:text-gray-500 transition-colors relative"
              >
                <Heart className="h-5 w-5" />
                {wishlist?.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </a>
            </div>

            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              aria-label="Open cart"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            <div className="h-6 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <a href="/account/profile" className="block" title="View Profile">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-colors overflow-hidden">
                      {user.photoURL || profile?.photoURL ? (
                        <img src={user.photoURL || profile.photoURL} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                  </a>
                  {sellerProfile ? (
                    <a
                      href="/seller"
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all flex items-center space-x-1"
                    >
                      <LayoutDashboard className="h-3 w-3" />
                      <span>Portal</span>
                    </a>
                  ) : (
                    <a
                      href="/seller/onboarding"
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-black text-white rounded-full hover:bg-gray-800 transition-all"
                    >
                      Sell
                    </a>
                  )}
                  <button
                    onClick={signOut}
                    className="text-sm font-bold uppercase hover:underline"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <a
                  href="/account/signin"
                  className="text-sm font-bold uppercase tracking-widest px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Login
                </a>
              )}
            </div>

            <button
              className="md:hidden p-2"
              aria-label={isMobileSearchOpen ? "Close search" : "Open search"}
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
            >
              <Search className="h-6 w-6" />
            </button>

            <button
              className="md:hidden p-2"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                if (isMobileSearchOpen) setIsMobileSearchOpen(false);
              }}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - Expandable */}
      {isMobileSearchOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 animate-in slide-in-from-top-2 duration-300">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none transition-all text-sm font-medium"
              />
            </div>
          </form>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden bg-white/95 backdrop-blur-xl animate-in fade-in slide-in-from-right duration-500 flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <img src="/logo-bg.png" alt="Cartly Hub" className="h-7 w-auto" />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
              className="p-2 bg-gray-50 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto px-5 py-6 space-y-8">
            {/* Search Section */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all text-[10px] font-black uppercase tracking-widest"
                />
              </div>
            </form>

            {/* Marketplace Section - 3 Column Grid */}
            <div className="space-y-3">
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Marketplace</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "All", href: "/products", icon: Store },
                  { name: "Fashion", href: "/category/fashion", icon: Heart },
                  { name: "Shoes", href: "/category/shoes-footwear", icon: ShoppingCart }
                ].map((item) => (
                  <a 
                    key={item.name}
                    href={item.href}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl hover:bg-black group transition-all"
                  >
                    <item.icon className="h-4 w-4 text-gray-900 group-hover:text-white mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-tighter group-hover:text-white transition-colors">{item.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Account Section */}
            <div className="space-y-3">
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Account</h4>
              <div className="grid grid-cols-2 gap-2">
                {user ? (
                  <>
                    <a href="/account/profile" className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-transparent">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
                    </a>
                    <a href="/wishlist" className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-transparent">
                      <Heart className="h-4 w-4 text-gray-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Saved</span>
                    </a>
                    {sellerProfile ? (
                      <a href="/seller" className="col-span-2 flex items-center justify-between p-4 bg-black text-white rounded-xl">
                        <div className="flex items-center space-x-3">
                           <LayoutDashboard className="h-4 w-4" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Seller Portal</span>
                        </div>
                        <ChevronRight className="h-3 w-3" />
                      </a>
                    ) : (
                      <a href="/seller/onboarding" className="col-span-2 flex items-center justify-between p-4 bg-emerald-600 text-white rounded-xl">
                        <div className="flex items-center space-x-3">
                           <Store className="h-4 w-4" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Start Selling</span>
                        </div>
                        <ChevronRight className="h-3 w-3" />
                      </a>
                    )}
                    <button 
                      onClick={signOut}
                      className="col-span-2 flex items-center justify-center p-3 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <a href="/account/signin" className="col-span-2 flex items-center justify-center p-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px]">
                    Login / Register
                  </a>
                )}
              </div>
            </div>

            {/* Legal Section */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Information</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { name: "Terms", href: "/terms" },
                  { name: "Privacy", href: "/privacy" },
                  { name: "Refunds", href: "/refund" },
                  { name: "Safety", href: "/safety-tips" }
                ].map(link => (
                  <a key={link.name} href={link.href} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors flex items-center">
                    <div className="w-1 h-1 bg-gray-200 rounded-full mr-2"></div>
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-300">© 2026 CartlyHub</p>
            <div className="flex space-x-3">
               <a href="https://www.tiktok.com/@cartly_hub?_r=1&_t=ZS-979p4joLmb6" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-black transition-colors"><Tiktok className="h-3.5 w-3.5" /></a>
               <a href="https://www.instagram.com/cartlyhub?igsh=MWwydWpzZ3g1YXF0dA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-black transition-colors"><Instagram className="h-3.5 w-3.5" /></a>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
    </>
  );
}
