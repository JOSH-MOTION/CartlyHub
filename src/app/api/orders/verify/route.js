import sql from "@/app/api/utils/sql";

export async function action({ request }) {
  try {
    const { reference } = await request.json();

    // In a real app, you'd call Paystack API to verify:
    // const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    //   headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    // });
    // const data = await res.json();
    // if (data.status && data.data.status === 'success') { ... }

    // For now, let's assume verification is triggered after the popup closes successfully
    await sql`
      UPDATE orders 
      SET status = 'paid', updated_at = CURRENT_TIMESTAMP
      WHERE payment_reference = ${reference}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Verify payment error:", error);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}
