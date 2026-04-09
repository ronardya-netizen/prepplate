import { NextRequest, NextResponse } from "next/server";


const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
const SERP_API_KEY = process.env.SERP_API_KEY;


const KNOWN_CHAINS = [
  "maxi", "iga", "metro", "super c", "superc", "walmart", "provigo",
  "loblaws", "food basics", "foodbasics", "costco", "tigre géant",
  "giant tiger", "freshco", "no frills", "real canadian superstore",
  "sobeys", "safeway", "save-on-foods", "longos", "farm boy",
  "marché adonis", "marché pa", "intermarché", "avril", "rachelle-béry",
];


function matchChain(name: string): string | null {
  const lower = name.toLowerCase();
  return KNOWN_CHAINS.find((c) => lower.includes(c)) ?? null;
}


async function findNearbyStores(postalCode: string, radiusKm: number): Promise<string[]> {
  if (!GOOGLE_MAPS_KEY) return [];
  const query = encodeURIComponent(`grocery store near ${postalCode} Canada`);
  const radius = radiusKm * 1000;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&radius=${radius}&key=${GOOGLE_MAPS_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results) return [];
    // Extract unique chain names from nearby results
    const names = new Set<string>();
    for (const r of data.results) {
      const chain = matchChain(r.name);
      if (chain) names.add(chain);
    }
    return Array.from(names);
  } catch {
    return [];
  }
}


async function searchPrice(ingredient: string, store: string, city: string): Promise<{
  title: string;
  store: string;
  price: number;
  priceDisplay: string;
  link?: string;
  thumbnail?: string;
} | null> {
  if (!SERP_API_KEY) return null;
  const params = new URLSearchParams({
    engine: "google_shopping",
    q: `${ingredient} ${store}`,
    location: "Canada",
    hl: "en",
    gl: "ca",
    api_key: SERP_API_KEY,
  });
  try {
    const res = await fetch(`https://serpapi.com/search?${params}`);
    const data = await res.json();
    const results = data.shopping_results ?? [];
    // Find a result that matches this store
    const match = results.find((r: { source: string }) =>
      r.source.toLowerCase().includes(store.toLowerCase())
    );
    if (!match) return null;
    return {
      title: match.title,
      store: match.source,
      price: match.extracted_price ?? parseFloat(match.price?.replace(/[^0-9.]/g, "") ?? "0"),
      priceDisplay: match.price,
      link: match.link,
      thumbnail: match.thumbnail,
    };
  } catch {
    return null;
  }
}


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ingredient = searchParams.get("ingredient");
  const postalCode = searchParams.get("postalCode") ?? "";
  const location = searchParams.get("location") ?? "Canada";
  const radiusKm = parseInt(searchParams.get("radius") ?? "5");


  if (!ingredient) return NextResponse.json({ error: "ingredient required" }, { status: 400 });


  // Step 1: Find actual nearby stores using Google Places
  let nearbyChains: string[] = [];
  if (postalCode) {
    nearbyChains = await findNearbyStores(postalCode, radiusKm);
  }


  // Step 2: If we found nearby stores, search prices at each one
  if (nearbyChains.length > 0) {
    const city = location.replace(", Canada", "").replace(",Canada", "");
    const priceResults = await Promise.all(
      nearbyChains.map((chain) => searchPrice(ingredient, chain, city))
    );


    const inStore = priceResults
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.price - b.price);


    return NextResponse.json({
      ingredient,
      location,
      nearbyChains,
      results: inStore,
      inStore,
      online: [],
    });
  }


  // Fallback: generic search if no nearby stores found
  try {
    const queryLocation = location.replace(", Canada", "").replace(",Canada", "");
    const params = new URLSearchParams({
      engine: "google_shopping",
      q: `${ingredient} grocery ${queryLocation}`,
      location: "Canada",
      hl: "en",
      gl: "ca",
      api_key: SERP_API_KEY ?? "",
    });


    const res = await fetch(`https://serpapi.com/search?${params}`);
    const data = await res.json();


    const results = (data.shopping_results ?? []).slice(0, 10).map((item: {
      title: string;
      source: string;
      price: string;
      extracted_price?: number;
      thumbnail?: string;
      link?: string;
    }) => ({
      title: item.title,
      store: item.source,
      price: item.extracted_price ?? parseFloat(item.price?.replace(/[^0-9.]/g, "") ?? "0"),
      priceDisplay: item.price,
      thumbnail: item.thumbnail,
      link: item.link,
      type: matchChain(item.source) ? "in-store" : "online",
    }));


    const byStore: Record<string, typeof results[0]> = {};
    for (const r of results) {
      const key = r.store?.toLowerCase() ?? "other";
      if (!byStore[key] || r.price < byStore[key].price) byStore[key] = r;
    }


    const all = Object.values(byStore).sort((a, b) => a.price - b.price);


    return NextResponse.json({
      ingredient,
      location,
      results: all,
      inStore: all.filter((r) => r.type === "in-store"),
      online: all.filter((r) => r.type === "online"),
    });
  } catch (err) {
    console.error("SerpAPI error:", err);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}


