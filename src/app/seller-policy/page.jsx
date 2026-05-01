"use client";

import LegalContent from "@/components/LegalContent";

export default function SellerPolicyPage() {
  return (
    <LegalContent title="Seller Policy" lastUpdated="May 1, 2026">
      <section>
        <h2 className="text-xl font-black mb-4">1. Seller Eligibility</h2>
        <p>
          To sell on CartlyHub, you must provide accurate contact information and verify your identity if requested. You must be legally authorized to sell the items you list.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">2. Legal Title</h2>
        <p>
          By listing an item, you represent and warrant that you have <strong>full legal title</strong> to that item and the right to sell it. Stolen goods or items with disputed ownership are strictly prohibited.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">3. Prohibited Items</h2>
        <p>
          The following items are prohibited from being listed on CartlyHub:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>Illegal drugs and paraphernalia.</li>
          <li>Weapons, ammunition, and explosives.</li>
          <li>Counterfeit goods or items infringing on intellectual property.</li>
          <li>Stolen property or property with erased serial numbers.</li>
          <li>Human parts or remains.</li>
          <li>Hazardous materials.</li>
          <li>Regulated financial instruments.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">4. Listing Accuracy</h2>
        <p>
          Listings must include accurate descriptions, clear photos, and truthful pricing. Using stock photos for used items is discouraged; actual photos of the item are required to ensure transparency.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">5. Communication & Conduct</h2>
        <p>
          Sellers must maintain professional conduct when interacting with buyers. Harassment, spamming, or fraudulent behavior will result in immediate suspension from the Platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">6. Platform Fees</h2>
        <p>
          While basic listings may be free, CartlyHub reserves the right to charge for premium services, featured ads, or commission-based sales as disclosed on the Platform.
        </p>
      </section>
    </LegalContent>
  );
}
