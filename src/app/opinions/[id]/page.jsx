"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import {
  Star,
  User,
  MessageCircle,
  ArrowLeft,
  ShieldCheck,
  Zap,
  MapPin,
} from "lucide-react";
import { getSeller, getSellerReviews, submitReview } from "@/utils/firebaseData";
import { getTimeOnPlatform } from "@/utils/helpers";
import Link from "next/link";
import { toast } from "sonner";

export default function OpinionsPage({ params }) {
  const { id: sellerId } = params;
  const queryClient = useQueryClient();
  const [newOpinion, setNewOpinion] = useState({ rating: 5, comment: "", name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: seller, isLoading: sellerLoading } = useQuery({
    queryKey: ["seller", sellerId],
    queryFn: () => getSeller(sellerId),
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", "seller", seller?.storeName],
    queryFn: () => getSellerReviews(seller?.storeName),
    enabled: !!seller?.storeName,
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 5.0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newOpinion.name || !newOpinion.comment) {
      toast.error("Please provide your name and opinion");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReview({
        sellerName: seller?.storeName,
        sellerId: sellerId,
        rating: newOpinion.rating,
        comment: newOpinion.comment,
        name: newOpinion.name,
        type: "seller_opinion"
      });
      setNewOpinion({ rating: 5, comment: "", name: "" });
      queryClient.invalidateQueries(["reviews", "seller", seller?.storeName]);
      toast.success("Thank you for your feedback!");
    } catch (error) {
      toast.error("Failed to post opinion");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sellerLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-40 px-4">
           <div className="animate-pulse space-y-8">
              <div className="h-12 bg-gray-100 w-1/3 rounded-xl"></div>
              <div className="h-48 bg-gray-50 rounded-3xl"></div>
              <div className="space-y-4">
                 {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-50 rounded-2xl"></div>)}
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-40 px-4 text-center">
           <h1 className="text-2xl font-black uppercase">Seller not found</h1>
           <Link href="/" className="mt-4 inline-block text-emerald-600 font-bold uppercase tracking-widest underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans pb-24">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-32">
        {/* Header */}
        <div className="mb-12">
           <Link href={`/store/${encodeURIComponent(seller.storeName)}`} className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black mb-8 transition-colors">
              <ArrowLeft className="h-3 w-3 mr-2" />
              Back to Store
           </Link>
           
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-gray-50 p-10 rounded-[3rem] border border-gray-100">
              <div className="flex items-center space-x-6">
                 <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white text-3xl font-black">
                    {seller.storeName?.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">{seller.storeName}</h1>
                    <div className="flex flex-wrap items-center gap-4">
                       <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Verified Seller
                       </span>
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {getTimeOnPlatform(seller.createdAt)}
                       </span>
                    </div>
                 </div>
              </div>
              <div className="text-center md:text-right">
                 <div className="text-4xl font-black">{averageRating.toFixed(1)}</div>
                 <div className="flex text-yellow-400 justify-center md:justify-end my-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`h-4 w-4 ${s <= averageRating ? 'fill-current' : 'text-gray-200'}`} />
                    ))}
                 </div>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{reviews.length} Opinions</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           {/* Left: Opinion Form */}
           <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-8">
                 <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Leave an Opinion</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                       <div>
                          <div className="flex gap-2 mb-4">
                             {[1, 2, 3, 4, 5].map(s => (
                               <button 
                                 key={s} 
                                 type="button" 
                                 onClick={() => setNewOpinion({ ...newOpinion, rating: s })}
                                 className={`p-2 rounded-xl transition-all ${newOpinion.rating >= s ? 'text-yellow-400 bg-yellow-50' : 'text-gray-200 bg-gray-50'}`}
                               >
                                 <Star className="h-6 w-6 fill-current" />
                               </button>
                             ))}
                          </div>
                       </div>
                       <input 
                         type="text" 
                         placeholder="Your Name" 
                         className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-5 text-sm font-bold outline-none transition-all"
                         value={newOpinion.name}
                         onChange={(e) => setNewOpinion({ ...newOpinion, name: e.target.value })}
                       />
                       <textarea 
                         placeholder="What's your experience with this seller?" 
                         className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl p-5 text-sm font-bold outline-none transition-all min-h-[150px] resize-none"
                         value={newOpinion.comment}
                         onChange={(e) => setNewOpinion({ ...newOpinion, comment: e.target.value })}
                       />
                       <button 
                         type="submit" 
                         disabled={isSubmitting}
                         className="w-full bg-black text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
                       >
                         Post Opinion
                       </button>
                    </form>
                 </div>
                 
                 <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100">
                    <h4 className="text-[10px] font-black uppercase text-emerald-800 tracking-widest mb-4">Why leave feedback?</h4>
                    <p className="text-[10px] font-bold text-emerald-700/70 uppercase leading-relaxed tracking-tight">Your reviews help other buyers make informed decisions and reward great sellers for their service.</p>
                 </div>
              </div>
           </div>

           {/* Right: Opinions List */}
           <div className="lg:col-span-2 space-y-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center">
                 <MessageCircle className="h-6 w-6 mr-3" />
                 Recent Opinions
              </h2>
              
              {reviewsLoading ? (
                <div className="space-y-6">
                   {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-50 rounded-3xl animate-pulse"></div>)}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                   {reviews.map((opinion, idx) => (
                     <div key={opinion.id || idx} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-6">
                           <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                                 <User className="h-6 w-6 text-gray-300" />
                              </div>
                              <div>
                                 <h4 className="text-sm font-black uppercase tracking-widest">{opinion.name || "Anonymous User"}</h4>
                                 <div className="flex text-yellow-400 mt-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                      <Star key={s} className={`h-3 w-3 ${s <= opinion.rating ? 'fill-current' : 'text-gray-200'}`} />
                                    ))}
                                 </div>
                              </div>
                           </div>
                           <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">
                              {opinion.createdAt?.toDate ? 
                                new Date(opinion.createdAt.toDate()).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' }) : 
                                "Recently"}
                           </span>
                        </div>
                        <p className="text-gray-600 font-medium leading-relaxed">{opinion.comment}</p>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <MessageCircle className="h-8 w-8 text-gray-300" />
                   </div>
                   <h3 className="text-lg font-black uppercase text-gray-400 tracking-widest">No opinions yet</h3>
                   <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Be the first to share your experience!</p>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}
