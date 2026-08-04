"use client";

import { Star, MessageSquare, ShieldCheck } from "lucide-react";
import Link from "next/link";

/**
 * Public reviews.
 *
 * Shown to everyone, signed in or not — the whole point is that a shopper can
 * read what other buyers said before deciding. Nothing here is gated.
 */

const Stars = ({ rating, size = "h-4 w-4" }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`${size} ${
          star <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"
        }`}
      />
    ))}
  </span>
);

const initials = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

export default function ReviewsSection({ reviews = [], sellerId, sellerName, limit = 6 }) {
  const count = reviews.length;
  const average = count
    ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / count
    : 0;

  // How many of each star rating, for the distribution bars.
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => Math.round(Number(review.rating) || 0) === star).length,
  }));

  const visible = [...reviews]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, limit);

  return (
    <section className="mt-20 pt-20 border-t border-gray-100">
      <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center">
        <span className="w-12 h-[2px] bg-black mr-4" />
        Customer Feedback
      </h3>

      {count === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center space-y-3">
          <MessageSquare className="h-7 w-7 text-gray-300 mx-auto" />
          <p className="text-sm font-black uppercase tracking-tight text-gray-700">
            No feedback yet
          </p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Be the first to share your experience with {sellerName || "this seller"} — it helps
            other shoppers decide.
          </p>
          {sellerId && (
            <Link
              href={`/opinions/${sellerId}`}
              className="inline-block bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest mt-2"
            >
              Leave feedback
            </Link>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Summary */}
          <div className="bg-gray-50 rounded-2xl p-8 h-fit">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter">{average.toFixed(1)}</span>
              <span className="text-sm font-bold text-gray-400">/ 5</span>
            </div>
            <div className="mt-3">
              <Stars rating={average} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-3">
              {count} review{count === 1 ? "" : "s"}
            </p>

            <div className="mt-6 space-y-2">
              {distribution.map((row) => (
                <div key={row.star} className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 w-3">{row.star}</span>
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${count ? (row.count / count) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 w-5 text-right">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>

            {sellerId && (
              <Link
                href={`/opinions/${sellerId}`}
                className="mt-6 block text-center bg-black text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Leave feedback
              </Link>
            )}
          </div>

          {/* The reviews themselves */}
          <div className="lg:col-span-2 space-y-4">
            {visible.map((review, index) => (
              <article
                key={review.id || index}
                className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-[11px] font-black shrink-0">
                      {initials(review.userName || review.customerName || review.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate">
                        {review.userName || review.customerName || review.name || "Customer"}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </p>
                    </div>
                  </div>
                  <Stars rating={Number(review.rating) || 0} size="h-3.5 w-3.5" />
                </div>

                {(review.comment || review.message) && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {review.comment || review.message}
                  </p>
                )}

                {review.verifiedPurchase && (
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    Verified purchase
                  </span>
                )}
              </article>
            ))}

            {count > visible.length && sellerId && (
              <Link
                href={`/opinions/${sellerId}`}
                className="block text-center py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                Read all {count} reviews
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
