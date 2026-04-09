"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, ArrowRight, Chrome, User } from "lucide-react";

function SignUpPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { signUp } = useApp();
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signUp(email, password, name);
      router.push("/");
    } catch (err) {
      setError("Could not create account. Email may already be in use.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans flex-row-reverse">
      {/* Right side Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join the Carly Hub network.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <label className="sr-only">Full Name</label>
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                placeholder="Full Name"
              />
            </div>
            <div className="relative">
              <label className="sr-only">Email address</label>
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <label className="sr-only">Password</label>
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-all duration-200"
            >
              {loading ? "Creating account..." : "Sign up"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="relative mt-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 uppercase tracking-wider">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6">
          <a
            href="/api/auth/signin/google"
            className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            <Chrome className="h-5 w-5 mr-2 text-red-500" />
            <span>Google</span>
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center">
          <p className="text-gray-500 text-sm mb-4">Already have an account?</p>
          <button
            onClick={() => router.push("/account/signin")}
            className="w-full py-3 bg-white text-black border border-gray-200 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors shadow-sm"
          >
            Sign In
          </button>
        </div>
      </div>
      </div>
      
    {/* Left side Image Canvas */}
    <div className="hidden lg:block lg:w-1/2 relative bg-gray-50 overflow-hidden">
      <img 
        src="/catly.png" 
        alt="Premium Collection" 
        className="absolute inset-0 w-full h-full object-cover opacity-90 scale-105 transform hover:scale-100 transition-transform duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-12 left-12 right-12 text-white text-right">
         <h2 className="text-3xl font-black uppercase tracking-widest mb-4">Elevate Your Style</h2>
         <p className="text-white/80 leading-relaxed ml-auto max-w-md">Unlock standard shipping logic, specialized wishlist tracking, and instant checkout pathways when you build your profile.</p>
      </div>
    </div>
  </div>
  );
}

export default SignUpPage;
