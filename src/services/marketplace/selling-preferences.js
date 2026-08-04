import { SELLING_MODE_OPTIONS } from './constants';
import { normaliseWhatsappNumber } from './whatsapp';

/**
 * Validates the Selling & Payment Preferences a vendor picked.
 *
 * Deliberately dependency-free so onboarding (browser), Store Settings
 * (browser) and the API (server) all enforce the identical rule: WhatsApp Only
 * and Both require a usable WhatsApp number, Online Payments and Both switch on
 * Cartly Hub's central checkout.
 */
export const validateSellingPreferences = ({ sellingMode, whatsappNumber }) => {
  const option = SELLING_MODE_OPTIONS.find((entry) => entry.value === sellingMode);
  if (!option) {
    throw new Error('Choose how you want to sell on Cartly Hub');
  }

  let number = null;
  if (option.requiresWhatsapp) {
    number = normaliseWhatsappNumber(whatsappNumber);
    if (!number) {
      throw new Error('A valid WhatsApp number is required for this selling option');
    }
  }

  return {
    sellingMode: option.value,
    whatsappNumber: number,
    onlinePaymentsEnabled: option.enablesOnline,
    whatsappOrdersEnabled: option.requiresWhatsapp,
  };
};
