"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllSellers, getProducts } from "@/utils/firebaseData";
import { useRouter } from "next/navigation";
import {
  Store,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";

export default function AdminSellersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: sellers, isLoading: sellersLoading } = useQuery({
    queryKey: ["admin", "sellers"],
    queryFn: getAllSellers,
  });

  const { data: allProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["admin", "all-products-for-counts"],
    queryFn: () => getProducts(),
  });

  const isLoading = sellersLoading || productsLoading;

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, email, name, storeName }) => {
      const sellerRef = doc(db, "sellers", id);
      await updateDoc(sellerRef, {
        isVerified: status,
        updatedAt: Timestamp.now(),
      });
      return { status, email, name, storeName };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries(["admin", "sellers"]);
      toast.success("Seller status updated");

      if (data.status && data.email) {
        try {
          await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: data.email,
              subject: 'Welcome to the team - Your cartlyHub Store is Verified!',
              includeLogo: true,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px; overflow: hidden;">
                  <div style="background-color: #000; padding: 40px 20px; text-align: center;">
                    <img src="cid:logo" alt="cartlyHub" style="height: 40px; width: auto;" />
                  </div>
                  <div style="padding: 40px; text-align: center;">
                    <h2 style="color: #000; margin-bottom: 20px;">Welcome to the team!</h2>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                      cartlyHub welcomes you, <strong>${data.name || 'Partner'}</strong>! 
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                      Great news! Your store <strong>${data.storeName}</strong> has been successfully verified by our administrative team.
                    </p>
                    <br/>
                    <a href="https://cartlyhub.com/seller" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Go to Dashboard</a>
                    <br/><br/>
                    <p style="font-size: 12px; color: #aaa; margin-top: 40px;">
                      Best regards,<br/>
                      <strong>The cartlyHub Team</strong>
                    </p>
                  </div>
                </div>
              `
            })
          });
          toast.success("Welcome email sent to seller");
        } catch (err) {
          console.error("Failed to send welcome email:", err);
          toast.error("Status updated, but failed to send email");
        }
      }
    },
    onError: () => {
      toast.error("Failed to update seller status");
    }
  });

  return (
    <div className="space-y-12">
      <header>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
          User Management
        </span>
        <h1 className="text-4xl font-black tracking-tighter uppercase">
          Marketplace Sellers
        </h1>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-black" />
          </div>
        ) : sellers?.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Store</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Items</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Contact</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Joined</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Store className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="cursor-pointer group" onClick={() => router.push(`/admin/products?sellerId=${seller.id}`)}>
                            <p className="font-black text-sm uppercase tracking-tight group-hover:text-blue-600 transition-colors">{seller.storeName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[200px]">{seller.description || "No description"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div 
                          onClick={() => router.push(`/admin/products?sellerId=${seller.id}`)}
                          className="inline-flex flex-col items-center justify-center h-12 w-12 bg-gray-50 rounded-xl hover:bg-black hover:text-white transition-all cursor-pointer border border-gray-100"
                        >
                          <span className="text-sm font-black">{allProducts?.filter(p => p.sellerId === seller.id).length || 0}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Items</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 space-y-1">
                        <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <Mail className="h-3 w-3 mr-2" />
                          {seller.contactEmail}
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <Phone className="h-3 w-3 mr-2" />
                          {seller.contactPhone}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <Calendar className="h-3 w-3 mr-2 text-gray-300" />
                          {seller.createdAt?.toDate ? seller.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${seller.isVerified ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>
                          {seller.isVerified ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                          <span>{seller.isVerified ? "Verified" : "Pending"}</span>
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right space-x-3">
                        <button
                          onClick={() => router.push(`/admin/products?sellerId=${seller.id}`)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-700 transition-all shadow-lg shadow-black/10"
                        >
                          Products
                        </button>
                        <button
                          onClick={() => verifyMutation.mutate({
                            id: seller.id,
                            status: !seller.isVerified,
                            email: seller.contactEmail,
                            name: seller.ownerName || seller.storeName,
                            storeName: seller.storeName
                          })}
                          disabled={verifyMutation.isLoading}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${seller.isVerified
                              ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                              : "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200"
                            }`}
                        >
                          {seller.isVerified ? "Revoke Access" : "Verify & Approve"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-100">
              {sellers.map((seller) => (
                <div key={seller.id} className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <Store className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-tight">{seller.storeName}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${seller.isVerified ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>
                            {seller.isVerified ? <ShieldCheck className="h-2 w-2" /> : <ShieldAlert className="h-2 w-2" />}
                            <span>{seller.isVerified ? "Verified" : "Pending"}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-3 py-2 rounded-xl text-center min-w-[60px]">
                      <p className="text-sm font-black">{allProducts?.filter(p => p.sellerId === seller.id).length || 0}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Items</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Email</p>
                      <p className="text-[10px] font-bold text-gray-600 truncate">{seller.contactEmail}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Phone</p>
                      <p className="text-[10px] font-bold text-gray-600">{seller.contactPhone}</p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={() => verifyMutation.mutate({
                        id: seller.id,
                        status: !seller.isVerified,
                        email: seller.contactEmail,
                        name: seller.ownerName || seller.storeName,
                        storeName: seller.storeName
                      })}
                      disabled={verifyMutation.isLoading}
                      className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center space-x-2 ${seller.isVerified
                          ? "bg-red-50 text-red-600"
                          : "bg-green-600 text-white shadow-lg shadow-green-200"
                        }`}
                    >
                      {seller.isVerified ? "Revoke Access" : "Verify & Approve"}
                    </button>
                    <button
                      onClick={() => router.push(`/admin/products?sellerId=${seller.id}`)}
                      className="w-full py-4 bg-gray-50 text-gray-900 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center"
                    >
                      View Inventory
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-20 text-center space-y-4">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Store className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No independent sellers registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
