import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ingredient = searchParams.get("ingredient");
  const postalCode = searchParams.get("postal") ?? "H3A1B1";

  if (!ingredient) return NextResponse.json({ error: "ingredient required" }, { status: 400 });

  try {
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(ingredient + " grocery Montreal")}&location=Montreal,Quebec,Canada&hl=en&gl=ca&api_key=${process.env.SERP_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    const results = (data.shopping_results ?? []).slice(0, 5).map((item: {
      title: string;
      price: string;
      source: string;
      link: string;
      thumbnail: string;
    }) => ({
      title: item.title,
      price: item.price,
      store: item.source,
      link: item.link,
      thumbnail: item.thumbnail,
    }));

    return NextResponse.json({ results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ results: [] });
  }
}

