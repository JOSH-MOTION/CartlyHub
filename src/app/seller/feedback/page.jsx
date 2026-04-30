"use client";

import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { getSellerReviews } from "@/utils/firebaseData";
import { 
  Star, 
  MessageCircle, 
  User, 
  TrendingUp, 
  Award,
  Loader2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function SellerFeedbackPage() {
  const { sellerProfile } = useApp();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", "seller", sellerProfile?.storeName],
    queryFn: () => getSellerReviews(sellerProfile?.storeName),
    enabled: !!sellerProfile?.storeName,
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl">
      <header className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Reputation Management
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            Customer Feedback
          </h1>
        </div>
        <Link 
          href={`/opinions/${sellerProfile?.uid}`}
          className="flex items-center space-x-3 bg-gray-50 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm group"
        >
          <span>View Public Page</span>
          <ExternalLink className="h-3 w-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </Link>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Average Rating</p>
            <h3 className="text-3xl font-black">{averageRating.toFixed(1)}</h3>
            <div className="flex text-yellow-400 mt-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-3 w-3 ${s <= averageRating ? 'fill-current' : 'text-gray-200'}`} />
              ))}
            </div>
          </div>
          <div className="h-14 w-14 bg-yellow-50 rounded-2xl flex items-center justify-center">
            <Award className="h-6 w-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Opinions</p>
            <h3 className="text-3xl font-black">{reviews.length}</h3>
            <p className="text-[10px] font-bold text-emerald-600 uppercase mt-2">Verified Customers</p>
          </div>
          <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-xl text-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Seller Rank</p>
            <h3 className="text-2xl font-black uppercase tracking-tight">Pro Seller</h3>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-black uppercase text-emerald-400">Top 5% this month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Opinions List */}
      <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-black uppercase tracking-tight">Recent Customer Opinions</h2>
        </div>
        
        <div className="divide-y divide-gray-50">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="p-8 hover:bg-gray-50/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest">{review.name || "Anonymous Buyer"}</h4>
                      <div className="flex text-yellow-400 mt-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-2.5 w-2.5 ${s <= review.rating ? 'fill-current' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">
                    {review.createdAt?.toDate ? 
                      new Date(review.createdAt.toDate()).toLocaleDateString() : 
                      "Recently"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50">
                  {review.comment}
                </p>
              </div>
            ))
          ) : (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-10 w-10 text-gray-200" />
              </div>
              <h3 className="text-lg font-black uppercase text-gray-400 tracking-widest">No feedback yet</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Sell more products to start receiving opinions!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
