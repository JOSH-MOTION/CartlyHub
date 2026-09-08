import { getThread, sendMessage, assertParticipant } from '@/services/marketplace/message-service';
import { notifyNewMessage } from '@/services/marketplace/notification-service';
import { sendNewMessageEmail } from '@/services/marketplace/email-service';
import { requireUser } from '@/app/api/_lib/auth';
import { ok, fail, badRequest } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await requireUser(request);
    const thread = await getThread(params.id);
    assertParticipant(thread, user.uid);

    const { text } = await request.json();
    if (!text?.trim()) return badRequest('Message cannot be empty');

    const isSeller = user.uid === thread.sellerId;
    await sendMessage({ threadId: params.id, senderId: user.uid, senderRole: isSeller ? 'seller' : 'customer', text });

    const senderName = isSeller ? thread.sellerStoreName : thread.customerName || 'A buyer';
    const recipientId = isSeller ? thread.customerId : thread.sellerId;
    const recipientRole = isSeller ? 'customer' : 'seller';
    const recipientEmail = isSeller ? thread.customerEmail : thread.sellerEmail;
    const recipientName = isSeller ? thread.customerName : thread.sellerStoreName;
    const preview = text.trim().slice(0, 140);

    // Best-effort — the message itself has already saved successfully.
    await notifyNewMessage({ recipientId, recipientRole, senderName, threadId: params.id, preview }).catch((error) =>
      console.error('[messages] notification failed', error),
    );
    if (recipientEmail) {
      await sendNewMessageEmail({ email: recipientEmail, recipientName, senderName, preview, threadId: params.id }).catch(
        (error) => console.error('[messages] email failed', error),
      );
    }

    return ok({});
  } catch (error) {
    return fail(error, 400);
  }
}
