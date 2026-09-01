import { getProducts, getCategories, getAllSellers } from '../utils/firebaseData';
import { slugForCategory } from '../lib/category-url';
import { locationForProduct } from '../lib/location-url';
import { productSlug } from '../lib/product-url';

/**
 * Sitemap.
 *
 * Only publicly indexable pages belong here. Anything robots.js disallows
 * (/cart, /checkout, /account, /admin) must stay out — submitting a blocked
 * URL produces a "Submitted URL blocked by robots.txt" error in Search
 * Console and wastes crawl budget.
 */
export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

  const staticRoutes = [
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/terms`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/refund`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/cookies`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/safety-tips`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/seller-policy`, changeFrequency: 'monthly', priority: 0.4 },
  ].map((route) => ({ ...route, lastModified: new Date() }));

  let productRoutes = [];
  let locationRoutes = [];
  try {
    const products = await getProducts();
    productRoutes = products.map((product) => ({
      url: `${baseUrl}/product/${productSlug(product)}`,
      lastModified: product.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Category × location pages ("Electronics in Lapaz") — one per real
    // (categoryId, matched location) combination that has at least one
    // listing. Same source data as productRoutes above, no extra fetch.
    const seenLocationRoutes = new Set();
    for (const product of products) {
      const location = locationForProduct(product);
      if (!location || !product.categoryId) continue;
      const key = `${product.categoryId}::${location.slug}`;
      if (seenLocationRoutes.has(key)) continue;
      seenLocationRoutes.add(key);
      locationRoutes.push({
        url: `${baseUrl}/category/${slugForCategory(product.categoryId)}/${location.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  // Vendor storefronts. On a marketplace these are a large share of the
  // indexable surface — every verified seller is its own landing page.
  let storeRoutes = [];
  try {
    const sellers = await getAllSellers();
    storeRoutes = sellers
      .filter((seller) => seller.storeName && !seller.isSuspended)
      .map((seller) => ({
        url: `${baseUrl}/store/${encodeURIComponent(seller.storeName)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
  } catch (error) {
    console.error('Error fetching sellers for sitemap:', error);
  }

  // Real category paths, not `/products?category=x`. Google consolidates
  // query-string variants of one route, so those 240 URLs competed as a single
  // page; a path per category gives each its own rankable page.
  let categoryRoutes = [];
  try {
    const categories = await getCategories();
    categoryRoutes = categories.map((category) => ({
      url: `${baseUrl}/category/${slugForCategory(category.id)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      // Top-level categories are the ones worth crawling most often.
      priority: category.level === 1 ? 0.8 : category.level === 2 ? 0.6 : 0.5,
    }));
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  return [...staticRoutes, ...productRoutes, ...storeRoutes, ...categoryRoutes, ...locationRoutes];
}
