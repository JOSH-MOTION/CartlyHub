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
} from "lucide-react";
import { useApp } from '../context/AppContext';
import useCart from '../store/useCart';
import CartSidebar from './CartSidebar';

export default function Navbar() {
  const router = useRouter();
  const { user, profile, sellerProfile, signOut, wishlist, searchQuery, setSearchQuery } = useApp();
  const { items } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
              href="/products?category=fashion"
              className="text-sm font-semibold uppercase tracking-widest hover:text-gray-500 transition-colors"
            >
              Fashion
            </a>
            <a
              href="/products?category=shoes"
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
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
            >
              <Search className="h-6 w-6" />
            </button>

            <button
              className="md:hidden p-2"
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="pb-4 border-b border-gray-100">
            <form onSubmit={handleSearch}>
              <div className="flex items-center bg-gray-50 rounded-xl px-4 py-2">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="bg-transparent border-none outline-none w-full text-sm"
                />
              </div>
            </form>
          </div>
          <a
            href="/products"
            className="block text-lg font-bold uppercase tracking-widest"
          >
            Shop All
          </a>
          <a
            href="/products?category=fashion"
            className="block text-lg font-bold uppercase tracking-widest"
          >
            Fashion
          </a>
          <a
            href="/products?category=shoes"
            className="block text-lg font-bold uppercase tracking-widest"
          >
            Shoes
          </a>

          <div className="pt-4 border-t border-gray-100 flex flex-col space-y-4">
            <a href="/wishlist" className="flex items-center space-x-2 text-sm font-bold uppercase">
              <Heart className="h-4 w-4" />
              <span>Wishlist {wishlist?.length > 0 ? `(${wishlist.length})` : ''}</span>
            </a>
            {user ? (
              <>
                <a href="/account/profile" className="flex items-center space-x-2 text-sm font-bold uppercase">
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </a>
                <a href="/account/orders" className="flex items-center space-x-2 text-sm font-bold uppercase">
                  <ShoppingCart className="h-4 w-4" />
                  <span>My Orders</span>
                </a>
                {sellerProfile ? (
                  <a href="/seller" className="flex items-center space-x-2 text-sm font-bold uppercase text-black">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Portal</span>
                  </a>
                ) : (
                  <a href="/seller/onboarding" className="flex items-center space-x-2 text-sm font-bold uppercase text-black">
                    <Store className="h-4 w-4" />
                    <span>Sell</span>
                  </a>
                )}
                <button onClick={signOut} className="flex items-center space-x-2 text-sm font-bold uppercase text-red-500 text-left">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <a href="/account/signin" className="flex items-center justify-center w-full bg-black text-white py-3 rounded-xl text-sm font-bold uppercase tracking-widest">
                Login / Register
              </a>
            )}
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
  );
}
