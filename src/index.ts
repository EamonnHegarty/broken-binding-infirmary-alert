import { fetchInfirmaryProducts } from "./shopify";
import { readSeenIds, writeSeenIds } from "./gist";
import { sendAlert } from "./email";
import type { Product } from "./types";

export function findNewProducts(
  products: Product[],
  seenIds: number[],
): Product[] {
  const seen = new Set(seenIds);
  return products.filter((p) => !seen.has(p.id));
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

async function main(): Promise<void> {
  const gistId = requireEnv("GIST_ID");
  const gistToken = requireEnv("GIST_TOKEN");
  const resendApiKey = requireEnv("RESEND_API_KEY");
  const resendFrom = requireEnv("RESEND_FROM");
  const alertEmail = requireEnv("ALERT_EMAIL");

  let products: Product[];
  try {
    products = await fetchInfirmaryProducts();
  } catch (err) {
    console.error("Fetch failed, skipping run:", err);
    process.exit(0);
  }

  console.log(`Fetched ${products.length} product(s) from Infirmary`);

  const seenIds = await readSeenIds(gistId, gistToken);
  const currentIds = products.map((p) => p.id);

  if (seenIds === null) {
    console.log(`First run — seeding state with ${currentIds.length} IDs`);
    await writeSeenIds(gistId, gistToken, currentIds);
    return;
  }

  const newProducts = findNewProducts(products, seenIds);

  if (newProducts.length > 0) {
    console.log(`Found ${newProducts.length} new product(s) — sending alert`);
    await sendAlert(newProducts, resendApiKey, resendFrom, alertEmail);
    console.log("Alert sent");
  } else {
    console.log("No new products");
  }

  await writeSeenIds(gistId, gistToken, currentIds);
  console.log("State updated");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
