import { productService } from '../../../services/firestore';

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const featured = url.searchParams.get('featured');
    const category = url.searchParams.get('category');
    const limit = url.searchParams.get('limit');

    let products;

    if (featured === 'true') {
      products = await productService.getFeatured();
    } else if (category) {
      products = await productService.getByCategory(category);
    } else {
      products = await productService.getAll();
    }

    // Apply limit if specified
    if (limit) {
      products = products.slice(0, parseInt(limit));
    }

    return Response.json({
      success: true,
      data: products,
    });

  } catch (error) {
    console.error('Products API error:', error);
    
    return Response.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function action({ request }) {
  try {
    // Note: Admin check would go here (checking session role)
    const body = await request.json();
    const {
      name,
      description,
      category_id,
      images,
      base_price,
      cost_price,
      is_featured,
      variants,
    } = body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const productId = await productService.create({
      name,
      slug,
      description,
      categoryId: category_id,
      images,
      basePrice: Number(base_price || 0),
      costPrice: Number(cost_price || body.costPrice || 0),
      isFeatured: is_featured || false,
      isActive: true,
      variants: (variants || []).map(v => ({
        ...v,
        price: Number(v.price || 0),
        stock: Number(v.stock || 0)
      })),
    });

    return Response.json({ id: productId, success: true });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return Response.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
