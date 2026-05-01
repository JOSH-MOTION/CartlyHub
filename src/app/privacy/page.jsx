"use client";

import LegalContent from "@/components/LegalContent";

export default function PrivacyPage() {
  return (
    <LegalContent title="Privacy Policy" lastUpdated="May 1, 2026">
      <section>
        <h2 className="text-xl font-black mb-4">1. Information We Collect</h2>
        <p>
          We collect information that you provide directly to us when you create an account, list a product, or make a purchase. This includes your name, email address, phone number, and location.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">2. Use of Your Information</h2>
        <p>
          We use your information to:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>Facilitate transactions and communication between buyers and sellers.</li>
          <li>Provide and improve our services.</li>
          <li>Protect the security and integrity of the Platform.</li>
          <li>Send you service-related notifications and updates.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">3. Data Sharing & Third Parties</h2>
        <p>
          We do not sell your personal data. We share your information only:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>With other users as necessary to complete a transaction (e.g., sharing a seller's phone number with a buyer).</li>
          <li>With service providers like <strong>Paystack</strong> for payment processing and <strong>Google Analytics</strong> for site usage analysis.</li>
          <li>When required by law or to protect our rights.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">4. Security</h2>
        <p>
          We implement reasonable security measures to protect your information. However, no method of transmission over the internet or electronic storage is 100% secure.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">5. Your Choices</h2>
        <p>
          You can access, update, or delete your account information at any time through your account settings. You may also opt-out of marketing communications.
        </p>
      </section>
    </LegalContent>
  );
}
