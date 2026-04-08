import { Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  LogOut,
  Folder,
  Receipt,
} from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const SidebarItem = ({ icon: Icon, label, route }) => {
    // Check if the current URL exactly matches for the dashboard root, or starts with it for subroutes.
    const isActive = location.pathname === route || (route !== "/admin" && location.pathname.startsWith(route));
    
    return (
      <button
        onClick={() => route && navigate(route)}
        className={`w-full flex items-center space-x-4 px-6 py-4 transition-all ${isActive ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black"}`}
      >
        <Icon className="h-5 w-5" />
        <span className="font-bold uppercase tracking-widest text-xs">{label}</span>
      </button>
    );
  };

  return (
    <div className="bg-gray-50 flex font-sans w-full min-h-screen">
      {/* Sidebar - fixed and full height */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-8 pb-12">
          <button
            onClick={() => navigate('/')}
            className="text-xl font-black tracking-tighter text-black uppercase text-left w-full"
          >
            Carly<span className="text-gray-500">Hub</span>
            <span className="block text-[8px] tracking-[0.3em] text-gray-400 mt-1">
              Admin Dashboard
            </span>
          </button>
        </div>

        <nav className="flex-grow">
          <SidebarItem icon={LayoutDashboard} label="Overview" route="/admin" />
          <SidebarItem icon={Folder} label="Categories" route="/admin/categories" />
          <SidebarItem icon={Package} label="Inventory" route="/admin/products" />
          <SidebarItem icon={ShoppingCart} label="Orders" route="/admin/orders" />
          <SidebarItem icon={Receipt} label="Manual Sales" route="/admin/manual-sales" />
          <SidebarItem icon={Users} label="Customers" route="/admin/customers" />
          <SidebarItem icon={DollarSign} label="Financials" route="/admin/financials" />
        </nav>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={() => navigate('/account/logout')}
            className="w-full flex items-center space-x-4 px-6 py-4 text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-bold uppercase tracking-widest text-xs">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area Container */}
      <main className="flex-grow min-w-0">
        {/* We moved padding to the children so they can control it if they need full bleed */}
        <div className="p-12 w-full h-full">
            <Outlet />
        </div>
      </main>
    </div>
  );
}
