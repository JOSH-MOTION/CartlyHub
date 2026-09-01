import { cache } from "react";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { getProducts, getCategories } from "@/utils/firebaseData";
import { slugForCategory, categoryIdFromSlug } from "@/lib/category-url";
import { locationForProduct } from "@/lib/location-url";
import { productSlug } from "@/lib/product-url";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

/**
 * Category landing pages.
 *
 * These replace `/products?category=x` as the indexable form. Google treats a
 * query string as the same page with parameters and consolidates them, so 240
 * filter URLs competed as one. A real path per category gives each its own
 * title, copy and schema — the thing that actually ranks on a marketplace.
 *
 * The filter UI on /products keeps working unchanged; this is additive.
 */

const loadCategories = cache(async () => getCategories());

const loadCategory = cache(async (slug) => {
  const categories = await loadCategories();
  const id = categoryIdFromSlug(slug);
  return categories.find((category) => category.id === id) || null;
});

const loadProducts = cache(async (categoryId) => getProducts({ category: categoryId }));

export async function generateMetadata({ params }) {
  const category = await loadCategory(params.slug);
  if (!category) return { title: "Category Not Found | Cartly Hub" };

  // The root layout appends "| Buy Online in Ghana | Cartly Hub", so the page
  // title carries only the distinctive part. Open Graph ignores that template,
  // so it gets the full descriptive string.
  const title = category.name;
  const socialTitle = `${category.name} in Ghana | Cartly Hub`;
  const description = `Shop ${category.name.toLowerCase()} in Ghana on Cartly Hub. Browse listings from verified Ghanaian sellers with secure payment and delivery in Accra, Kumasi and nationwide.`;
  const url = `${SITE_URL}/category/${params.slug}`;

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
      images: [{ url: `${SITE_URL}/cartly-og.png`, width: 1200, height: 630, alt: category.name }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description },
  };
}

export default async function CategoryPage({ params }) {
  const category = await loadCategory(params.slug);
  if (!category) notFound();

  const [products, categories] = await Promise.all([
    loadProducts(category.id),
    loadCategories(),
  ]);

  const parent = category.parentId
    ? categories.find((entry) => entry.id === category.parentId)
    : null;

  const children = categories.filter((entry) => entry.parentId === category.id);

  // Only meaningful for top-level categories — locationForProduct matches
  // against product.categoryId, which is always the top-level id (the add
  // flow never stores a subcategory there).
  const locations = [
    ...new Map(
      products
        .map((product) => locationForProduct(product))
        .filter(Boolean)
        .map((entry) => [entry.slug, entry]),
    ).values(),
  ];

  const breadcrumb = [
    { name: "Home", item: SITE_URL },
    ...(parent
      ? [{ name: parent.name, item: `${SITE_URL}/category/${slugForCategory(parent.id)}` }]
      : []),
    { name: category.name, item: `${SITE_URL}/category/${params.slug}` },
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
      name: `${category.name} in Ghana`,
      url: `${SITE_URL}/category/${params.slug}`,
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
          {parent && (
            <>
              <span aria-hidden="true">/</span>
              <a href={`/category/${slugForCategory(parent.id)}`} className="hover:text-black transition-colors">
                {parent.name}
              </a>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="text-black">{category.name}</span>
        </nav>

        <header className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">
            {category.name} in Ghana
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Browse {products.length} {products.length === 1 ? "listing" : "listings"} in{" "}
            {category.name.toLowerCase()} from verified Ghanaian sellers on Cartly Hub.
            Pay securely online or message the seller on WhatsApp, with delivery in Accra,
            Kumasi and across Ghana.
          </p>
        </header>

        {children.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Browse {category.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {children.map((child) => (
                <a
                  key={child.id}
                  href={`/category/${slugForCategory(child.id)}`}
                  className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-xs font-bold transition-colors"
                >
                  {child.name}
                </a>
              ))}
            </div>
          </section>
        )}

        {locations.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Shop {category.name} by Area
            </h2>
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <a
                  key={location.slug}
                  href={`/category/${params.slug}/${location.slug}`}
                  className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-black hover:text-white text-xs font-bold transition-colors"
                >
                  {location.name}
                </a>
              ))}
            </div>
          </section>
        )}

        {products.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <h2 className="text-xl font-black uppercase tracking-tight">
              Nothing listed here yet
            </h2>
            <p className="text-gray-500 text-sm">
              No one is selling {category.name.toLowerCase()} on Cartly Hub right now.
            </p>
            <a
              href="/products"
              className="inline-block bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
              Browse everything
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
