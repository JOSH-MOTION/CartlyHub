import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

/**
 * Side-effect-free — cloudinary.api.ping() only checks that the admin
 * API key/secret pair authenticates, no upload or delete involved. Exists
 * to confirm status-service.js's deletion path can actually work, without
 * needing a real image or a seller-authenticated request to test it.
 */
export async function GET() {
  const hasKey = Boolean(process.env.CLOUDINARY_API_KEY);
  const hasSecret = Boolean(process.env.CLOUDINARY_API_SECRET);

  if (!hasKey || !hasSecret) {
    return NextResponse.json({ hasKey, hasSecret, authenticated: false });
  }

  try {
    await cloudinary.api.ping();
    return NextResponse.json({ hasKey, hasSecret, authenticated: true });
  } catch (error) {
    return NextResponse.json({ hasKey, hasSecret, authenticated: false, error: error.message });
  }
}
