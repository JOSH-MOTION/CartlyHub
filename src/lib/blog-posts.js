/**
 * Blog posts, file-based.
 *
 * No CMS or database — posts are written and reviewed the same way the rest
 * of the codebase changes: as a commit. That matches how this actually gets
 * written (one person, roughly weekly), and skips building an admin UI and
 * a Firestore collection for content nobody but one author ever edits.
 *
 * `content` is a small block format instead of markdown/MDX, so no parser
 * dependency is needed for what is, for now, a handful of posts.
 */

export const BLOG_POSTS = [
  {
    slug: 'buying-safely-online-in-ghana',
    title: 'Buying Safely Online in Ghana: A Practical Checklist',
    description:
      "Online shopping scams are common in Ghana — fake listings, sellers who vanish after payment, counterfeit goods. Here's a practical checklist for buying safely, whether you're on Cartly Hub or anywhere else.",
    publishedAt: '2026-09-08',
    category: 'Buyer Guides',
    coverImage: '/blog/buying-safely-online-in-ghana.png',
    content: [
      {
        type: 'paragraph',
        text: "Online shopping in Ghana has grown fast — and so has the number of people who've been burned by it. A seller who takes mobile money and disappears. A phone that arrives as a brick in a box. A \"Nike\" hoodie that falls apart after one wash. None of this means you should avoid buying online — it means you should buy the way people who've been doing it for years actually do it.",
      },
      { type: 'heading', text: 'Check who you\'re actually buying from' },
      {
        type: 'paragraph',
        text: "The single biggest predictor of a bad online purchase in Ghana isn't the price — it's the seller. An anonymous WhatsApp number with no history, no reviews, and no storefront is a red flag by itself, even if the price looks great. Before you pay anyone, look for a real store profile: a store name, a location, and ideally some reviews from other buyers. On Cartly Hub, every seller has their own storefront page — you can see their rating, how many people have reviewed them, and how long they've been listing.",
      },
      { type: 'heading', text: 'Never pay the full amount to an unverified stranger' },
      {
        type: 'list',
        items: [
          "If a deal only works by sending mobile money to a personal number with no order record anywhere, that's the scam pattern — walk away.",
          'Prefer platforms that keep a record of your order (an order number, a receipt, a chat log) over a payment that leaves no trail if something goes wrong.',
          'For anything over a small amount, cash or mobile money on delivery is safer than paying 100% upfront to someone you\'ve never bought from before.',
        ],
      },
      { type: 'heading', text: 'Read the actual listing, not just the photo' },
      {
        type: 'paragraph',
        text: 'A striking product photo sells the click, but the description sells the truth. Genuine sellers describe the material, the condition (brand new vs. used vs. refurbished), and what\'s actually included. A listing with no description at all, or one that\'s copy-pasted stock text with no specifics, is worth a direct question to the seller before you pay — a real seller will answer quickly.',
      },
      { type: 'heading', text: 'Confirm delivery details before you pay, not after' },
      {
        type: 'paragraph',
        text: "Ask exactly where the seller delivers, roughly how long it takes, and what happens if the item doesn't match what was described. A seller who dodges this question, or who pressures you to pay immediately \"before the price goes up,\" is using urgency to stop you from thinking it through — which is exactly what a scam relies on.",
      },
      { type: 'heading', text: 'If it feels rushed, it probably is' },
      {
        type: 'paragraph',
        text: "Genuine sellers want repeat customers, so they're not in a hurry to pressure you into a bad decision. If something feels off — a price that's suspiciously low, a seller who won't answer a basic question, an account created yesterday with zero history — trust that instinct. It's usually right.",
      },
      {
        type: 'paragraph',
        text: 'For more on how Cartly Hub verifies sellers and what to do if something goes wrong with an order, see our [safety tips](/safety-tips) page. And if you\'re ready to browse, verified sellers across fashion, electronics, home goods and more are listed on [Cartly Hub](/products).',
      },
    ],
  },
];

export const getBlogPost = (slug) => BLOG_POSTS.find((post) => post.slug === slug) || null;

export const getBlogPosts = () =>
  [...BLOG_POSTS].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
