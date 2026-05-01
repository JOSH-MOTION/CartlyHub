"use client";

import Navbar from "./Navbar";
import Footer from "./Footer";
import { ChevronRight } from "lucide-react";

export default function LegalContent({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-12">
            <a href="/" className="hover:text-black transition-colors">Home</a>
            <ChevronRight className="h-3 w-3" />
            <span className="text-black">{title}</span>
          </nav>

          {/* Header */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase mb-4">
              {title}
            </h1>
            {lastUpdated && (
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                Last Updated: {lastUpdated}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-sm prose-gray max-w-none 
            prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-black
            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:font-medium
            prose-li:text-gray-600 prose-li:font-medium
            prose-strong:text-black prose-strong:font-black
            space-y-12">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
