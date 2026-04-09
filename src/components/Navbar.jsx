"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Heart,
  Search,
  User,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useApp } from '../context/AppContext';
import useCart from '../store/useCart';
import CartSidebar from './CartSidebar';

export default function Navbar() {
  const { user, signOut, wishlist } = useApp();
  const { items } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white shadow-sm py-3" : "bg-white shadow-sm py-3 md:bg-transparent md:shadow-none md:py-5"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <a
              href="/"
              className="text-2xl font-black tracking-tighter text-black uppercase"
            >
              Carly<span className="text-gray-500">Hub</span>
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
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Search className="h-5 w-5" />
              </button>
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
                  <a href="/account/orders" className="block">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-colors">
                      <User className="h-4 w-4" />
                    </div>
                  </a>
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="pb-4 border-b border-gray-100 flex items-center bg-gray-50 rounded-xl px-4 py-2">
             <Search className="h-4 w-4 text-gray-400 mr-2" />
             <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none w-full text-sm" />
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
                <a href="/account/orders" className="flex items-center space-x-2 text-sm font-bold uppercase">
                  <User className="h-4 w-4" />
                  <span>My Orders</span>
                </a>
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
