import { NextRequest, NextResponse } from "next/server";
import storePricesData from "@/data/store-prices.json";

interface StorePrice {
  storeId: string;
  storeName: string;
  price: number;
  unit: string;
  inStock: boolean;
  salePrice: number | null;
}

interface IngredientStorePrices {
  ingredientId: string;
  name: string;
  stores: StorePrice[];
}

const STORE_URLS: Record<string, string> = {
  maxi:      "https://www.maxi.ca/en/search?q=",
  iga:       "https://www.iga.net/en/search?term=",
  metro:     "https://www.metro.ca/en/search?filter=",
  walmart:   "https://www.walmart.ca/search?q=",
  instacart: "https://www.instacart.ca/store/search_v3/term?term=",
  amazon:    "https://www.amazon.ca/s?k=",
};

const STORE_COLORS: Record<string, string> = {
  maxi:      "#e8470d",
  iga:       "#e8470d",
  metro:     "#e8470d",
  walmart:   "#0071ce",
  instacart: "#2d6a3f",
  amazon:    "#ff9900",
};

/**
 * GET /api/prices?ingredients=ing-001,ing-002,...
 * Returns per-ingredient price comparison across all stores,
 * with cheapest store highlighted.
 */
export async function GET(req: NextRequest) {
  const ids = new URL(req.url).searchParams.get("ingredients");
  const ingredientIds = ids ? ids.split(",") : [];

  const data = storePricesData as IngredientStorePrices[];

  const results = ingredientIds.map((id) => {
    const item = data.find((d) => d.ingredientId === id);
    if (!item) return null;

    // Find cheapest in-stock store
    const availableStores = item.stores.filter((s) => s.inStock);
    const withEffectivePrice = availableStores.map((s) => ({
      ...s,
      effectivePrice: s.salePrice ?? s.price,
      buyUrl: `${STORE_URLS[s.storeId] ?? "#"}${encodeURIComponent(item.name)}`,
      color: STORE_COLORS[s.storeId] ?? "#888",
    }));

    withEffectivePrice.sort((a, b) => a.effectivePrice - b.effectivePrice);
    const cheapest = withEffectivePrice[0];
    const savings = withEffectivePrice.length > 1
      ? withEffectivePrice[withEffectivePrice.length - 1].effectivePrice - cheapest.effectivePrice
      : 0;

    return {
      ingredientId: id,
      name: item.name,
      cheapestStore: cheapest,
      allStores: withEffectivePrice,
      maxSavings: Math.round(savings * 100) / 100,
    };
  }).filter(Boolean);

  return NextResponse.json({ results });
}