import { round2 } from '@/services/payments/money';

/**
 * Discount pricing.
 *
 * The rule that keeps this safe: `price` is always what the customer actually
 * pays. `compareAtPrice` is the old price, shown struck through, and is
 * presentational only.
 *
 * Because of that, the cart, order building, commission split and wallet
 * credit all keep reading `price` and need no knowledge of discounts at all.
 * A discounted item simply has a lower `price` and a `compareAtPrice` above
 * it.
 */

/**
 * Turns what a seller typed into the two stored fields.
 *
 * `original` is the normal price; `discount` is optional. A discount that is
 * empty, zero, negative, non-numeric or not below the original is ignored
 * rather than rejected — sellers clear a sale by blanking the field.
 */
export const normaliseDiscount = (original, discount) => {
  const normal = Number(original);
  if (!Number.isFinite(normal) || normal <= 0) {
    return { price: 0, compareAtPrice: null };
  }

  const sale = Number(discount);
  const hasDiscount = Number.isFinite(sale) && sale > 0 && sale < normal;

  return hasDiscount
    ? { price: round2(sale), compareAtPrice: round2(normal) }
    : { price: round2(normal), compareAtPrice: null };
};

/** True when a stored record is genuinely on sale. */
export const isDiscounted = (record) => {
  const price = Number(record?.price);
  const compareAt = Number(record?.compareAtPrice);
  return (
    Number.isFinite(price) &&
    Number.isFinite(compareAt) &&
    compareAt > price &&
    price > 0
  );
};

export const discountPercent = (record) => {
  if (!isDiscounted(record)) return 0;
  return Math.round((1 - Number(record.price) / Number(record.compareAtPrice)) * 100);
};

/**
 * The prices to render for a product, optionally for a specific variant.
 * Falls back through variant → product so callers do not have to.
 */
export const resolvePricing = (product, variant) => {
  const source =
    variant && Number(variant.price) > 0
      ? variant
      : { price: product?.basePrice, compareAtPrice: product?.compareAtPrice };

  const price = Number(source?.price) || Number(product?.basePrice) || 0;
  const compareAtPrice = Number(source?.compareAtPrice) || null;

  const onSale = compareAtPrice != null && compareAtPrice > price && price > 0;

  return {
    price,
    compareAtPrice: onSale ? compareAtPrice : null,
    isDiscounted: onSale,
    percentOff: onSale ? Math.round((1 - price / compareAtPrice) * 100) : 0,
    saving: onSale ? round2(compareAtPrice - price) : 0,
  };
};

/** Cheapest live price across a product's variants, for listing cards. */
export const resolveListPricing = (product) => {
  const variants = product?.variants || [];
  const inStock = variants.filter((variant) => Number(variant.stock ?? 0) > 0);
  const candidates = inStock.length ? inStock : variants;

  if (!candidates.length) return resolvePricing(product, null);

  const cheapest = candidates.reduce((lowest, variant) =>
    Number(variant.price || Infinity) < Number(lowest.price || Infinity) ? variant : lowest,
  );

  return resolvePricing(product, cheapest);
};
