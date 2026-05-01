"use client";

import LegalContent from "@/components/LegalContent";

export default function CookiesPage() {
  return (
    <LegalContent title="Cookie Policy" lastUpdated="May 1, 2026">
      <section>
        <h2 className="text-xl font-black mb-4">1. What are Cookies?</h2>
        <p>
          Cookies are small text files that are stored on your device when you visit a website. They help the website remember your preferences and improve your browsing experience.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">2. How We Use Cookies</h2>
        <p>
          CartlyHub uses cookies for the following purposes:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-4">
          <li>
            <strong>Essential Cookies:</strong> These are necessary for the Platform to function properly, such as keeping you logged in and managing your shopping cart.
          </li>
          <li>
            <strong>Analytics Cookies:</strong> We use <strong>Google Analytics</strong> to collect information about how visitors use our site. This helps us understand user behavior and improve the Platform. All data is anonymized.
          </li>
          <li>
            <strong>Functional Cookies:</strong> These remember choices you make (like your preferred region) to provide a more personalized experience.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">3. Third-Party Cookies</h2>
        <p>
          Some cookies are placed by third-party services that appear on our pages. These include services like <strong>Paystack</strong> for payment security and <strong>FontAwesome</strong> for icons.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">4. Managing Cookies</h2>
        <p>
          Most web browsers allow you to control cookies through their settings. You can choose to block or delete cookies, but this may affect the functionality of the Platform.
        </p>
      </section>
    </LegalContent>
  );
}
