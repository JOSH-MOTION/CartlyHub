import { NextResponse } from 'next/server';
import { db, doc, getDoc, updateDoc, Timestamp } from '@/lib/firestore-server';
import { COLLECTIONS, verifyUnsubscribeToken } from '@/lib/unsubscribe';

export const dynamic = 'force-dynamic';

const page = (heading, body) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cartly Hub</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;margin:0;padding:48px 16px;">
  <div style="max-width:440px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;text-align:center;">
    <p style="font-weight:800;font-size:16px;margin:0 0 20px;">Cartly Hub</p>
    <h1 style="font-size:18px;margin:0 0 10px;color:#0f172a;">${heading}</h1>
    <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">${body}</p>
  </div>
</body></html>`;

const ALLOWED = new Set(Object.values(COLLECTIONS));

/**
 * One click, no login — the link itself is the proof (see lib/unsubscribe.js).
 * Only ever turns off non-transactional email (weekly digests, product
 * spotlights, engagement nudges); order confirmations, receipts and
 * low-stock alerts don't check this flag and keep sending regardless.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get('c');
  const id = searchParams.get('id');
  const token = searchParams.get('t');

  if (!collection || !id || !token || !ALLOWED.has(collection) || !verifyUnsubscribeToken(collection, id, token)) {
    return new NextResponse(
      page('That link isn’t valid', 'It may be old or mistyped. Nothing has been changed.'),
      { status: 400, headers: { 'Content-Type': 'text/html' } },
    );
  }

  const ref = doc(db, collection, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return new NextResponse(page('Account not found', 'Nothing to unsubscribe.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  await updateDoc(ref, { marketingEmailsOptOut: true, updatedAt: Timestamp.now() });

  return new NextResponse(
    page(
      'You’re unsubscribed',
      'You won’t get weekly digests, product picks, or engagement emails from Cartly Hub anymore. Order updates and account emails still come through, since those aren’t marketing.',
    ),
    { headers: { 'Content-Type': 'text/html' } },
  );
}
