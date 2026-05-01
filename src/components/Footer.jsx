"use client";

import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, Github, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Column */}
          <div className="space-y-6">
            <a href="/" className="inline-block">
              <img 
                src="/logo-bg.png" 
                alt="Cartly Hub" 
                className="h-10 w-auto object-contain"
              />
            </a>
            <p className="text-gray-500 text-xs font-medium leading-relaxed max-w-xs uppercase tracking-wider">
              Ghana's premium marketplace for verified quality. We connect trusted sellers with discerning buyers across the nation.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-all">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-all">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-all">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Marketplace</h4>
            <ul className="space-y-3">
              <li><a href="/products" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">All Products</a></li>
              <li><a href="/products?category=fashion" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Fashion</a></li>
              <li><a href="/products?category=electronics" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Electronics</a></li>
              <li><a href="/seller/onboarding" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Start Selling</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Legal & Safety</h4>
            <ul className="space-y-3">
              <li><a href="/terms" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Terms & Conditions</a></li>
              <li><a href="/privacy" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Privacy Policy</a></li>
              <li><a href="/refund" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Refund Policy</a></li>
              <li><a href="/cookies" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Cookie Policy</a></li>
              <li><a href="/safety-tips" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Safety Tips</a></li>
              <li><a href="/seller-policy" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Seller Policy</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Get in Touch</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Accra, Greater Accra Region, Ghana</span>
              </li>
              <li className="flex items-center space-x-3 group">
                <Phone className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
                <a href="tel:+233242403450" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">+233 24 240 3450</a>
              </li>
              <li className="flex items-center space-x-3 group">
                <Mail className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
                <a href="mailto:cartlyhub@gmail.com" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors">cartlyhub@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">
            © {currentYear} CartlyHub Ghana. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <img src="/paystack.png" alt="Paystack" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" />
            <div className="flex space-x-2">
               <div className="w-8 h-5 bg-gray-50 rounded border border-gray-100 flex items-center justify-center">
                  <span className="text-[6px] font-black uppercase text-gray-400 tracking-tighter">VISA</span>
               </div>
               <div className="w-8 h-5 bg-gray-50 rounded border border-gray-100 flex items-center justify-center">
                  <span className="text-[6px] font-black uppercase text-gray-400 tracking-tighter">MC</span>
               </div>
               <div className="w-8 h-5 bg-gray-50 rounded border border-gray-100 flex items-center justify-center">
                  <span className="text-[6px] font-black uppercase text-gray-400 tracking-tighter">MOMO</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
