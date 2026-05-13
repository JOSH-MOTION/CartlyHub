"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Loader2, Save, ArrowLeft, Tag, Image as ImageIcon, Type } from "lucide-react";

export default function ManagePromotions() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promotion, setPromotion] = useState({
    discount: "30%",
    title: "Today's Special!",
    description: "Get discount for every order, only valid for today",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=300&auto=format&fit=crop",
    isActive: true
  });

  useEffect(() => {
    fetchPromotion();
  }, []);

  const fetchPromotion = async () => {
    try {
      const docRef = doc(db, "settings", "promotions");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPromotion(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "promotions"), promotion);
      alert("Promotions updated successfully!");
    } catch (error) {
      console.error("Error saving promotions:", error);
      alert("Failed to update promotions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-400 hover:text-black transition-colors mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
            Manage Promotions
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Changes</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Editor Form */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Banner Content</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Discount Text (e.g. 30%)</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text"
                    value={promotion.discount}
                    onChange={(e) => setPromotion({...promotion, discount: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-black focus:ring-2 focus:ring-black outline-none"
                    placeholder="30%"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Promotion Title</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text"
                    value={promotion.title}
                    onChange={(e) => setPromotion({...promotion, title: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-black focus:ring-2 focus:ring-black outline-none"
                    placeholder="Today's Special!"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Description</label>
                <textarea 
                  value={promotion.description}
                  onChange={(e) => setPromotion({...promotion, description: e.target.value})}
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-black focus:ring-2 focus:ring-black outline-none h-32 resize-none"
                  placeholder="Get discount for every order..."
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Image URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text"
                    value={promotion.imageUrl}
                    onChange={(e) => setPromotion({...promotion, imageUrl: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-black focus:ring-2 focus:ring-black outline-none"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={() => setPromotion({...promotion, isActive: !promotion.isActive})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${promotion.isActive ? 'bg-black' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${promotion.isActive ? 'left-7' : 'left-1'}`} />
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-black">Active on Mobile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-8">
          <div className="sticky top-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 text-center">Mobile Live Preview</h2>
            <div className="max-w-[320px] mx-auto bg-white rounded-[3rem] border-[8px] border-black p-4 shadow-2xl">
              <div className="w-full h-2 bg-gray-100 rounded-full mb-8" />
              
              {promotion.isActive ? (
                <div className="bg-gray-100 rounded-[32px] overflow-hidden flex-row flex items-center p-4 h-[140px]">
                  <div className="flex-1 pr-2">
                    <p className="text-2xl font-black text-black">{promotion.discount}</p>
                    <p className="text-[10px] font-black text-black leading-tight mb-1">{promotion.title}</p>
                    <p className="text-gray-500 text-[6px] font-bold uppercase leading-relaxed line-clamp-2">{promotion.description}</p>
                  </div>
                  <img 
                    src={promotion.imageUrl}
                    className="w-20 h-full rounded-xl object-cover"
                    alt="Preview"
                  />
                </div>
              ) : (
                <div className="h-[140px] border-2 border-dashed border-gray-200 rounded-[32px] flex items-center justify-center">
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Promotion Inactive</p>
                </div>
              )}

              <div className="mt-8 space-y-4">
                <div className="h-4 w-2/3 bg-gray-50 rounded-full" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-gray-50 rounded-2xl" />
                  <div className="h-32 bg-gray-50 rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
