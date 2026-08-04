/**
 * Money helpers.
 *
 * All arithmetic that decides how much a customer pays, how much Cartly Hub
 * keeps and how much a vendor earns is done in *minor units* (pesewas for GHS,
 * kobo for NGN) so we never accumulate floating point drift. Documents store
 * major units because that is what every screen renders.
 */

export const MINOR_UNIT_FACTOR = 100;

export const toMinor = (amount) =>
  Math.round(Number(amount || 0) * MINOR_UNIT_FACTOR);

export const fromMinor = (minor) =>
  Math.round(Number(minor || 0)) / MINOR_UNIT_FACTOR;

/** Rounds a major-unit amount to 2 decimal places. */
export const round2 = (amount) => fromMinor(toMinor(amount));

/**
 * Splits a gross amount between the marketplace and the vendor.
 * The commission is rounded to the nearest pesewa and the vendor receives the
 * remainder, so commission + earnings always equals the amount paid exactly.
 */
export const splitCommission = (grossAmount, commissionPercent) => {
  const grossMinor = toMinor(grossAmount);
  const rate = Math.min(Math.max(Number(commissionPercent) || 0, 0), 100);
  const commissionMinor = Math.round((grossMinor * rate) / 100);
  const earningsMinor = grossMinor - commissionMinor;

  return {
    commissionRate: rate,
    grossAmount: fromMinor(grossMinor),
    commissionAmount: fromMinor(commissionMinor),
    vendorEarnings: fromMinor(earningsMinor),
  };
};

export const formatCurrency = (amount, currency = 'GHS') => {
  const symbols = { GHS: 'GH₵', NGN: '₦', USD: '$' };
  const symbol = symbols[currency] || `${currency} `;
  return `${symbol}${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
