"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { categories } from "../utils/categories";
import CategoryIcon from "./CategoryIcon";

export default function HomeCategorySidebar({ selectedCategory, setSelectedCategory }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  return (
    <div className="relative group/sidebar w-full h-full flex flex-col" onMouseLeave={() => setHoveredCategory(null)}>
      {/* Main Categories List - Full Height Scrollable Pillar */}
      <div className="w-full bg-white border-r border-gray-100 flex flex-col h-full overflow-hidden">
        <div className="overflow-y-auto scrollbar-hide py-6 flex-grow">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-all duration-300 ${
                hoveredCategory?.id === cat.id ? "bg-emerald-50/80 text-emerald-700" : "text-gray-600 hover:bg-gray-50"
              } ${selectedCategory === cat.id ? "font-bold text-emerald-600 bg-emerald-50" : ""}`}
              onMouseEnter={() => setHoveredCategory(cat)}
            >
              <div className="flex items-center space-x-4">
                <CategoryIcon iconName={cat.icon} className={`h-5 w-5 transition-colors duration-300 ${hoveredCategory?.id === cat.id ? "text-emerald-500" : "text-gray-400"}`} />
                <span className="text-[13px] font-black uppercase tracking-widest leading-none">{cat.name}</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${hoveredCategory?.id === cat.id ? "translate-x-1 opacity-100" : "opacity-0"}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Mega Menu / Subcategories Popup */}
      {hoveredCategory && (
        <div 
          className="absolute left-full top-0 ml-4 w-[650px] min-h-[400px] bg-white border border-gray-100 rounded-3xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] z-[100] p-10 animate-in fade-in slide-in-from-left-4 duration-300 backdrop-blur-xl bg-white/95"
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-50">
               <CategoryIcon iconName={hoveredCategory.icon} className="h-10 w-10 text-emerald-500" />
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900">{hoveredCategory.name}</h2>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Explore {hoveredCategory.subcategories.length} Categories</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-10 overflow-y-auto max-h-[60vh] scrollbar-hide pr-4">
              {hoveredCategory.subcategories.map((sub) => (
                <div key={sub.id} className="space-y-5 group/sub">
                  <h3 
                    className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-emerald-600 transition-colors flex items-center group-hover/sub:text-gray-900"
                    onClick={() => {
                      setSelectedCategory(sub.id);
                      setHoveredCategory(null);
                    }}
                  >
                    {sub.name}
                    <ChevronRight className="h-3 w-3 ml-2 opacity-0 -translate-x-2 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 transition-all" />
                  </h3>
                  <div className="flex flex-col space-y-3">
                    {sub.subcategories?.map((leaf) => (
                      <button
                        key={leaf.id}
                        onClick={() => {
                          setSelectedCategory(leaf.id);
                          setHoveredCategory(null);
                        }}
                        className="text-sm font-medium text-gray-500 hover:text-emerald-600 text-left transition-all hover:translate-x-1 flex items-center"
                      >
                        <span className="w-1 h-1 bg-gray-200 rounded-full mr-3 group-hover:bg-emerald-500 transition-colors" />
                        {leaf.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-gray-50">
               <button 
                onClick={() => { setSelectedCategory(hoveredCategory.id); setHoveredCategory(null); }}
                className="w-full py-4 bg-gray-50 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all border border-gray-100"
               >
                 View All {hoveredCategory.name}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
