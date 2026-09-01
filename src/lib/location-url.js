/**
 * Location pages ("Electronics for sale in Lapaz").
 *
 * A product's `location` field is free text a seller typed at listing time
 * ("Nii boi town near lapaz", "Mawuli gate, Ho.") — there's no dropdown
 * behind it, so it can't be used directly as a URL slug. This is a curated
 * list of known areas matched against that text by loose substring rules,
 * ordered neighborhood-first so e.g. "East legon Accra" resolves to East
 * Legon and not the generic Accra bucket.
 *
 * A location with zero matching products in a category never gets a page
 * (see category/[slug]/[location]/page.jsx, which 404s rather than render
 * empty) — so it's safe to list areas with no current listings; they just
 * stay dormant until a seller lists something there.
 */
export const KNOWN_LOCATIONS = [
  { slug: "lapaz", name: "Lapaz", match: (l) => l.includes("lapaz") },
  { slug: "amasaman", name: "Amasaman", match: (l) => l.includes("amasaman") },
  { slug: "cantonments", name: "Cantonments", match: (l) => l.includes("canto") },
  { slug: "east-legon", name: "East Legon", match: (l) => l.includes("east legon") || l.includes("eastlegon") },
  { slug: "ashaiman", name: "Ashaiman", match: (l) => l.includes("ashaiman") },
  { slug: "circle", name: "Circle", match: (l) => l.includes("circle") },
  { slug: "taifa", name: "Taifa", match: (l) => l.includes("taifa") },
  { slug: "madina", name: "Madina", match: (l) => l.includes("madina") },
  { slug: "spintex", name: "Spintex", match: (l) => l.includes("spintex") },
  { slug: "osu", name: "Osu", match: (l) => l.includes("osu") },
  { slug: "dansoman", name: "Dansoman", match: (l) => l.includes("dansoman") },
  { slug: "achimota", name: "Achimota", match: (l) => l.includes("achimota") },
  { slug: "adenta", name: "Adenta", match: (l) => l.includes("adenta") },
  { slug: "tema", name: "Tema", match: (l) => l.includes("tema") },
  { slug: "kasoa", name: "Kasoa", match: (l) => l.includes("kasoa") },
  { slug: "ho", name: "Ho", match: (l) => /\bho\b/.test(l) || l.includes("mawuli") },
  { slug: "kumasi", name: "Kumasi", match: (l) => l.includes("kumasi") },
  { slug: "takoradi", name: "Takoradi", match: (l) => l.includes("takoradi") },
  { slug: "tamale", name: "Tamale", match: (l) => l.includes("tamale") },
  { slug: "cape-coast", name: "Cape Coast", match: (l) => l.includes("cape coast") },
  { slug: "koforidua", name: "Koforidua", match: (l) => l.includes("koforidua") },
  { slug: "sunyani", name: "Sunyani", match: (l) => l.includes("sunyani") },
  // Generic city fallback — exact match only, so it never steals a hit from
  // a more specific neighborhood entry above that also happens to mention
  // "Accra" (e.g. "Amasaman, Accra").
  { slug: "accra", name: "Accra", match: (l) => l.trim() === "accra" },
];

export const locationForProduct = (product) => {
  const text = String(product?.location || "").toLowerCase();
  if (!text.trim()) return null;
  return KNOWN_LOCATIONS.find((entry) => entry.match(text)) || null;
};

export const locationBySlug = (slug) =>
  KNOWN_LOCATIONS.find((entry) => entry.slug === slug) || null;
