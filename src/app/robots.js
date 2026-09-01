export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/account/', '/cart/', '/checkout/', '/checkout-ghana/', '/seller/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
