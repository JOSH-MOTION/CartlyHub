import { cache } from "react";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { getProducts, getCategories } from "@/utils/firebaseData";
import { slugForCategory, categoryIdFromSlug } from "@/lib/category-url";
import { locationBySlug, locationForProduct } from "@/lib/location-url";
import { productSlug } from "@/lib/product-url";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

/**
 * Category × location landing pages ("Electronics for sale in Lapaz").
 *
 * These exist for search intent that plain category pages can't capture —
 * "laptop for sale lapaz accra" surfaces Google's local pack ahead of even
 * Jiji, a completely different ranking system than the organic authority
 * battle a generic category page fights. Only rendered when real products
 * back the combination (see the notFound() below) — an empty page here
 * would be exactly the kind of thin doorway page that gets a site penalized
 * rather than ranked.
 */

const loadCategories = cache(async () => getCategories());

const loadCategory = cache(async (slug) => {
  const categories = await loadCategories();
  const id = categoryIdFromSlug(slug);
  return categories.find((category) => category.id === id) || null;
});

const loadCategoryProducts = cache(async (categoryId) => getProducts({ category: categoryId }));

const loadMatch = cache(async (categorySlug, locationSlug) => {
  const category = await loadCategory(categorySlug);
  const location = locationBySlug(locationSlug);
  if (!category || !location) return { category, location: null, products: [] };

  const categoryProducts = await loadCategoryProducts(category.id);
  const products = categoryProducts.filter(
    (product) => locationForProduct(product)?.slug === location.slug,
  );
  return { category, location, products };
});

export async function generateMetadata({ params }) {
  const { category, location, products } = await loadMatch(params.slug, params.location);
  if (!category || !location || products.length === 0) {
    return { title: "Not Found | Cartly Hub" };
  }

  const title = `${category.name} in ${location.name}`;
  const socialTitle = `${category.name} for Sale in ${location.name} | Cartly Hub`;
  const description = `Browse ${products.length} ${category.name.toLowerCase()} listing${products.length === 1 ? "" : "s"} in ${location.name} on Cartly Hub. Buy from verified local sellers with secure payment and fast delivery.`;
  const url = `${SITE_URL}/category/${params.slug}/${params.location}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: "Cartly Hub",
      type: "website",
      images: [{ url: `${SITE_URL}/cartly-og.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description },
  };
}

export default async function CategoryLocationPage({ params }) {
  const { category, location, products } = await loadMatch(params.slug, params.location);

  // No category, no location, or no real listings — a thin page here would
  // do more harm than good, so this is a hard 404, not an empty state.
  if (!category || !location || products.length === 0) notFound();

  const categoryProducts = await loadCategoryProducts(category.id);
  const otherLocations = [
    ...new Map(
      categoryProducts
        .map((product) => locationForProduct(product))
        .filter((entry) => entry && entry.slug !== location.slug)
        .map((entry) => [entry.slug, entry]),
    ).values(),
  ];

  const categorySlug = slugForCategory(category.id);
  const pageUrl = `${SITE_URL}/category/${categorySlug}/${location.slug}`;

  const breadcrumb = [
    { name: "Home", item: SITE_URL },
    { name: category.name, item: `${SITE_URL}/category/${categorySlug}` },
    { name: location.name, item: pageUrl },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumb.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${category.name} in ${location.name}`,
      url: pageUrl,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: products.length,
        itemListElement: products.slice(0, 30).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}/product/${productSlug(product)}`,
          name: product.name,
        })),
      },
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <span aria-hidden="true">/</span>
          <a href={`/category/${categorySlug}`} className="hover:text-black transition-colors">
            {category.name}
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-black">{location.name}</span>
        </nav>

        <header className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">
            {category.name} in {location.name}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {products.length} {products.length === 1 ? "listing" : "listings"} in{" "}
            {category.name.toLowerCase()} from sellers in {location.name}. Pay securely online
            or message the seller on WhatsApp.
          </p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-gray-100">
          <a
            href={`/category/${categorySlug}`}
            className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 text-xs font-bold transition-colors"
          >
            All {category.name} in Ghana
          </a>
          {otherLocations.length > 0 && (
            <>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Also in
              </span>
              {otherLocations.map((entry) => (
                <a
                  key={entry.slug}
                  href={`/category/${categorySlug}/${entry.slug}`}
                  className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-xs font-bold transition-colors"
                >
                  {entry.name}
                </a>
              ))}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
