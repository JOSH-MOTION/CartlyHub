"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllSellers } from "@/utils/firebaseData";
import { useRouter } from "next/navigation";
import { 
  Phone, 
  Mail, 
  Copy, 
  Check, 
  Search, 
  ArrowLeft, 
  MessageSquare,
  Users,
  Store
} from "lucide-react";
import { toast } from "sonner";

export default function SellerContactsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedType, setCopiedType] = useState(null); // 'phones', 'emails', or ID

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["admin", "sellers"],
    queryFn: getAllSellers,
  });

  const phonesList = sellers
    .map(s => s.contactPhone?.trim())
    .filter(p => p && p !== "N/A" && p !== "")
    .join(", ");

  const emailsList = sellers
    .map(s => s.contactEmail?.trim())
    .filter(e => e && e !== "N/A" && e.includes("@"))
    .join(", ");

  const filteredSellers = sellers.filter(seller => {
    const term = searchTerm.toLowerCase();
    return (
      seller.storeName?.toLowerCase().includes(term) ||
      seller.ownerName?.toLowerCase().includes(term) ||
      seller.contactEmail?.toLowerCase().includes(term) ||
      seller.contactPhone?.toLowerCase().includes(term)
    );
  });

  const handleCopyText = (text, typeId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(typeId);
    toast.success("Copied successfully!");
    setTimeout(() => setCopiedType(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Header */}
      <header className="flex items-center space-x-4">
        <button 
          onClick={() => router.push('/admin/sellers')}
          className="h-10 w-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-1 block">
            Communications
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">
            Seller Contacts & Broadcast
          </h1>
        </div>
      </header>

      {/* Broadcast Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bulk SMS Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-tight text-gray-900">Bulk SMS List</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Comma-separated phone numbers</p>
              </div>
            </div>
            <button
              onClick={() => handleCopyText(phonesList, "phones")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                copiedType === "phones"
                  ? "bg-emerald-500 text-white"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              {copiedType === "phones" ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy All ({sellers.length})</span>
                </>
              )}
            </button>
          </div>
          <textarea
            readOnly
            value={phonesList}
            className="w-full h-32 p-4 bg-gray-50 rounded-2xl text-xs font-semibold text-gray-600 border border-gray-100 focus:outline-none resize-none select-all"
            placeholder="No seller phone numbers found"
          />
        </div>

        {/* Bulk Email Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-tight text-gray-900">Bulk Email List</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Comma-separated email addresses</p>
              </div>
            </div>
            <button
              onClick={() => handleCopyText(emailsList, "emails")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                copiedType === "emails"
                  ? "bg-emerald-500 text-white"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              {copiedType === "emails" ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy All ({sellers.length})</span>
                </>
              )}
            </button>
          </div>
          <textarea
            readOnly
            value={emailsList}
            className="w-full h-32 p-4 bg-gray-50 rounded-2xl text-xs font-semibold text-gray-600 border border-gray-100 focus:outline-none resize-none select-all"
            placeholder="No seller email addresses found"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Search Header */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight text-gray-900">Seller Directory</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total of {filteredSellers.length} listings</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by store name, owner, or contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            />
          </div>
        </div>

        {/* Directory List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Store</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Owner</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Phone Number</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                    No matching sellers found
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-xs uppercase tracking-tight text-gray-900">
                      {seller.storeName}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                      {seller.ownerName || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-gray-600">{seller.contactPhone || "N/A"}</span>
                        {seller.contactPhone && seller.contactPhone !== "N/A" && (
                          <button
                            onClick={() => handleCopyText(seller.contactPhone, seller.id + "_phone")}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-all"
                            title="Copy Phone"
                          >
                            {copiedType === seller.id + "_phone" ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-gray-600">{seller.contactEmail || "N/A"}</span>
                        {seller.contactEmail && seller.contactEmail !== "N/A" && (
                          <button
                            onClick={() => handleCopyText(seller.contactEmail, seller.id + "_email")}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-all"
                            title="Copy Email"
                          >
                            {copiedType === seller.id + "_email" ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
