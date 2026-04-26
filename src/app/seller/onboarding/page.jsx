"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Store, Phone, Mail, FileText, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user, sellerProfile, activateSeller, isLoading } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    storeName: "",
    description: "",
    contactPhone: "",
    contactEmail: user?.email || "",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <Navbar />
        <div className="text-center space-y-6 max-w-md">
          <div className="bg-gray-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-8">
            <Store className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Login Required</h1>
          <p className="text-gray-500 font-medium">Please log in to your CarlyHub account to start your selling journey.</p>
          <button
            onClick={() => router.push("/account/signin")}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (sellerProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <Navbar />
        <div className="text-center space-y-6 max-w-md">
          <div className="bg-green-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Already a Seller</h1>
          <p className="text-gray-500 font-medium">You already have an active store: <span className="font-bold text-black">{sellerProfile.storeName}</span></p>
          <button
            onClick={() => router.push("/seller")}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
          >
            Go to Seller Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.storeName || !form.contactPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await activateSeller(form);
      toast.success("Store created successfully!");
      setStep(3); // Show success state
    } catch (error) {
      toast.error(error.message || "Failed to create store");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Phase 1: Multi-Vendor
          </span>
          <h1 className="text-6xl font-black tracking-tighter uppercase leading-[0.9]">
            Become a <br/> <span className="text-gray-300">CarlyHub</span> Seller
          </h1>
          <p className="mt-6 text-gray-500 max-w-lg font-medium">
            Join Ghana's premium marketplace. Reach thousands of customers and manage your business with our professional tools.
          </p>
        </div>

        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-50 p-10 rounded-[2.5rem] space-y-6">
              <div className="h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Professional Store</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Get a dedicated store page, custom branding, and professional inventory management tools.</p>
              <ul className="space-y-3">
                {['Unlimited Products', 'Sales Analytics', 'Direct Customer Contact', 'Order Management'].map((item) => (
                  <li key={item} className="flex items-center space-x-3 text-xs font-bold uppercase tracking-wider text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-black" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col justify-center space-y-8 p-6">
              <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase tracking-tighter">Ready to start?</h2>
                <p className="text-gray-400 font-medium">Setting up your store takes less than 2 minutes.</p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="flex items-center justify-between w-full bg-black text-white p-6 rounded-3xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-black/20"
              >
                <span>Setup My Store</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white border border-gray-100 p-10 rounded-[2.5rem] shadow-sm space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center space-x-2">
                    <Store className="h-3 w-3" />
                    <span>Store Name *</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold transition-all"
                    placeholder="E.g. Urban Threads Ghana"
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center space-x-2">
                    <Phone className="h-3 w-3" />
                    <span>Contact Phone *</span>
                  </label>
                  <input
                    required
                    type="tel"
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold transition-all"
                    placeholder="E.g. 0241234567"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center space-x-2">
                  <Mail className="h-3 w-3" />
                  <span>Public Contact Email (Optional)</span>
                </label>
                <input
                  type="email"
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold transition-all"
                  placeholder="hello@yourstore.com"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center space-x-2">
                  <FileText className="h-3 w-3" />
                  <span>Store Description</span>
                </label>
                <textarea
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold transition-all min-h-[120px] resize-none"
                  placeholder="Tell customers what makes your products special..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-100 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-black text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center space-x-3"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Activate Seller Profile</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-10 animate-in zoom-in duration-500 bg-black text-white p-20 rounded-[3rem] shadow-2xl">
            <div className="bg-white/10 h-32 w-32 rounded-full flex items-center justify-center mx-auto border-4 border-white/20">
              <CheckCircle2 className="h-16 w-16 text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black uppercase tracking-tighter">Welcome Aboard!</h2>
              <p className="text-gray-400 font-medium text-lg max-w-md mx-auto">
                Your store <span className="text-white font-bold">{form.storeName}</span> is now active. You can start uploading products immediately.
              </p>
            </div>
            <div className="flex flex-col space-y-4 max-w-sm mx-auto">
              <button
                onClick={() => router.push("/seller")}
                className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-100 transition-all shadow-xl"
              >
                Enter Seller Dashboard
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-xs hover:text-white transition-all"
              >
                Back to Marketplace
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
