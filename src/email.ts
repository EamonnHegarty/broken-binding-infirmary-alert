import { Resend } from "resend";
import type { Product } from "./types";

const STORE_URL = "https://thebrokenbindingsub.com/products";

export function buildEmailContent(products: Product[]): {
  subject: string;
  text: string;
} {
  const subject =
    products.length === 1
      ? `🚨 New TBB Infirmary Drop: ${products[0].title}`
      : `🚨 ${products.length} new TBB Infirmary drops`;

  const lines = products
    .map((p) => {
      const v = p.variants[0];
      const availability = v.available ? "Available" : "Sold Out";
      return `- ${p.title} | £${v.price} | ${availability}\n  ${STORE_URL}/${p.handle}`;
    })
    .join("\n\n");

  const text = `New item(s) in The Broken Binding Infirmary:\n\n${lines}\n\nGet in quick.`;

  return { subject, text };
}

export async function sendAlert(
  products: Product[],
  apiKey: string,
  from: string,
  to: string,
): Promise<void> {
  const resend = new Resend(apiKey);
  const { subject, text } = buildEmailContent(products);

  const { error } = await resend.emails.send({ from, to, subject, text });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
