export interface ProductVariant {
  available: boolean;
  price: string;
}

export interface Product {
  id: number;
  title: string;
  handle: string;
  variants: ProductVariant[];
}

export interface GistState {
  seenIds: number[];
}
