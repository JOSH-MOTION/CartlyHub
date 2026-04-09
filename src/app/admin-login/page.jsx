"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { KeyRound, ShieldCheck, Loader2, ArrowRight, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DedicatedAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  
  const { signIn, user, profile, isLoading } = useApp();
  const router = useRouter();

  // If already logged in AND an Admin AND has session PIN, redirect automatically
  useEffect(() => {
    const isPinValidated = typeof window !== "undefined" && sessionStorage.getItem("adminPinAuth") === "true";
    if (user && profile?.role === "ADMIN" && isPinValidated && !isLoading) {
      router.push("/admin");
    }
  }, [user, profile, isLoading, router]);

  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setIsChecking(true);
    
    const correctPin = process.env.NEXT_PUBLIC_ADMIN_PIN;
    
    // 1. Check Master PIN first before even hitting Firebase
    if (pin !== correctPin) {
      toast.error("Security authorization rejected: Invalid PIN.");
      setPin("");
      setIsChecking(false);
      return;
    }

    try {
      // 2. Perform Firebase Auth Login
      await signIn(email, password);
      
      // Since context runs asynchronously, we might need to manually check/update the role here
      // But AppContext's `signIn` will trigger Firebase's onAuthStateChanged.
      // To ensure elevation works instantly upon login with the master pin, we'll manually verify the user doc.
      import("firebase/auth").then(async ({ getAuth }) => {
        const auth = getAuth();
        const firebaseUser = auth.currentUser;
        
        if (firebaseUser) {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          let role = "customer";
          if (userSnap.exists()) {
             role = userSnap.data().role;
          } else {
             // Profile doesn't exist in DB yet! Build it directly.
             await setDoc(userRef, {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: "customer",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
             });
          }

          // 3. Elevate to Admin automatically if they aren't already but supplied the Master PIN!
          if (role !== "ADMIN") {
             await updateDoc(userRef, { role: "ADMIN" });
             toast.success("Account elevated to Administrator!");
          }

          // 4. Save Session PIN and redirect
          if (typeof window !== "undefined") {
            sessionStorage.setItem("adminPinAuth", "true");
          }
          
          toast.success("Command Portal Granted.");
          window.location.href = "/admin"; // force reload to hydrate context fully
        }
      });
      
    } catch (err) {
      toast.error("Invalid Email or Password connection.");
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-2xl border border-gray-800">
        <div className="mx-auto bg-black w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-xl border border-gray-800">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-black uppercase tracking-tighter mb-2 text-center text-gray-900">
          Admin Command Gateway
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8 font-medium">
          Authorized personnel only. Intruders will be logged.
        </p>

        <form onSubmit={handleAdminSignIn} className="space-y-4">
          
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-4 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm font-medium transition-all"
              placeholder="Administrator Email"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-4 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm font-medium transition-all"
              placeholder="Administrator Password"
            />
          </div>

          <div className="relative mt-6 pt-4 border-t border-gray-100">
            <label className="block text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              Master Security Pin
            </label>
            <div className="relative max-w-[200px] mx-auto">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-black h-5 w-5" />
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={10}
                className="w-full text-center text-2xl tracking-[0.4em] font-black border-b-2 border-gray-300 focus:border-black outline-none bg-transparent py-2 pl-6 transition-colors text-black"
                placeholder="••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChecking}
            className="w-full mt-8 py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center disabled:opacity-50 hover:bg-gray-800 transition-all shadow-xl"
          >
            {isChecking ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Access Terminal</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
           <p className="text-gray-500 text-sm mb-4">Don't have an account yet?</p>
           <button
             onClick={() => router.push("/account/signup")}
             className="w-full py-3 bg-white text-black border border-gray-200 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors shadow-sm"
           >
             Sign Up Now
           </button>
        </div>
      </div>
    </div>
  );
}
