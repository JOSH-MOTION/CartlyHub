"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

/**
 * A thread's statusImage is a copied URL, not a copied file — once the
 * status expires and the daily cron deletes the real Cloudinary asset, that
 * URL 404s. Falls back to a plain placeholder instead of a broken image
 * icon; the thread's caption text (stored separately) still gives context
 * even once the photo itself is gone for good.
 */
export default function ThreadThumbnail({ src, className }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <ImageIcon className="h-4 w-4 text-gray-300" />
      </div>
    );
  }

  return <img src={src} alt="" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
