import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSetup() {
  const { data: user, loading } = useUser();
  const [isSetting, setIsSetting] = useState(false);

  const makeAdmin = async () => {
    if (!user) return;
    setIsSetting(true);
    try {
      const res = await fetch("/api/admin/setup", { method: "POST" });
      if (res.ok) {
        toast.success("You are now an admin!");
        window.location.href = "/admin";
      } else {
        toast.error("Setup failed");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setIsSetting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="max-w-md w-full bg-white p-12 rounded-3xl shadow-xl text-center space-y-8">
        <div className="p-6 bg-black rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-xl shadow-black/20">
          <ShieldCheck className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            Admin Activation
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            Welcome,{" "}
            <span className="text-black font-black">
              {user?.name || user?.email}
            </span>
            . Click the button below to activate admin privileges for this
            account.
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={makeAdmin}
            disabled={isSetting || !user}
            className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
          >
            {isSetting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Activate Privileges</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
          {!user && (
            <p className="mt-4 text-xs font-bold text-red-500 uppercase tracking-widest">
              Please{" "}
              <a href="/account/signin" className="underline">
                Sign In
              </a>{" "}
              first.
            </p>
          )}
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
          Note: This page should be deleted after first use.
        </p>
      </div>
    </div>
  );
}
