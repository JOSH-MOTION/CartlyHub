"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { Lock, ArrowRight, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const oobCode = params.get("oobCode");

  const [state, setState] = useState("verifying"); // verifying | ready | invalid | done
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setState("invalid");
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((resolvedEmail) => {
        setEmail(resolvedEmail);
        setState("ready");
      })
      .catch(() => setState("invalid"));
  }, [oobCode]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPw) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setState("done");
    } catch (err) {
      setError(
        err.code === "auth/expired-action-code" || err.code === "auth/invalid-action-code"
          ? "This reset link has expired or was already used — request a new one."
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {state === "verifying" && (
          <div className="text-center space-y-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-black mx-auto" />
            <p className="text-sm text-gray-500">Checking your link…</p>
          </div>
        )}

        {state === "invalid" && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Link expired or invalid</h2>
            <p className="text-sm text-gray-600">
              This password reset link has already been used or has expired. Request a new one to continue.
            </p>
            <button
              onClick={() => router.push("/account/forgot-password")}
              className="w-full py-3 bg-black text-white rounded-xl font-semibold text-sm hover:bg-gray-900 transition-colors"
            >
              Request a new link
            </button>
          </div>
        )}

        {state === "ready" && (
          <>
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight text-center">
                Choose a new password
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">For {email}</p>
            </div>
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  required
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Confirm new password"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-all duration-200"
              >
                {submitting ? "Saving…" : "Reset password"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>
          </>
        )}

        {state === "done" && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Password updated</h2>
            <p className="text-sm text-gray-600">You can now sign in with your new password.</p>
            <button
              onClick={() => router.push("/account/signin")}
              className="w-full py-3 bg-black text-white rounded-xl font-semibold text-sm hover:bg-gray-900 transition-colors"
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
