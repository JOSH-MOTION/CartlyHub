import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results = {};

  try {
    await import('firebase-admin/auth');
    results.importFirebaseAdminAuth = 'ok';
  } catch (e) {
    results.importFirebaseAdminAuth = `FAILED: ${e?.message || e}`;
  }

  try {
    const { getAdminApp } = await import('@/lib/firestore-server');
    const app = getAdminApp();
    results.getAdminApp = app ? 'ok - app present' : 'ok - app is null';
  } catch (e) {
    results.getAdminApp = `FAILED: ${e?.message || e}`;
  }

  try {
    const { getAuth } = await import('firebase-admin/auth');
    const { getAdminApp } = await import('@/lib/firestore-server');
    const app = getAdminApp();
    if (app) {
      const authInstance = getAuth(app);
      results.getAuthInstance = authInstance ? 'ok' : 'FAILED: null instance';
    } else {
      results.getAuthInstance = 'skipped - no app';
    }
  } catch (e) {
    results.getAuthInstance = `FAILED: ${e?.message || e}\n${e?.stack || ''}`;
  }

  try {
    await import('@/services/marketplace/auth-service');
    results.importAuthService = 'ok';
  } catch (e) {
    results.importAuthService = `FAILED: ${e?.message || e}\n${e?.stack || ''}`;
  }

  try {
    const { sendPasswordResetEmail } = await import('@/services/marketplace/email-service');
    results.importEmailServiceFn = typeof sendPasswordResetEmail === 'function' ? 'ok' : 'FAILED: not a function';
  } catch (e) {
    results.importEmailServiceFn = `FAILED: ${e?.message || e}`;
  }

  try {
    const { generatePasswordResetLink } = await import('@/services/marketplace/auth-service');
    const link = await generatePasswordResetLink('joshuadoe168@gmail.com');
    results.generateRealLink = `ok - ${link.slice(0, 60)}...`;
  } catch (e) {
    results.generateRealLink = `FAILED: ${e?.code || ''} ${e?.message || e}`;
  }

  return NextResponse.json(results);
}
