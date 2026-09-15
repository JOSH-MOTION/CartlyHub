import { Mail, Trash2, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Delete Your Account | Cartly Hub",
  description: "How to request deletion of your Cartly Hub account and data.",
};

const SUPPORT_EMAIL = "support@cartlyhubgh.com";

export default function DeleteAccountRequestPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <main className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-8">
          <Trash2 className="h-7 w-7 text-red-500" />
        </div>

        <h1 className="text-3xl font-black uppercase tracking-tighter mb-3">Delete your account</h1>
        <p className="text-gray-500 mb-10">
          You can request permanent deletion of your Cartly Hub account and personal data at any time.
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 space-y-4 mb-10">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">How to request deletion</h2>
          <ol className="space-y-3 text-sm text-gray-700 leading-relaxed list-decimal list-inside">
            <li>
              Send an email to{" "}
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Account%20deletion%20request`} className="font-bold text-black underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              from the email address on your Cartly Hub account.
            </li>
            <li>Use the subject line "Account deletion request" and confirm you'd like your account permanently deleted.</li>
            <li>We'll verify the request and confirm back to you once it's processed.</li>
          </ol>
        </div>

        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-1">What gets deleted</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your profile (name, email, phone), account credentials, wishlist, saved messages, and — if you have
                one — your seller store profile and listings.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-1">What we keep, and why</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Records of completed orders and transactions are retained for a limited period as required for
                accounting, tax, and fraud-prevention purposes, even after your account is deleted. This data is
                kept separately from your active profile and is not used for any other purpose.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-1">Timeline</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We aim to process deletion requests within 14 days of verifying your identity.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
