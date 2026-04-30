"use client";

import { categories } from "../utils/categories";

export default function MobileCategoryCircles({ selectedCategory, setSelectedCategory }) {
  // Find which main category is currently "active" (either selected or a parent of selected)
  const activeMainCat = categories.find(c => 
    c.id === selectedCategory || 
    c.subcategories.some(s => s.id === selectedCategory || s.subcategories?.some(l => l.id === selectedCategory))
  );

  return (
    <div className="flex flex-col space-y-6 mb-10 md:hidden -mx-4">
      {/* Main Categories Row */}
      <div className="flex overflow-x-auto pb-2 scrollbar-hide px-4 gap-5">
        {categories.map((cat) => {
          const isActive = activeMainCat?.id === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? "all" : cat.id)}
              className="flex flex-col items-center flex-shrink-0 space-y-2 group"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all border-2 relative ${
                isActive 
                  ? "bg-white border-emerald-500 shadow-xl shadow-emerald-100 scale-110 z-10" 
                  : "bg-white border-gray-100 group-hover:border-gray-200"
              }`}>
                {cat.icon}
                {isActive && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  </span>
                )}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest text-center max-w-[65px] leading-tight transition-colors ${
                isActive ? "text-emerald-600" : "text-gray-400"
              }`}>
                {cat.name.split(' & ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subcategories Row - Appears when a main category is active */}
      {activeMainCat && activeMainCat.subcategories.length > 0 && (
        <div className="flex overflow-x-auto pb-2 scrollbar-hide px-4 gap-2 animate-in slide-in-from-left-8 duration-500 ease-out">
          {activeMainCat.subcategories.map((sub) => {
            const isSubActive = selectedCategory === sub.id || sub.subcategories?.some(l => l.id === selectedCategory);
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedCategory(sub.id)}
                className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                  isSubActive 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
                    : "bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100"
                }`}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
