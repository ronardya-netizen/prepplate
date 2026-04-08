import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/location?postalCode=H1A1A1
 * Converts a Canadian postal code to a city name using Google Geocoding API.
 * Returns { city, province, locationString } for use with SERP API.
 */
export async function GET(req: NextRequest) {
  const postalCode = new URL(req.url).searchParams.get("postalCode");
  if (!postalCode) {
    return NextResponse.json({ error: "postalCode is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });
  }

  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postalCode)}&components=country:CA&key=${apiKey}`;

  const geoRes = await fetch(geoUrl);
  const geoData = await geoRes.json();

  if (geoData.status !== "OK" || !geoData.results?.length) {
    return NextResponse.json({ error: "Could not resolve postal code" }, { status: 404 });
  }

  const components: { long_name: string; types: string[] }[] = geoData.results[0].address_components;

  const city =
    components.find((c) => c.types.includes("locality"))?.long_name ??
    components.find((c) => c.types.includes("sublocality"))?.long_name ??
    components.find((c) => c.types.includes("administrative_area_level_3"))?.long_name ??
    "";

  const province =
    components.find((c) => c.types.includes("administrative_area_level_1"))?.long_name ?? "";

  if (!city) {
    return NextResponse.json({ error: "Could not determine city from postal code" }, { status: 404 });
  }

  return NextResponse.json({
    city,
    province,
    locationString: `${city}, ${province}, Canada`,
  });
}
