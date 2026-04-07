import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    const body = await request.json();
    const {
      email,
      total_amount,
      shipping_address,
      whatsapp_number,
      items,
      payment_reference,
    } = body;

    const [order] = await sql`
      INSERT INTO orders (user_id, email, total_amount, status, payment_reference, shipping_address, whatsapp_number)
      VALUES (${session?.user?.id || null}, ${email}, ${total_amount}, 'pending', ${payment_reference}, ${JSON.stringify(shipping_address)}, ${whatsapp_number})
      RETURNING *
    `;

    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, product_name, variant_info)
        VALUES (${order.id}, ${item.product_id}, ${item.variant_id}, ${item.quantity}, ${item.price}, ${item.product_name}, ${item.variant_info})
      `;

      // Update stock
      await sql`
        UPDATE variants 
        SET stock = stock - ${item.quantity}
        WHERE id = ${item.variant_id}
      `;
    }

    return Response.json(order);
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}
