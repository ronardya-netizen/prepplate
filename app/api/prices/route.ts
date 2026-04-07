import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ingredient = searchParams.get("ingredient");
  const location = searchParams.get("location") ?? "Montreal, QC";


  if (!ingredient) return NextResponse.json({ error: "ingredient required" }, { status: 400 });


  try {
    const params = new URLSearchParams({
      engine: "google_shopping",
      q: `${ingredient} grocery`,
      location,
      hl: "en",
      gl: "ca",
      api_key: process.env.SERP_API_KEY ?? "",
    });


    const res = await fetch(`https://serpapi.com/search?${params}`);
    const data = await res.json();


    const results = (data.shopping_results ?? []).slice(0, 8).map((item: {
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
    }));


    // Group by store and keep cheapest per store
    const byStore: Record<string, typeof results[0]> = {};
    for (const r of results) {
      const key = r.store?.toLowerCase() ?? "other";
      if (!byStore[key] || r.price < byStore[key].price) {
        byStore[key] = r;
      }
    }


    const sorted = Object.values(byStore).sort((a, b) => a.price - b.price);


    return NextResponse.json({ ingredient, location, results: sorted });
  } catch (err) {
    console.error("SerpAPI error:", err);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
