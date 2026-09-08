import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogContent from "@/components/BlogContent";
import { getBlogPost } from "@/lib/blog-posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cartlyhubgh.com";

export async function generateMetadata({ params }) {
  const post = getBlogPost(params.slug);
  if (!post) return { title: "Post Not Found | Cartly Hub" };

  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "Cartly Hub",
      type: "article",
      images: [{ url: `${SITE_URL}/cartly-og.png`, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default function BlogPostPage({ params }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    url,
    publisher: { "@type": "Organization", name: "Cartly Hub", url: SITE_URL },
    mainEntityOfPage: url,
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <Link
          href="/blog"
          className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="h-3 w-3 mr-2" />
          Back to Blog
        </Link>

        <header className="space-y-3 mb-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            {post.category}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-tight">{post.title}</h1>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
            {new Date(post.publishedAt).toLocaleDateString("en-GH", { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </header>

        <BlogContent blocks={post.content} />
      </main>

      <Footer />
    </div>
  );
}
