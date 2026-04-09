import { NextRequest, NextResponse } from "next/server";


const IN_STORE_CHAINS = [
  "maxi", "iga", "metro", "super c", "superc", "walmart", "provigo",
  "loblaws", "food basics", "foodbasics", "costco", "tigre géant",
  "giant tiger", "freshco", "no frills", "real canadian superstore",
  "sobeys", "safeway", "save-on-foods", "longos", "farm boy",
  "marché adonis", "marché pa", "intermarché", "avril", "rachelle-béry",
];


function isInStore(storeName: string): boolean {
  const lower = storeName.toLowerCase();
  return IN_STORE_CHAINS.some((chain) => lower.includes(chain));
}


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ingredient = searchParams.get("ingredient");
  const location = searchParams.get("location") ?? "Canada";


  if (!ingredient) return NextResponse.json({ error: "ingredient required" }, { status: 400 });


  try {
    // Use city in the query itself for local relevance
    const queryLocation = location.replace(", Canada", "").replace(",Canada", "");
    const params = new URLSearchParams({
      engine: "google_shopping",
      q: `${ingredient} grocery ${queryLocation}`,
      location: "Canada",
      hl: "en",
      gl: "ca",
      api_key: process.env.SERP_API_KEY ?? "",
    });


    const res = await fetch(`https://serpapi.com/search?${params}`);
    const data = await res.json();


    const results = (data.shopping_results ?? []).slice(0, 15).map((item: {
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
      type: isInStore(item.source) ? "in-store" : "online",
    }));


    // Group by store, keep cheapest per store
    const byStore: Record<string, typeof results[0]> = {};
    for (const r of results) {
      const key = r.store?.toLowerCase() ?? "other";
      if (!byStore[key] || r.price < byStore[key].price) {
        byStore[key] = r;
      }
    }


    const all = Object.values(byStore).sort((a, b) => a.price - b.price);
    const inStore = all.filter((r) => r.type === "in-store");
    const online = all.filter((r) => r.type === "online");


    return NextResponse.json({ ingredient, location, results: all, inStore, online });
  } catch (err) {
    console.error("SerpAPI error:", err);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}


