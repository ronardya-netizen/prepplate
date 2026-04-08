import { NextRequest, NextResponse } from "next/server";


const SERP_API_KEY = process.env.SERP_API_KEY;
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;


const STORE_NAMES = ["Maxi", "IGA", "Metro", "Walmart", "Costco", "Super C"];


async function getNearbyStores(postalCode: string, radiusKm: number): Promise<{ name: string; address: string; placeId: string }[]> {
  const query = encodeURIComponent(`grocery store near ${postalCode} Canada`);
  const radius = radiusKm * 1000;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&radius=${radius}&key=${GOOGLE_MAPS_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results) return [];
  return data.results
    .filter((r: { name: string }) => STORE_NAMES.some((s) => r.name.toLowerCase().includes(s.toLowerCase())))
    .slice(0, 6)
    .map((r: { name: string; formatted_address: string; place_id: string }) => ({
      name: r.name,
      address: r.formatted_address,
      placeId: r.place_id,
    }));
}


async function getPriceFromSerp(ingredient: string, storeName: string, postalCode: string): Promise<number | null> {
  const query = encodeURIComponent(`${ingredient} price ${storeName} ${postalCode}`);
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${query}&api_key=${SERP_API_KEY}&location=Canada&hl=en&gl=ca`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const results = data.shopping_results ?? [];
    if (!results.length) return null;
    const first = results[0];
    const priceStr = first.price?.replace(/[^0-9.]/g, "");
    return priceStr ? parseFloat(priceStr) : null;
  } catch {
    return null;
  }
}


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postalCode = searchParams.get("postalCode");
  const radiusKm = parseInt(searchParams.get("radius") ?? "5");
  const ingredients = (searchParams.get("ingredients") ?? "").split(",").filter(Boolean);


  if (!postalCode) return NextResponse.json({ error: "postalCode required" }, { status: 400 });
  if (!SERP_API_KEY || !GOOGLE_MAPS_KEY) return NextResponse.json({ error: "API keys not configured" }, { status: 500 });


  const stores = await getNearbyStores(postalCode, radiusKm);
  if (!stores.length) return NextResponse.json({ stores: [], results: [] });


  const results = await Promise.all(
    ingredients.map(async (ingredient) => {
      const storePrices = await Promise.all(
        stores.map(async (store) => {
          const price = await getPriceFromSerp(ingredient, store.name, postalCode);
          return { storeName: store.name, address: store.address, price };
        })
      );
      const available = storePrices.filter((s) => s.price !== null) as { storeName: string; address: string; price: number }[];
      available.sort((a, b) => a.price - b.price);
      return { ingredient, stores: available, cheapest: available[0] ?? null };
    })
  );


  return NextResponse.json({ stores, results });
}
