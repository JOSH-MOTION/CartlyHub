"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Store,
  Phone,
  Mail,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  Image as ImageIcon,
  Palette,
  X,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import SellingPreferences from "@/components/marketplace/SellingPreferences";
import { SELLING_MODES } from "@/services/marketplace/constants";
import { apiFetch } from "@/utils/apiClient";

export default function SellerSettingsPage() {
  const { sellerProfile, user, refreshSellerProfile } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [countryCode, setCountryCode] = useState("+233");

  // Selling preferences are saved separately from the store profile because
  // they go through the API, which re-validates the mode/number pairing.
  const [preferences, setPreferences] = useState({
    sellingMode: sellerProfile?.sellingMode || SELLING_MODES.BOTH,
    whatsappNumber: sellerProfile?.whatsappNumber || "",
  });

  const [form, setForm] = useState({
    storeName: sellerProfile?.storeName || "",
    ownerName: sellerProfile?.ownerName || "",
    description: sellerProfile?.description || "",
    contactPhone: sellerProfile?.contactPhone || "",
    whatsappNumber: sellerProfile?.whatsappNumber || "",
    contactEmail: sellerProfile?.contactEmail || "",
    region: sellerProfile?.region || "",
    location: sellerProfile?.location || "",
    storeLogo: sellerProfile?.storeLogo || "",
    storeBannerImage: sellerProfile?.storeBannerImage || "",
    storeAccentColor: sellerProfile?.storeAccentColor || "#111827",
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  useEffect(() => {
    if (sellerProfile) {
      setForm({
        storeName: sellerProfile.storeName || "",
        ownerName: sellerProfile.ownerName || "",
        description: sellerProfile.description || "",
        contactPhone: sellerProfile.contactPhone || "",
        whatsappNumber: sellerProfile.whatsappNumber || "",
        contactEmail: sellerProfile.contactEmail || "",
        region: sellerProfile.region || "",
        location: sellerProfile.location || "",
        storeLogo: sellerProfile.storeLogo || "",
        storeBannerImage: sellerProfile.storeBannerImage || "",
        storeAccentColor: sellerProfile.storeAccentColor || "#111827",
      });
      setPreferences({
        sellingMode: sellerProfile.sellingMode || SELLING_MODES.BOTH,
        whatsappNumber: sellerProfile.whatsappNumber || "",
      });
    }
  }, [sellerProfile]);

  const uploadToCloudinary = async (file) => {
    const MAX_FILE_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image too large. Please upload a file smaller than 3MB.");
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "eccomerce");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dlng6dqtl"}/image/upload`,
      { method: "POST", body: formData },
    );

    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.secure_url;
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) setForm((prev) => ({ ...prev, storeLogo: url }));
    } catch {
      toast.error("Logo upload failed");
    } finally {
      setIsUploadingLogo(false);
      e.target.value = null;
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) setForm((prev) => ({ ...prev, storeBannerImage: url }));
    } catch {
      toast.error("Banner upload failed");
    } finally {
      setIsUploadingBanner(false);
      e.target.value = null;
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      // A stored number is already in international form; a freshly typed
      // local number still needs its country code.
      const number = preferences.whatsappNumber?.trim() || "";
      const whatsappNumber =
        number && !number.startsWith("+") && !number.startsWith("233") && !number.startsWith("234")
          ? `${countryCode}${number.replace(/^0+/, "")}`
          : number;

      await apiFetch("/api/vendor/preferences", {
        method: "PUT",
        body: { sellingMode: preferences.sellingMode, whatsappNumber },
      });

      await refreshSellerProfile?.();
      toast.success("Selling preferences updated");
    } catch (error) {
      toast.error(error.message || "Could not update selling preferences");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const GHANA_REGIONS = [
    "Greater Accra", "Ashanti", "Central", "Eastern", "Western", 
    "Northern", "Volta", "Upper East", "Upper West", "Bono", 
    "Bono East", "Ahafo", "Savannah", "North East", "Oti", "Western North"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.storeName || !form.ownerName || !form.contactPhone) {
      toast.error("Required fields missing");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update seller profile. The WhatsApp number is owned by the
      // Selling & Payment Preferences card above, so it is not written here.
      const { whatsappNumber: _managedSeparately, ...profileFields } = form;
      const sellerRef = doc(db, "sellers", user.id);
      await updateDoc(sellerRef, {
        ...profileFields,
        updatedAt: Timestamp.now(),
      });

      // 2. Query and update all products belonging to this seller
      const productsQuery = query(collection(db, "products"), where("sellerId", "==", user.id));
      const productsSnap = await getDocs(productsQuery);
      const productPromises = productsSnap.docs.map((docSnap) => 
        updateDoc(docSnap.ref, {
          sellerName: form.storeName,
          sellerPhone: form.contactPhone,
          sellerEmail: form.contactEmail || "",
          region: form.region,
          location: form.location
        })
      );

      // 3. Query and update all reviews referencing this seller
      const reviewsQuery = query(collection(db, "reviews"), where("sellerId", "==", user.id));
      const reviewsSnap = await getDocs(reviewsQuery);
      const reviewPromises = reviewsSnap.docs.map((docSnap) =>
        updateDoc(docSnap.ref, {
          sellerName: form.storeName
        })
      );

      await Promise.all([...productPromises, ...reviewPromises]);

      toast.success("Store profile and linked records updated!");
    } catch (error) {
      console.error("Error updating profile and linked records:", error);
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
        <h1 className="text-2xl font-black tracking-tighter uppercase">
          Settings
        </h1>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <SellingPreferences
          value={preferences.sellingMode}
          onChange={(sellingMode) => setPreferences({ ...preferences, sellingMode })}
          whatsappNumber={preferences.whatsappNumber}
          onWhatsappNumberChange={(whatsappNumber) =>
            setPreferences({ ...preferences, whatsappNumber })
          }
          countryCode={countryCode}
          onCountryCodeChange={setCountryCode}
          disabled={isSavingPreferences}
        />

        <button
          type="button"
          onClick={handleSavePreferences}
          disabled={isSavingPreferences}
          className="w-full md:w-auto bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSavingPreferences ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save selling preferences</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
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
                  <User className="h-3 w-3" />
                  <span>Owner Name *</span>
                </label>
                <input
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
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

            <div className="grid md:grid-cols-2 gap-8">
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
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span>Region *</span>
                </label>
                <select
                  className="w-full px-5 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none font-bold transition-all appearance-none text-sm"
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
                  className="w-full px-5 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. East Legon"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                <FileText className="h-3 w-3" />
                <span>Store Description</span>
              </label>
              <textarea
                className="w-full px-5 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none font-bold h-24 resize-none text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-4 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Store Branding
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                    <ImageIcon className="h-3 w-3" />
                    <span>Store Logo</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {form.storeLogo ? (
                      <div className="relative h-16 w-16 shrink-0">
                        <img
                          src={form.storeLogo}
                          alt="Store logo"
                          className="h-16 w-16 rounded-2xl object-cover border border-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, storeLogo: "" })}
                          className="absolute -top-2 -right-2 h-6 w-6 bg-black text-white rounded-full flex items-center justify-center"
                          aria-label="Remove logo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center shrink-0">
                        <ImageIcon className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors">
                      {isUploadingLogo ? "Uploading…" : "Upload logo"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                    <Palette className="h-3 w-3" />
                    <span>Accent Color</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.storeAccentColor}
                      onChange={(e) => setForm({ ...form, storeAccentColor: e.target.value })}
                      className="h-11 w-14 rounded-lg border border-gray-100 cursor-pointer shrink-0"
                    />
                    <input
                      value={form.storeAccentColor}
                      onChange={(e) => setForm({ ...form, storeAccentColor: e.target.value })}
                      className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-2">
                  <ImageIcon className="h-3 w-3" />
                  <span>Store Banner</span>
                </label>
                {form.storeBannerImage ? (
                  <div className="relative">
                    <img
                      src={form.storeBannerImage}
                      alt="Store banner"
                      className="w-full h-32 rounded-2xl object-cover border border-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, storeBannerImage: "" })}
                      className="absolute top-3 right-3 h-8 w-8 bg-black/70 text-white rounded-full flex items-center justify-center"
                      aria-label="Remove banner"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-32 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors">
                    {isUploadingBanner ? "Uploading…" : "Upload a wide banner image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={isUploadingBanner} />
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /><span>Save Changes</span></>}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <section className={`p-6 rounded-2xl border ${sellerProfile?.isVerified ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"} space-y-3`}>
             <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${sellerProfile?.isVerified ? "bg-green-500 text-white" : "bg-orange-500 text-white"}`}>
                {sellerProfile?.isVerified ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
             </div>
             <div>
                <h4 className={`text-xs font-black uppercase tracking-tight ${sellerProfile?.isVerified ? "text-green-900" : "text-orange-900"}`}>
                  {sellerProfile?.isVerified ? "Verified Account" : "Verification Pending"}
                </h4>
                <p className={`text-[10px] mt-1 font-medium leading-relaxed ${sellerProfile?.isVerified ? "text-green-700" : "text-orange-700"}`}>
                  {sellerProfile?.isVerified 
                    ? "Your store is verified! You have a trust badge on your profile and products." 
                    : "Your store is currently pending verification. Contact the admin to get your trust badge."}
                </p>
             </div>
          </section>

          <section className="bg-gray-900 p-6 rounded-2xl text-white space-y-3">
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Public Storefront</h3>
             <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
               View how customers see your store profile.
             </p>
             <button
              onClick={() => window.open(`/store/${encodeURIComponent(sellerProfile?.storeName)}`, "_blank")}
              className="w-full bg-white text-black py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-gray-100 transition-all"
             >
               View Public Page
             </button>
          </section>
        </div>
      </div>
    </div>
  );
}
