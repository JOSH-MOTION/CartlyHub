"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  LogOut,
  Folder,
  Receipt,
  Edit,
  Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

// Product management functions
const handleAddProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Product added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    return null;
  }
};

const handleDeleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
    console.log('Product deleted:', productId);
  } catch (error) {
    console.error('Error deleting product:', error);
  }
};

const handleUpdateProduct = async (productId, updates) => {
  try {
    await updateDoc(doc(db, 'products', productId), {
      ...updates,
      updatedAt: new Date(),
    });
    console.log('Product updated:', productId, updates);
  } catch (error) {
    console.error('Error updating product:', error);
  }
};

const handleImageUpload = async (e, productId) => {
  const files = Array.from(e.target.files);
  const uploadedImages = [];

  for (const file of files) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target.result;
      const base64Data = result.split(',')[1];
      uploadedImages.push(base64Data);
    };
    reader.readAsDataURL(file);
  }

  if (uploadedImages.length > 0) {
    try {
      await updateDoc(doc(db, 'products', productId), {
        images: uploadedImages,
        updatedAt: new Date(),
      });
      console.log('Images updated for product:', productId);
      return uploadedImages;
    } catch (error) {
      console.error('Error updating product images:', error);
      return [];
    }
  }
  return [];
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Real product and category queries
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()?.createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
        }));
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()?.createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
        }));
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
  });

  // Calculate stats from real products data
  const calculatedStats = {
    totalRevenue: products.reduce((sum, p) => sum + (p.basePrice || 0), 0),
    totalProfit: products.reduce((sum, p) => sum + (p.basePrice || 0) * 0.3, 0), // 30% profit margin
    totalOrders: products.length,
    totalCustomers: 89, // Mock - replace with real user count
    salesData: [
      { name: "Jan", sales: Math.floor(Math.random() * 100000) },
      { name: "Feb", sales: Math.floor(Math.random() * 100000) },
      { name: "Mar", sales: Math.floor(Math.random() * 100000) },
      { name: "Apr", sales: Math.floor(Math.random() * 100000) },
      { name: "May", sales: Math.floor(Math.random() * 100000) },
      { name: "Jun", sales: Math.floor(Math.random() * 100000) },
    ],
  };

  const { data: adminStats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      return calculatedStats;
    },
  });

  // Product management functions
  const handleDeleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      console.log('Product deleted:', productId);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleUpdateProduct = async (productId, updates) => {
    try {
      await updateDoc(doc(db, 'products', productId), updates);
      console.log('Product updated:', productId, updates);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const SidebarItem = ({ icon: Icon, label, id }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center space-x-4 px-6 py-4 transition-all ${activeTab === id ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black"}`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-bold uppercase tracking-widest text-xs">
        {label}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-8 pb-12">
          <a
            href="/"
            className="text-xl font-black tracking-tighter text-black uppercase"
          >
            Carly<span className="text-gray-500">Hub</span>
            <span className="block text-[8px] tracking-[0.3em] text-gray-400 mt-1">
              Admin Dashboard
            </span>
          </a>
        </div>

        <nav className="flex-grow">
          <SidebarItem icon={LayoutDashboard} label="Overview" id="overview" />
          <SidebarItem icon={Folder} label="Categories" id="categories" />
          <SidebarItem icon={Package} label="Inventory" id="inventory" />
          <SidebarItem icon={ShoppingCart} label="Orders" id="orders" />
          <SidebarItem icon={Receipt} label="Manual Sales" id="manual-sales" />
          <SidebarItem icon={Users} label="Customers" id="customers" />
          <SidebarItem icon={DollarSign} label="Financials" id="financials" />
        </nav>

        <div className="p-6 border-t border-gray-100">
          <a
            href="/account/logout"
            className="flex items-center space-x-4 px-6 py-4 text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-bold uppercase tracking-widest text-xs">
              Logout
            </span>
          </a>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-grow p-12">
        <header className="flex justify-between items-end mb-12">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
              System
            </span>
            <h1 className="text-4xl font-black tracking-tighter uppercase">
              {activeTab === "overview" && "Performance Overview"}
              {activeTab === "inventory" && "Inventory Control"}
              {activeTab === "orders" && "Order Management"}
              {activeTab === "manual-sales" && "Manual Sales"}
              {activeTab === "financials" && "Financial Records"}
            </h1>
          </div>
          <div className="flex space-x-4">
            <a 
              href="/admin/products"
              className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </a>
          </div>
        </header>

        {activeTab === "overview" && (
          <div className="space-y-12">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  label: "Total Revenue",
                  value: `₵${(stats?.totalRevenue / 1000000).toFixed(1)}M`,
                  icon: TrendingUp,
                  trend: "+12%",
                },
                {
                  label: "Net Profit",
                  value: `₵${(stats?.totalProfit / 1000000).toFixed(1)}M`,
                  icon: DollarSign,
                  trend: "+8%",
                },
                {
                  label: "Active Orders",
                  value: stats?.totalOrders,
                  icon: ShoppingCart,
                  trend: "+5%",
                },
                {
                  label: "Total Customers",
                  value: stats?.totalCustomers,
                  icon: Users,
                  trend: "+15%",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-gray-50 rounded-xl text-black">
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                      {stat.trend}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      {stat.label}
                    </p>
                    <h3 className="text-3xl font-black text-black tracking-tighter">
                      {stat.value}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-[400px]">
                <h4 className="text-xs font-black uppercase tracking-widest mb-8">
                  Monthly Sales Revenue
                </h4>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={stats?.salesData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                      fontWeight="bold"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                      fontWeight="bold"
                    />
                    <Tooltip
                      cursor={{ fill: "#f9f9f9" }}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="sales" fill="#000000" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-[400px]">
                <h4 className="text-xs font-black uppercase tracking-widest mb-8">
                  Order Volume Trend
                </h4>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={stats?.salesData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                      fontWeight="bold"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                      fontWeight="bold"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#000000"
                      strokeWidth={4}
                      dot={{
                        r: 6,
                        fill: "#000",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab === "categories" && (
          <div className="bg-white p-20 rounded-3xl shadow-sm border border-gray-100 text-center">
            <Folder className="h-12 w-12 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase tracking-widest text-gray-400 mb-4">
              Categories Management
            </h3>
            <p className="text-gray-400 font-medium mb-6">
              Manage your product categories here.
            </p>
            <a
              href="/admin/categories"
              className="inline-flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Manage Categories</span>
            </a>
          </div>
        )}

        {activeTab === "manual-sales" && (
          <div className="bg-white p-20 rounded-3xl shadow-sm border border-gray-100 text-center">
            <Receipt className="h-12 w-12 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase tracking-widest text-gray-400 mb-4">
              Manual Sales Management
            </h3>
            <p className="text-gray-400 font-medium mb-6">
              Record and manage manual sales transactions here.
            </p>
            <a
              href="/admin/manual-sales"
              className="inline-flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Manage Manual Sales</span>
            </a>
          </div>
        )}

        {activeTab !== "overview" && activeTab !== "categories" && activeTab !== "manual-sales" && (
          <div className="bg-white p-20 rounded-3xl shadow-sm border border-gray-100 text-center">
            <Package className="h-12 w-12 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase tracking-widest text-gray-400">
              Section Under Construction
            </h3>
            <p className="text-gray-400 font-medium mt-2">
              Inventory, Orders, and Financial details will be available here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
