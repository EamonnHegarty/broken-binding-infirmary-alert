import { describe, it, expect } from "vitest";
import { findNewProducts } from "../index";
import { parseProducts } from "../shopify";
import { buildEmailContent } from "../email";
import type { Product } from "../types";

const makeProduct = (id: number, title: string, available = true): Product => ({
  id,
  title,
  handle: title.toLowerCase().replace(/\s+/g, "-"),
  variants: [{ available, price: "35.00" }],
});

describe("findNewProducts", () => {
  it("returns products not in seenIds", () => {
    const products = [makeProduct(1, "Book A"), makeProduct(2, "Book B")];
    const result = findNewProducts(products, [1]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("returns empty array when all products are seen", () => {
    const products = [makeProduct(1, "Book A"), makeProduct(2, "Book B")];
    const result = findNewProducts(products, [1, 2]);
    expect(result).toHaveLength(0);
  });

  it("returns all products when seenIds is empty (first run equivalent)", () => {
    const products = [makeProduct(1, "Book A"), makeProduct(2, "Book B")];
    const result = findNewProducts(products, []);
    expect(result).toHaveLength(2);
  });
});

describe("parseProducts", () => {
  it("parses a valid Shopify response", () => {
    const raw = {
      products: [makeProduct(42, "Special Edition")],
    };
    const result = parseProducts(raw);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(42);
  });

  it("throws on unexpected shape", () => {
    expect(() => parseProducts({ wrong: "shape" })).toThrow(
      "Unexpected API shape",
    );
  });
});

describe("buildEmailContent", () => {
  it("uses singular subject for one product", () => {
    const products = [makeProduct(1, "Fancy Edition")];
    const { subject } = buildEmailContent(products);
    expect(subject).toBe("🚨 New TBB Infirmary Drop: Fancy Edition");
  });

  it("uses plural subject for multiple products", () => {
    const products = [makeProduct(1, "A"), makeProduct(2, "B")];
    const { subject } = buildEmailContent(products);
    expect(subject).toBe("🚨 2 new TBB Infirmary drops");
  });

  it("includes product details in body", () => {
    const product = makeProduct(1, "Fancy Edition", true);
    const { text } = buildEmailContent([product]);
    expect(text).toContain("Fancy Edition");
    expect(text).toContain("£35.00");
    expect(text).toContain("Available");
    expect(text).toContain("thebrokenbindingsub.com/products/fancy-edition");
    expect(text).toContain("Get in quick.");
  });

  it("marks sold out products correctly", () => {
    const product = makeProduct(1, "Gone Edition", false);
    const { text } = buildEmailContent([product]);
    expect(text).toContain("Sold Out");
  });
});
