import { categoryService } from '../../../services/firestore';

export async function loader() {
  try {
    const categories = await categoryService.getAll();
    return Response.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return Response.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function action({ request }) {
  try {
    const body = await request.json();
    const { name, description, image } = body;
    
    const categoryId = await categoryService.create({
      name,
      description,
      image,
      isActive: true,
    });
    
    return Response.json({ id: categoryId, success: true });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return Response.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
