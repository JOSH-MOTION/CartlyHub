"use client";

import LegalContent from "@/components/LegalContent";

export default function TermsPage() {
  return (
    <LegalContent title="Terms & Conditions" lastUpdated="May 1, 2026">
      <section>
        <h2 className="text-xl font-black mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing or using CartlyHub (the "Platform"), you agree to be bound by these Terms & Conditions. If you do not agree to all of these terms, do not use the Platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">2. Eligibility</h2>
        <p>
          You must be at least <strong>16 years of age</strong> to use CartlyHub. By using the Platform, you represent and warrant that you meet this age requirement and have the legal capacity to enter into a binding agreement.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">3. Platform Role</h2>
        <p>
          CartlyHub is a marketplace platform that allows users to list and buy products. We are not a party to the actual transactions between buyers and sellers. We do not have control over the quality, safety, or legality of the items advertised, the truth or accuracy of the listings, or the ability of sellers to sell items.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">4. Seller Obligations</h2>
        <p>
          Sellers must have <strong>legal title</strong> to the items they list for sale on the Platform. All listings must be accurate, complete, and not misleading. Sellers are responsible for ensuring that their items comply with all applicable laws in Ghana.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">5. Governing Law & Dispute Resolution</h2>
        <p>
          These Terms & Conditions are governed by and construed in accordance with the <strong>laws of the Republic of Ghana</strong>. Any dispute arising out of or in connection with these terms shall be settled by the <strong>Ghana Arbitration Centre</strong> in accordance with its rules.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">6. Prohibited Activities</h2>
        <p>
          Users may not use the Platform for any illegal purposes, including but not limited to fraud, money laundering, or the sale of prohibited items (as defined in our Seller Policy).
        </p>
      </section>
    </LegalContent>
  );
}
