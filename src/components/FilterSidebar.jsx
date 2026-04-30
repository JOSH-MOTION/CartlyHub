"use client";

import { useState, useEffect } from "react";
import { X, SlidersHorizontal, MapPin, Layers, RotateCcw, Check, ChevronRight, ChevronDown, DollarSign } from "lucide-react";

export default function FilterSidebar({ 
  isOpen, 
  onClose, 
  categories = [], 
  selectedCategory, 
  setSelectedCategory, 
  selectedRegion, 
  setSelectedRegion,
  priceRange,
  setPriceRange
}) {
  const [expandedSection, setExpandedSection] = useState(null); // 'category', 'region', or 'price'
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [localPriceRange, setLocalPriceRange] = useState({ min: "", max: "" });

  const GHANA_REGIONS = [
    "Greater Accra", "Ashanti", "Central", "Eastern", "Western", 
    "Northern", "Volta", "Upper East", "Upper West", "Bono", 
    "Bono East", "Ahafo", "Savannah", "North East", "Oti", "Western North"
  ];

  // Initialize local price range when props change
  useEffect(() => {
    if (priceRange) {
      setLocalPriceRange(priceRange);
    }
  }, [priceRange]);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedCategory("all");
    setSelectedRegion("all");
    setPriceRange({ min: "", max: "" });
    setLocalPriceRange({ min: "", max: "" });
  };

  const handlePriceRangeChange = (field, value) => {
    const newRange = { ...localPriceRange, [field]: value };
    setLocalPriceRange(newRange);
    setPriceRange(newRange);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleCatExpand = (id) => {
    const newSet = new Set(expandedCats);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCats(newSet);
  };

  const mainCategories = categories.filter(c => !c.parentId);
  const getSubcategories = (parentId) => categories.filter(c => c.parentId === parentId);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-500"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] transform transition-transform duration-500 ease-out border-r border-gray-100 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-black rounded-xl">
                <SlidersHorizontal className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Filter Items</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all duration-300 transform hover:rotate-90"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
            {/* Category Section */}
            <section className="border border-gray-100 rounded-[2rem] overflow-hidden transition-all duration-300">
              <button 
                onClick={() => toggleSection('category')}
                className={`w-full flex items-center justify-between p-6 transition-colors ${expandedSection === 'category' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}
              >
                <div className="flex items-center space-x-3">
                  <Layers className={`h-5 w-5 ${expandedSection === 'category' ? 'text-emerald-400' : 'text-emerald-500'}`} />
                  <span className="text-sm font-black uppercase tracking-widest">Categories</span>
                  {selectedCategory !== "all" && (
                     <span className="h-2 w-2 bg-emerald-500 rounded-full border border-white" />
                  )}
                </div>
                {expandedSection === 'category' ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              
              {expandedSection === 'category' && (
                <div className="p-4 flex flex-col gap-2 animate-in slide-in-from-top-4 duration-300">
                  <button
                    onClick={() => { setSelectedCategory("all"); }}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                      selectedCategory === "all"
                        ? "bg-gray-100 text-black shadow-sm"
                        : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <span>All Products</span>
                    {selectedCategory === "all" && <Check className="h-4 w-4 text-emerald-500" />}
                  </button>
                  
                  {mainCategories.map((cat) => {
                    const subCats = getSubcategories(cat.id);
                    const isExpanded = expandedCats.has(cat.id);
                    const isSelected = selectedCategory === cat.name || selectedCategory === cat.id;

                    return (
                      <div key={cat.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { 
                              setSelectedCategory(cat.id); // Switching to use ID for better matching
                            }}
                            className={`flex-1 flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                              selectedCategory === cat.id
                                ? "bg-gray-100 text-black shadow-sm"
                                : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                            }`}
                          >
                            <span>{cat.name}</span>
                            {selectedCategory === cat.id && <Check className="h-4 w-4 text-emerald-500" />}
                          </button>
                          {subCats.length > 0 && (
                            <button 
                              onClick={() => toggleCatExpand(cat.id)}
                              className={`p-4 rounded-2xl border border-gray-100 transition-all ${isExpanded ? "bg-black text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                        
                        {isExpanded && subCats.length > 0 && (
                          <div className="ml-4 pl-4 border-l-2 border-gray-100 flex flex-col gap-1 mt-1 animate-in slide-in-from-left-2 duration-300">
                            {subCats.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => setSelectedCategory(sub.id)}
                                className={`flex items-center justify-between px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                  selectedCategory === sub.id
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : "bg-white text-gray-400 hover:bg-gray-50 border border-transparent"
                                }`}
                              >
                                <span>{sub.name}</span>
                                {selectedCategory === sub.id && <Check className="h-3 w-3" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Region Section */}
            <section className="border border-gray-100 rounded-[2rem] overflow-hidden transition-all duration-300">
               <button 
                onClick={() => toggleSection('region')}
                className={`w-full flex items-center justify-between p-6 transition-colors ${expandedSection === 'region' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}
              >
                <div className="flex items-center space-x-3">
                  <MapPin className={`h-5 w-5 ${expandedSection === 'region' ? 'text-blue-400' : 'text-blue-500'}`} />
                  <span className="text-sm font-black uppercase tracking-widest">Region</span>
                  {selectedRegion !== "all" && (
                     <span className="h-2 w-2 bg-blue-500 rounded-full border border-white" />
                  )}
                </div>
                {expandedSection === 'region' ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              
              {expandedSection === 'region' && (
                <div className="p-4 grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto scrollbar-hide animate-in slide-in-from-top-4 duration-300">
                  <button
                    onClick={() => { setSelectedRegion("all"); toggleSection('region'); }}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                      selectedRegion === "all"
                        ? "bg-gray-100 text-black shadow-sm"
                        : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <span>Everywhere</span>
                    {selectedRegion === "all" && <Check className="h-4 w-4 text-blue-500" />}
                  </button>
                  {GHANA_REGIONS.map((region) => (
                    <button
                      key={region}
                      onClick={() => { setSelectedRegion(region); toggleSection('region'); }}
                      className={`flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                        selectedRegion === region
                          ? "bg-gray-100 text-black shadow-sm"
                          : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                      }`}
                    >
                      <span>{region}</span>
                      {selectedRegion === region && <Check className="h-4 w-4 text-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Price Range Section */}
            <section className="border border-gray-100 rounded-[2rem] overflow-hidden transition-all duration-300">
               <button 
                onClick={() => toggleSection('price')}
                className={`w-full flex items-center justify-between p-6 transition-colors ${expandedSection === 'price' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}
              >
                <div className="flex items-center space-x-3">
                  <DollarSign className={`h-5 w-5 ${expandedSection === 'price' ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  <span className="text-sm font-black uppercase tracking-widest">Price Range</span>
                  {(localPriceRange.min || localPriceRange.max) && (
                     <span className="h-2 w-2 bg-yellow-500 rounded-full border border-white" />
                  )}
                </div>
                {expandedSection === 'price' ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              
              {expandedSection === 'price' && (
                <div className="p-4 space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Minimum Price (GH¢)</label>
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={localPriceRange.min}
                        onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-black outline-none font-bold text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Maximum Price (GH¢)</label>
                      <input
                        type="number"
                        placeholder="No limit"
                        min="0"
                        value={localPriceRange.max}
                        onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-black outline-none font-bold text-sm transition-all"
                      />
                    </div>
                  </div>
                  {(localPriceRange.min || localPriceRange.max) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-700">
                        {localPriceRange.min && localPriceRange.max 
                          ? `GH¢ ${localPriceRange.min} - GH¢ ${localPriceRange.max}`
                          : localPriceRange.min 
                            ? `From GH¢ ${localPriceRange.min}`
                            : `Up to GH¢ ${localPriceRange.max}`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-gray-50 bg-gray-50/30 space-y-4">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black hover:bg-white transition-all border-2 border-transparent hover:border-gray-100"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset All Filters</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-5 bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-800 transition-all shadow-2xl shadow-black/20"
            >
              Apply Selection
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
