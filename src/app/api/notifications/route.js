import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/marketplace/notification-service';
import { requireUser } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { uid } = await requireUser(request);
    const notifications = await listNotifications(uid);
    return ok({
      notifications,
      unreadCount: notifications.filter((entry) => !entry.read).length,
    });
  } catch (error) {
    return fail(error, error?.status || 500);
  }
}

/** Marks one notification read, or all of them when no id is given. */
export async function PATCH(request) {
  try {
    const { uid } = await requireUser(request);
    const { notificationId } = await request.json().catch(() => ({}));

    if (notificationId) {
      await markNotificationRead(notificationId);
      return ok({ updated: 1 });
    }

    return ok({ updated: await markAllNotificationsRead(uid) });
  } catch (error) {
    return fail(error, error?.status || 500);
  }
}
