import { NextResponse } from 'next/server';
import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add role column if not exists (handled by DB schema tool usually, but let's be safe)
    // Actually our DB tool creates tables. Let's just update the user.
    // auth_users is the table for user accounts.

    await sql`
      UPDATE auth_users 
      SET role = 'admin' 
      WHERE id = ${session.user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
