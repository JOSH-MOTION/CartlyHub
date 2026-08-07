// Throwaway: does any product actually carry compareAtPrice in Firestore?
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const snap = await getDocs(collection(getFirestore(app), "products"));

let withDiscount = 0;
const rows = [];

snap.docs.forEach((d) => {
  const p = d.data();
  const variantCompare = (p.variants || []).some(
    (v) => Number(v.compareAtPrice) > Number(v.price),
  );
  const productCompare = Number(p.compareAtPrice) > Number(p.basePrice);
  if (variantCompare || productCompare) withDiscount += 1;

  rows.push({
    name: String(p.name || "").slice(0, 26),
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice ?? null,
    variantPrices: (p.variants || [])
      .slice(0, 2)
      .map((v) => `${v.price}/${v.compareAtPrice ?? "null"}`)
      .join(" "),
  });
});

console.log(`products: ${snap.size}, with a discount set: ${withDiscount}\n`);
console.log("name                        base  compareAt  variants(price/compareAt)");
rows.slice(0, 12).forEach((r) =>
  console.log(
    r.name.padEnd(28) +
      String(r.basePrice).padEnd(6) +
      String(r.compareAtPrice).padEnd(11) +
      r.variantPrices,
  ),
);
process.exit(0);
