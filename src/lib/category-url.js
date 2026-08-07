/**
 * Category URL slugs.
 *
 * Category ids use underscores (`womens_shoes`); URLs read better and rank
 * better with hyphens (`/category/womens-shoes`). Kept in its own module
 * because an App Router `page.jsx` may only export the framework's reserved
 * names — an extra named export there fails the build's type check.
 */
export const slugForCategory = (id) => String(id).replace(/_/g, "-");

export const categoryIdFromSlug = (slug) => String(slug).replace(/-/g, "_");
