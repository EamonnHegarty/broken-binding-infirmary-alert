import type { Product } from "./types";

const INFIRMARY_URL =
  "https://thebrokenbindingsub.com/collections/the-infirmary/products.json";

const USER_AGENT = "tbb-infirmary-monitor/1.0";

export function parseProducts(raw: unknown): Product[] {
  const data = raw as { products: Product[] };
  if (!Array.isArray(data.products)) throw new Error("Unexpected API shape");
  return data.products;
}

export async function fetchInfirmaryProducts(): Promise<Product[]> {
  const res = await fetch(INFIRMARY_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`Shopify fetch failed: HTTP ${res.status}`);
  const raw = await res.json();
  return parseProducts(raw);
}
