import { updateSellingPreferences } from '@/services/marketplace/vendor-service';
import { requireVendor } from '@/app/api/_lib/auth';
import { ok, fail } from '@/app/api/_lib/respond';

export const dynamic = 'force-dynamic';

/**
 * Updates a vendor's Selling & Payment Preferences.
 *
 * The same validation runs here as during onboarding: WhatsApp Only and Both
 * require a usable WhatsApp number; Online Payments and Both switch on Cartly
 * Hub's central Paystack checkout for that vendor's products.
 */
export async function PUT(request) {
  try {
    const { uid } = await requireVendor(request);
    const { sellingMode, whatsappNumber } = await request.json();

    const preferences = await updateSellingPreferences(uid, {
      sellingMode,
      whatsappNumber,
    });

    return ok({ preferences });
  } catch (error) {
    return fail(error, 400);
  }
}
