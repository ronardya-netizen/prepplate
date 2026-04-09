import { NextRequest, NextResponse } from "next/server";


const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postalCode = searchParams.get("postalCode")?.trim().toUpperCase().replace(/\s/g, "");


  if (!postalCode) {
    return NextResponse.json({ error: "postalCode is required" }, { status: 400 });
  }


  if (!GOOGLE_MAPS_KEY) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 });
  }


  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postalCode)}&components=country:CA&key=${GOOGLE_MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();


    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ error: "Could not find that postal code" }, { status: 404 });
    }


    const result = data.results[0];
    const components = result.address_components as {
      long_name: string;
      short_name: string;
      types: string[];
    }[];


    const city =
      components.find((c) => c.types.includes("locality"))?.long_name ??
      components.find((c) => c.types.includes("sublocality"))?.long_name ??
      components.find((c) => c.types.includes("administrative_area_level_2"))?.long_name ??
      "Unknown";


    const province =
      components.find((c) => c.types.includes("administrative_area_level_1"))?.short_name ?? "Unknown";


    // locationString is used by the prices API to scope store searches
    const locationString = `${city}, ${province}, Canada`;


    return NextResponse.json({ city, province, locationString });
  } catch {
    return NextResponse.json({ error: "Failed to geocode postal code" }, { status: 500 });
  }
}
