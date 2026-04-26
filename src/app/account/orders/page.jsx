"use client";

import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import { getUserOrders } from "@/utils/firebaseData";
import { 
  Package, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ChevronRight,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MyOrdersPage() {
  const { user, isLoading: authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/account/signin");
    }
  }, [user, authLoading, router]);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["user", "orders", user?.uid],
    queryFn: () => getUserOrders(user?.uid),
    enabled: !!user?.uid,
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "bg-green-50 text-green-600 border-green-100";
      case "shipped": return "bg-blue-50 text-blue-600 border-blue-100";
      case "processing": return "bg-orange-50 text-orange-600 border-orange-100";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered": return <CheckCircle2 className="h-4 w-4" />;
      case "shipped": return <Truck className="h-4 w-4" />;
      case "processing": return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (authLoading || (user && ordersLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <header className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Your Account
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            Order History
          </h1>
        </header>

        {orders?.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]"
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-50 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Order Placed
                    </p>
                    <p className="font-bold text-sm">
                      {order.createdAt?.toLocaleDateString('en-GH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Total Amount
                    </p>
                    <p className="font-black text-sm">
                      ₵{Number(order.totalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Order ID
                    </p>
                    <p className="font-bold text-sm text-gray-500">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span>{order.status || 'Pending'}</span>
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8 bg-gray-50/30">
                  <div className="space-y-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-6 p-4 bg-white rounded-2xl border border-gray-100">
                        <div className="h-16 w-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                          {item.image ? (
                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ShoppingBag className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-sm uppercase tracking-tight line-clamp-1">{item.productName}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {item.variantInfo?.color && `Color: ${item.variantInfo.color}`} 
                            {item.variantInfo?.color && item.variantInfo?.size && ' | '}
                            {item.variantInfo?.size && `Size: ${item.variantInfo.size}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm">₵{Number(item.price || 0).toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-16 text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">No Orders Yet</h3>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">
              Looks like you haven't made any purchases.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.05] transition-all shadow-xl shadow-black/10 inline-flex items-center space-x-3"
            >
              <span>Start Shopping</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
