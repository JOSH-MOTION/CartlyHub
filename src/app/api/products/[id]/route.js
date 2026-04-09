import sql from "@/app/api/utils/sql";

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const [product] = await sql`
      SELECT p.*, c.name as category_name,
      (SELECT json_agg(v.*) FROM variants v WHERE v.product_id = p.id) as variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${id}
    `;

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return Response.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
