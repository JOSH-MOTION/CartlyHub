import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getBlogPosts } from "@/lib/blog-posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

export const metadata = {
  title: "Blog",
  description: "Buyer guides, seller tips, and updates from Cartly Hub — Ghana's online marketplace.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Cartly Hub Blog",
    description: "Buyer guides, seller tips, and updates from Cartly Hub — Ghana's online marketplace.",
    url: `${SITE_URL}/blog`,
    siteName: "Cartly Hub",
    type: "website",
    images: [{ url: `${SITE_URL}/cartly-og.png`, width: 1200, height: 630, alt: "Cartly Hub Blog" }],
  },
};

export default function BlogIndexPage() {
  const posts = getBlogPosts();

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <header className="space-y-3 mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 block">
            Cartly Hub
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">Blog</h1>
          <p className="text-gray-500 text-sm max-w-xl leading-relaxed">
            Buyer guides, seller tips, and the occasional update on what's new.
          </p>
        </header>

        <div className="space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full sm:w-48 h-32 object-cover rounded-xl border border-gray-100 shrink-0"
                />
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                  {post.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-2 mb-3">{post.title}</h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-3">{post.description}</p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {new Date(post.publishedAt).toLocaleDateString("en-GH", { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
