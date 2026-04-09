export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carlyhub.surge.sh";

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/', 
        '/admin-login', 
        '/api/admin/',
        '/account/orders', 
        '/cart',
        '/checkout'
      ], // We strictly disallow search engines from indexing the administrative backdoors and user private checkout endpoints.
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
