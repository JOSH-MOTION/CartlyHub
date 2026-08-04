"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { 
  Store, 
  Phone, 
  Mail, 
  FileText, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  User, 
  MapPin, 
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import SellingPreferences from "@/components/marketplace/SellingPreferences";
import { SELLING_MODES } from "@/services/marketplace/constants";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user, sellerProfile, activateSeller, isLoading } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [countryCode, setCountryCode] = useState("+233");

  const [form, setForm] = useState({
    ownerName: user?.name || "",
    storeName: "",
    description: "",
    contactPhone: "",
    whatsappNumber: "",
    contactEmail: user?.email || "",
    location: "",
    region: "",
    // Both is recommended: vendors get online payments and keep WhatsApp.
    sellingMode: SELLING_MODES.BOTH,
  });

  const GHANA_REGIONS = [
    "Greater Accra", "Ashanti", "Central", "Eastern", "Western", 
    "Northern", "Volta", "Upper East", "Upper West", "Bono", 
    "Bono East", "Ahafo", "Savannah", "North East", "Oti", "Western North"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <Navbar />
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 text-center space-y-6 max-w-md w-full">
          <div className="bg-gray-50 h-20 w-20 rounded-2xl flex items-center justify-center mx-auto">
            <Store className="h-8 w-8 text-black" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Login Required</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Access Seller Merchant Center</p>
          </div>
          <p className="text-gray-500 text-sm">Please sign in to your Cartly Hub account to set up your marketplace store.</p>
          <button
            onClick={() => router.push("/account/signin")}
            className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all shadow-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (sellerProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <Navbar />
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 text-center space-y-6 max-w-md w-full">
          <div className="bg-emerald-50 h-20 w-20 rounded-2xl flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="h-8 w-8 fill-current" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Active Merchant</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{sellerProfile.storeName}</p>
          </div>
          <p className="text-gray-500 text-sm">You are already registered. Click below to manage your products and views.</p>
          <button
            onClick={() => router.push("/seller")}
            className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
          >
            Enter Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.storeName || !form.contactPhone || !form.ownerName || !form.location || !form.region) {
      toast.error("Required fields missing");
      return;
    }

    setIsSubmitting(true);
    try {
      // activateSeller re-validates this pairing; sending the number in full
      // international form keeps the WhatsApp deep links working.
      const formattedWhatsapp = form.whatsappNumber
        ? `${countryCode}${form.whatsappNumber.replace(/^0+/, "")}`
        : "";

      await activateSeller({ ...form, whatsappNumber: formattedWhatsapp });
      toast.success("Store created successfully!");
      setStep(3); // Show success state
    } catch (error) {
      toast.error(error.message || "Failed to create store");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 pt-32 pb-20 flex flex-col justify-center">
        
        {/* Step Indicator */}
        {step < 3 && (
          <div className="flex items-center space-x-3 mb-10 w-fit mx-auto lg:mx-0 bg-white border border-gray-100 px-4 py-2 rounded-full shadow-sm">
            <span className={`h-2 w-2 rounded-full ${step >= 1 ? "bg-black" : "bg-gray-200"}`} />
            <span className={`h-2 w-2 rounded-full ${step >= 2 ? "bg-black" : "bg-gray-200"}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Step {step} of 2</span>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left Value Prop */}
            <div className="lg:col-span-5 bg-gradient-to-br from-gray-900 to-black text-white p-8 md:p-10 rounded-2xl shadow-xl flex flex-col justify-between border border-gray-800">
              <div className="space-y-8">
                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-yellow-400">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">Partner Program</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">Join Ghana's premier fashion and apparel marketplace. Scale your brand catalog and receive direct WhatsApp redirects.</p>
                </div>
              </div>

              <div className="space-y-4 mt-8 pt-8 border-t border-white/5">
                <div className="flex items-center space-x-3 text-xs font-bold uppercase tracking-wider text-gray-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Trusted Store Badge</span>
                </div>
                <div className="flex items-center space-x-3 text-xs font-bold uppercase tracking-wider text-gray-200">
                  <TrendingUp className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Reach Sales Analytics</span>
                </div>
                <div className="flex items-center space-x-3 text-xs font-bold uppercase tracking-wider text-gray-200">
                  <Globe className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Unlimited Listings</span>
                </div>
              </div>
            </div>

            {/* Right Welcome Action */}
            <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 block">Start Selling</span>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-gray-900 leading-tight">
                  Launch Your Store storefront
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Provide your store details to instantiate your merchant dashboard. Setting up takes less than 2 minutes.
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="flex items-center justify-between w-full bg-black text-white hover:bg-gray-800 p-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
              >
                <span>Instantiate Store Profile</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="font-black text-sm uppercase tracking-tight text-gray-900">Merchant Registration</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Please provide valid credentials</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                    <User className="h-3 w-3" />
                    <span>Owner Name *</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                    placeholder="E.g. Kojo Mensah"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                    <Store className="h-3 w-3" />
                    <span>Store Name *</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                    placeholder="E.g. Urban Threads GH"
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                    <MapPin className="h-3 w-3" />
                    <span>Region *</span>
                  </label>
                  <select
                    required
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold appearance-none text-sm"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                  >
                    <option value="">Select Region</option>
                    {GHANA_REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                    <MapPin className="h-3 w-3" />
                    <span>Location *</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                    placeholder="E.g. East Legon, Accra"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                    <Phone className="h-3 w-3" />
                    <span>Contact Phone *</span>
                  </label>
                  <input
                    required
                    type="tel"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                    placeholder="E.g. 0241234567"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  />
                </div>

              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                  <Mail className="h-3 w-3" />
                  <span>Public Store Email (Optional)</span>
                </label>
                <input
                  type="email"
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                  placeholder="hello@yourstore.com"
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
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold min-h-[100px] resize-none text-sm"
                  placeholder="Introduce your clothing brand, collections, and materials to customers..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm">
              <SellingPreferences
                value={form.sellingMode}
                onChange={(sellingMode) => setForm({ ...form, sellingMode })}
                countryCode={countryCode}
                onCountryCodeChange={setCountryCode}
                whatsappNumber={form.whatsappNumber}
                onWhatsappNumberChange={(whatsappNumber) =>
                  setForm({ ...form, whatsappNumber })
                }
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-gray-100 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Activate Store Profile</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-8 animate-in zoom-in duration-500 bg-black text-white p-8 md:p-12 rounded-2xl shadow-2xl max-w-xl mx-auto border border-gray-800">
            <div className="bg-white/10 h-20 w-20 rounded-2xl flex items-center justify-center mx-auto border border-white/10 text-white">
              <CheckCircle2 className="h-8 w-8 fill-current" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Registration Complete!</h2>
              <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">
                Your store <span className="text-white font-bold">{form.storeName}</span> is now active. Your dashboard review status is <span className="text-orange-400 font-bold">Pending Verification</span>.
              </p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                Our verification team is reviewing your details to assign your trust badge.
              </p>
            </div>
            <div className="flex flex-col space-y-3 max-w-xs mx-auto">
              <button
                onClick={() => router.push("/seller")}
                className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-gray-100 transition-all shadow-xl"
              >
                Enter Dashboard
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 text-gray-500 font-black uppercase tracking-widest text-[8px] hover:text-white transition-all"
              >
                Return to Shop
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
