import { NextRequest, NextResponse } from "next/server";

interface SerpShoppingResult {
  title: string;
  extracted_price?: number;
  price?: string;
  source?: string;
  link?: string;
}

interface StorePrice {
  storeName: string;
  price: number;
  link: string;
}

interface IngredientPrices {
  name: string;
  stores: StorePrice[]; // sorted cheapest first
}

/**
 * GET /api/prices?ingredients=Pasta,Garlic,Butter&location=Montreal,+Quebec,+Canada
 * Fetches live grocery prices from SERP API (Google Shopping),
 * grouped by store and sorted cheapest to most expensive.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ingredientsParam = searchParams.get("ingredients");
  const location = searchParams.get("location");

  if (!ingredientsParam || !location) {
    return NextResponse.json({ error: "ingredients and location are required" }, { status: 400 });
  }

  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SERP_API_KEY not configured" }, { status: 500 });
  }

  const ingredientNames = ingredientsParam.split(",").map((s) => s.trim()).filter(Boolean);

  const results: IngredientPrices[] = await Promise.all(
    ingredientNames.map(async (name): Promise<IngredientPrices> => {
      try {
        const serpUrl = new URL("https://serpapi.com/search.json");
        serpUrl.searchParams.set("engine", "google_shopping");
        serpUrl.searchParams.set("q", name);
        serpUrl.searchParams.set("location", location);
        serpUrl.searchParams.set("gl", "ca");
        serpUrl.searchParams.set("hl", "en");
        serpUrl.searchParams.set("api_key", apiKey);

        const res = await fetch(serpUrl.toString());
        const data = await res.json();

        const shoppingResults: SerpShoppingResult[] = data.shopping_results ?? [];

        // Deduplicate by store — keep cheapest listing per store
        const storeMap = new Map<string, StorePrice>();
        for (const item of shoppingResults) {
          const price = item.extracted_price;
          const storeName = item.source;
          const link = item.link ?? "#";
          if (!price || !storeName) continue;

          const existing = storeMap.get(storeName);
          if (!existing || price < existing.price) {
            storeMap.set(storeName, { storeName, price, link });
          }
        }

        // Sort cheapest first
        const stores = Array.from(storeMap.values()).sort((a, b) => a.price - b.price);

        return { name, stores };
      } catch {
        return { name, stores: [] };
      }
    })
  );

  return NextResponse.json({ results });
}
