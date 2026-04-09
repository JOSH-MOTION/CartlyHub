import { NextResponse } from 'next/server';
import { categoryService } from '../../../services/firestore';

export async function GET() {
  try {
    const categories = await categoryService.getAll();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, image } = body;
    
    const categoryId = await categoryService.create({
      name,
      description,
      image,
      isActive: true,
    });
    
    return NextResponse.json({ id: categoryId, success: true });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
