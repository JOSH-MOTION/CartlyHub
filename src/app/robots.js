export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // No trailing slash: robots.txt Disallow is a prefix match, so "/cart"
      // blocks both /cart itself and everything under /cart/. The trailing-
      // slash form only blocked sub-paths — the page at the bare route
      // (e.g. /cart itself, which has no sub-routes) was never actually
      // covered, and Google had it indexed to prove it.
      disallow: ['/admin', '/account', '/cart', '/checkout', '/checkout-ghana', '/seller'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
