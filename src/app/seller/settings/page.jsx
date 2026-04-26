"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { 
  Store, 
  Phone, 
  Mail, 
  FileText, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";

export default function SellerSettingsPage() {
  const { sellerProfile, user } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    storeName: sellerProfile?.storeName || "",
    description: sellerProfile?.description || "",
    contactPhone: sellerProfile?.contactPhone || "",
    contactEmail: sellerProfile?.contactEmail || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.storeName || !form.contactPhone) {
      toast.error("Required fields missing");
      return;
    }

    setIsSubmitting(true);
    try {
      const sellerRef = doc(db, "sellers", user.id);
      await updateDoc(sellerRef, {
        ...form,
        updatedAt: Timestamp.now(),
      });
      toast.success("Store profile updated!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 max-w-4xl">
      <header>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
          Store Configuration
        </span>
        <h1 className="text-4xl font-black tracking-tighter uppercase">
          Settings
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                  <Store className="h-3 w-3" />
                  <span>Store Name *</span>
                </label>
                <input
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                  <Phone className="h-3 w-3" />
                  <span>Contact Phone *</span>
                </label>
                <input
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                <Mail className="h-3 w-3" />
                <span>Contact Email</span>
              </label>
              <input
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                <FileText className="h-3 w-3" />
                <span>Store Description</span>
              </label>
              <textarea
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold h-32 resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /><span>Save Changes</span></>}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <section className={`p-8 rounded-[2.5rem] border ${sellerProfile?.isVerified ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"} space-y-4`}>
             <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${sellerProfile?.isVerified ? "bg-green-500 text-white" : "bg-orange-500 text-white"}`}>
                {sellerProfile?.isVerified ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
             </div>
             <div>
                <h4 className={`text-sm font-black uppercase tracking-tight ${sellerProfile?.isVerified ? "text-green-900" : "text-orange-900"}`}>
                  {sellerProfile?.isVerified ? "Verified Account" : "Verification Pending"}
                </h4>
                <p className={`text-xs mt-2 font-medium leading-relaxed ${sellerProfile?.isVerified ? "text-green-700" : "text-orange-700"}`}>
                  {sellerProfile?.isVerified 
                    ? "Your store is verified! You have a trust badge on your profile and products." 
                    : "Your store is currently pending verification. Contact the admin to get your trust badge."}
                </p>
             </div>
          </section>

          <section className="bg-gray-900 p-8 rounded-[2.5rem] text-white space-y-4">
             <h3 className="text-sm font-black uppercase tracking-widest">Public Storefront</h3>
             <p className="text-xs text-gray-400 font-medium leading-relaxed">
               View how customers see your store profile.
             </p>
             <button
              onClick={() => window.open(`/seller/${encodeURIComponent(sellerProfile?.storeName)}`, "_blank")}
              className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
             >
               View Public Page
             </button>
          </section>
        </div>
      </div>
    </div>
  );
}
