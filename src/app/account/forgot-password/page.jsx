"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/utils/apiClient";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/auth/forgot-password", { method: "POST", body: { email } });
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <button
            onClick={() => router.push("/account/signin")}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </button>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Check your email</h2>
              <p className="text-sm text-gray-600">
                If an account exists for <span className="font-semibold text-gray-900">{email}</span>, we've sent a
                link to reset your password. It works once and expires in an hour.
              </p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                  Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Enter the email on your Cartly Hub account and we'll send you a reset link.
                </p>
              </div>
              <form className="mt-8 space-y-6" onSubmit={onSubmit}>
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

                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? "Sending…" : "Send reset link"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative bg-gray-50 overflow-hidden">
        <img
          src="/cartly.png"
          alt="Shopping Experience"
          className="absolute inset-0 w-full h-full object-cover opacity-90 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-3xl font-black uppercase tracking-widest mb-4">We've got you</h2>
          <p className="text-white/80 leading-relaxed max-w-md">
            Back in a couple of taps — get a fresh password and you're straight back to shopping.
          </p>
        </div>
      </div>
    </div>
  );
}
