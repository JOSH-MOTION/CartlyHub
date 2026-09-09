/**
 * Sends a push via Expo's push API — no expo-server-sdk dependency needed,
 * it's a plain HTTPS POST. Best-effort by design: a push failing (bad token,
 * network hiccup, Expo outage) should never block the in-app notification or
 * whatever action triggered it.
 */
export const sendExpoPush = async ({ to, title, body, data }) => {
  if (!to || typeof to !== 'string' || !to.startsWith('ExponentPushToken')) return;

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to, title, body, data: data || {}, sound: 'default' }),
    });
  } catch (error) {
    console.error('[expo-push] send failed', error.message);
  }
};
