"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Search, 
  Loader2, 
  Phone, 
  Mail, 
  Calendar, 
  TrendingUp,
  ExternalLink,
  ShoppingBag,
  DollarSign
} from "lucide-react";
import { getCustomers } from "@/utils/firebaseData";

export default function AdminCustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      return await getCustomers();
    },
  });

  const filteredCustomers = customers?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: customers?.length || 0,
    totalRevenue: customers?.reduce((acc, c) => acc + c.totalSpend, 0) || 0,
    avgLTV: customers?.length ? (customers.reduce((acc, c) => acc + c.totalSpend, 0) / customers.length) : 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            CRM & Analytics
          </span>
          <h2 className="text-4xl font-black tracking-tighter uppercase">Customer Directory</h2>
        </div>
        <div className="flex items-center space-x-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-2 border-r border-gray-100 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total</p>
            <p className="text-xl font-black">{stats.total}</p>
          </div>
          <div className="px-6 py-2 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Avg. LTV</p>
            <p className="text-xl font-black text-green-600">GH₵{Math.round(stats.avgLTV).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black text-white p-8 rounded-3xl space-y-4 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-6 w-6 text-gray-400" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">LTV LeaderBoard</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Top Lifetime Value</p>
            <h3 className="text-3xl font-black italic tracking-tighter">
              {customers?.[0]?.name || "None Yet"}
            </h3>
            <p className="text-xl font-black text-green-400 mt-2">
              GH₵{customers?.[0]?.totalSpend.toLocaleString() || "0"}
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
                <ShoppingBag className="h-6 w-6 text-gray-200" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Activity</span>
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Most Orders</p>
                <h3 className="text-3xl font-black tracking-tighter">
                    {[...(customers || [])].sort((a,b) => b.orderCount - a.orderCount)[0]?.name || "N/A"}
                </h3>
                <p className="text-sm font-bold text-gray-400 mt-2 italic">
                    {[...(customers || [])].sort((a,b) => b.orderCount - a.orderCount)[0]?.orderCount || 0} Successful Sales
                </p>
            </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
                <DollarSign className="h-6 w-6 text-gray-200" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Financial Pool</span>
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Customer Equity</p>
                <h3 className="text-3xl font-black tracking-tighter italic">
                    GH₵{stats.totalRevenue.toLocaleString()}
                </h3>
                <p className="text-xs font-bold text-gray-400 mt-2">
                    Combined value of all recorded sales
                </p>
            </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black transition-all outline-none font-bold placeholder:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {filteredCustomers?.length} Customers Found
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Detail</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Purchase History</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Lifetime Revenue</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Total Profit</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers?.map((customer) => (
                <tr key={customer.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-sm">
                        {customer.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-black text-lg tracking-tighter uppercase">{customer.name}</p>
                        <div className="flex items-center space-x-3 text-xs font-bold text-gray-400 mt-1">
                          <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {customer.phone}
                          </span>
                          {customer.email && (
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mx-1" />
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="font-bold text-sm tracking-tight">{customer.orderCount} Orders Completed</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Last Active: {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-xl font-black text-black tracking-tight">
                        GH₵{customer.totalSpend.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded inline-block mt-1">
                         AOV: {(customer.totalSpend / customer.orderCount).toFixed(0)}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-xl font-black text-green-600 tracking-tight">
                        GH₵{customer.totalProfit.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded inline-block mt-1">
                         {( (customer.totalProfit / customer.totalSpend) * 100).toFixed(1)}% Margin
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      customer.orderCount > 1 ? "bg-black text-white shadow-lg shadow-black/10" : "bg-gray-100 text-gray-500"
                    }`}>
                      {customer.orderCount > 1 ? "Repeat Customer" : "One-Time"}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-3 bg-gray-50 rounded-xl hover:bg-black hover:text-white transition-all">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers?.length === 0 && (
          <div className="py-32 text-center">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No customers found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
