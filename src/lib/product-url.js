/**
 * Product URL slugs.
 *
 * `/product/black-waffle-shirt-Xk29fQ` rather than `/product/Xk29fQ`, so the
 * URL itself carries the keywords Google reads.
 *
 * The document id is kept as the last segment on purpose. That means:
 *   - no slug column to backfill, and no migration for existing products
 *   - no uniqueness problem when two sellers list "Black Shirt"
 *   - old `/product/<id>` links still resolve, so shared WhatsApp links and
 *     any existing search equity survive
 *
 * A request for the bare id is redirected to the canonical slug so only one
 * URL per product is ever indexed.
 */

const MAX_NAME_LENGTH = 60;

export const slugifyName = (value) =>
  String(value || "")
    .normalize("NFKD")
    // Drop accents so "Sneakérs" and "Sneakers" produce the same slug.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_NAME_LENGTH)
    .replace(/-+$/g, "");

/** The canonical URL path segment for a product. */
export const productSlug = (product) => {
  if (!product?.id) return "";
  const name = slugifyName(product.name);
  return name ? `${name}-${product.id}` : String(product.id);
};

/**
 * The document id embedded in a slug.
 *
 * Returns the trailing segment, or the whole value when there is no hyphen
 * (an old id-only URL). Callers should fall back to the raw slug if this
 * lookup misses, since a legacy id could itself contain a hyphen.
 */
export const productIdFromSlug = (slug) => {
  const value = String(slug || "");
  const index = value.lastIndexOf("-");
  return index === -1 ? value : value.slice(index + 1);
};

/** Full path, for sitemaps, schema and share links. */
export const productPath = (product) => `/product/${productSlug(product)}`;
