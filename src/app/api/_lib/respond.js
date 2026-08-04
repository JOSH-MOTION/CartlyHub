import { NextResponse } from 'next/server';
import { ApiAuthError } from './auth';
import { PaymentError } from '../../../services/payments';
import { isAdminSdk } from '../../../lib/firestore-server';

export const ok = (data, init) => NextResponse.json({ success: true, ...data }, init);

/**
 * Single error shape for the whole marketplace API so the UI can always read
 * `error` and show it. Unexpected errors are logged and reduced to a generic
 * message — gateway payloads and stack traces never reach the browser.
 */
export const fail = (error, fallbackStatus = 500) => {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }

  if (error instanceof PaymentError) {
    console.error('[payments]', error.provider, error.code, error.raw ?? error.message);
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.status || 502 },
    );
  }

  // Firestore rejected the write. Almost always this is the server running on
  // the web SDK with no service account: it reaches Firestore unauthenticated,
  // and the rules for orders/wallets/withdrawals/sellers deny it. Say so
  // plainly rather than surfacing a bare 500.
  if (error?.code === 'permission-denied' || /insufficient permissions/i.test(error?.message || '')) {
    const cause = isAdminSdk
      ? 'Firestore security rules rejected this write. Check firestore.rules for the collection involved.'
      : 'The server cannot write to Firestore because FIREBASE_SERVICE_ACCOUNT is not set, ' +
        'so it is using the web SDK and your security rules reject it. Add the service ' +
        'account to .env and restart the dev server.';

    console.error('[api] permission denied —', isAdminSdk ? 'rules' : 'missing service account', error?.message);

    return NextResponse.json(
      { success: false, error: cause, code: 'permission_denied' },
      { status: 503 },
    );
  }

  // Domain errors are written to be shown to the user; anything else is not.
  const isDomainError = error instanceof Error && fallbackStatus < 500;
  if (!isDomainError) console.error('[api]', error);

  return NextResponse.json(
    {
      success: false,
      error: isDomainError ? error.message : error?.message || 'Something went wrong',
    },
    { status: fallbackStatus },
  );
};

export const badRequest = (message) =>
  NextResponse.json({ success: false, error: message }, { status: 400 });
