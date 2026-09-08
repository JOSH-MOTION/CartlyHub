"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { apiFetch } from "@/utils/apiClient";

export const MAX_ACTIVE_STATUSES = 5;

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
  return { url: data.secure_url, publicId: data.public_id };
};

/** Shared post-a-status form — used on the full seller Status page and in the homepage quick-post popup. */
export default function StatusComposer({ activeCount = 0, onPosted }) {
  const [caption, setCaption] = useState("");
  const [price, setPrice] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  if (activeCount >= MAX_ACTIVE_STATUSES) {
    return (
      <p className="text-xs text-gray-500 font-bold">
        You've hit the {MAX_ACTIVE_STATUSES}-active limit — delete one or wait for one to expire.
      </p>
    );
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file);
      if (uploaded) setPendingImage(uploaded);
    } catch {
      toast.error("Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePost = async () => {
    if (!pendingImage) {
      toast.error("Add a photo first");
      return;
    }
    setIsPosting(true);
    try {
      const result = await apiFetch("/api/seller/status", {
        method: "POST",
        body: {
          image: pendingImage.url,
          imagePublicId: pendingImage.publicId,
          caption: caption.trim(),
          price: price ? Number(price) : null,
        },
      });
      toast.success("Status posted — live on the homepage for 24 hours");
      setPendingImage(null);
      setCaption("");
      setPrice("");
      onPosted?.(result);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      {pendingImage ? (
        <div className="relative w-full h-48">
          <img src={pendingImage.url} alt="" className="w-full h-full object-cover rounded-2xl border border-gray-100" />
          <button
            onClick={() => setPendingImage(null)}
            className="absolute top-3 right-3 h-8 w-8 bg-black/70 text-white rounded-full flex items-center justify-center"
            aria-label="Remove photo"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-48 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-200 rounded-2xl text-gray-400 transition-colors gap-2">
          <ImageIcon className="h-6 w-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isUploading ? "Uploading…" : "Add a photo"}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isUploading} />
        </label>
      )}

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="What's the deal? e.g. 'Just got these in — 3 left, DM to grab one'"
        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none font-bold text-sm resize-none h-20"
      />

      <input
        type="number"
        min="0"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price (GHS) — optional"
        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-black outline-none font-bold text-sm"
      />

      <button
        onClick={handlePost}
        disabled={isPosting || isUploading || !pendingImage}
        className="w-full bg-black text-white hover:bg-gray-800 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" />
        {isPosting ? "Posting…" : "Post status"}
      </button>
    </div>
  );
}
