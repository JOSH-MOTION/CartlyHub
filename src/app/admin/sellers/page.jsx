"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllSellers } from "@/utils/firebaseData";
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
  const queryClient = useQueryClient();

  const { data: sellers, isLoading } = useQuery({
    queryKey: ["admin", "sellers"],
    queryFn: getAllSellers,
  });

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
              subject: 'Welcome to cartlyHub - Your Store is Verified!',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #000;">Welcome to cartlyHub, ${data.name || 'Partner'}!</h1>
                  <p>Great news! Your store <strong>${data.storeName}</strong> has been successfully verified by our administrative team.</p>
                  <p>You can now log in to your seller dashboard to start adding your premium products and reaching thousands of customers.</p>
                  <br/>
                  <a href="https://cartlyhub.com/seller" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
                  <br/><br/>
                  <p>Best regards,<br/>The cartlyHub Team</p>
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
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Store</th>
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
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">{seller.storeName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[200px]">{seller.description || "No description"}</p>
                      </div>
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
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => verifyMutation.mutate({
                        id: seller.id,
                        status: !seller.isVerified,
                        email: seller.contactEmail,
                        name: seller.ownerName || seller.storeName,
                        storeName: seller.storeName
                      })}
                      disabled={verifyMutation.isLoading}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${seller.isVerified
                          ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                          : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"
                        }`}
                    >
                      {seller.isVerified ? "Revoke" : "Verify Store"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
