"use client";

import LegalContent from "@/components/LegalContent";

export default function RefundPage() {
  return (
    <LegalContent title="Refund Policy" lastUpdated="May 1, 2026">
      <section>
        <h2 className="text-xl font-black mb-4">1. Direct Transactions</h2>
        <p>
          For transactions where payment is made directly from the buyer to the seller (e.g., cash on delivery or direct mobile money transfer), any refund or return must be negotiated directly between the buyer and the seller. CartlyHub is not responsible for facilitating these refunds.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">2. Platform Payments (Paystack)</h2>
        <p>
          If a payment is made through the CartlyHub platform using <strong>Paystack</strong> (e.g., for premium listings, featured ads, or integrated checkout services), the following applies:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>Refunds may be requested if the service was not delivered as described.</li>
          <li>Refund requests must be submitted within 48 hours of the transaction.</li>
          <li>Refunds will be processed back to the original payment method through Paystack.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">3. Dispute Resolution</h2>
        <p>
          In case of a dispute regarding a transaction, we encourage both parties to communicate and reach an amicable solution. If an agreement cannot be reached, users may refer to the <strong>Ghana Arbitration Centre</strong> as per our Terms & Conditions.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-4">4. Verification</h2>
        <p>
          We strongly advise buyers to <strong>inspect all items</strong> thoroughly before completing a payment. Once a payment is made directly to a seller, it is considered a final agreement between the two parties.
        </p>
      </section>
    </LegalContent>
  );
}
