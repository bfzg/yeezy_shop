export type CartLine = {
  id: number | string;
  productId: number;
  variantId: number | null;
  sku: string;
  variantSku: string | null;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  size: string;
  quantity: number;
  stock: number;
};

export function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })}`;
}
