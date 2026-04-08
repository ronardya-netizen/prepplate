import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") ?? "5000";


  if (!lat || !lng) return NextResponse.json({ error: "lat and lng required" }, { status: 400 });


  try {
    // Try multiple place types to cast a wider net
    const types = ["supermarket", "grocery_or_supermarket"];
    const allPlaces: Record<string, GooglePlace> = {};


    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      for (const place of data.results ?? []) {
        allPlaces[place.place_id] = place;
      }
    }


    // Also do a keyword search for grocery stores
    const keywordUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=grocery+supermarket&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const keywordRes = await fetch(keywordUrl);
    const keywordData = await keywordRes.json();
    for (const place of keywordData.results ?? []) {
      allPlaces[place.place_id] = place;
    }


    const stores = Object.values(allPlaces)
      .filter((place) => place.business_status !== "CLOSED_PERMANENTLY")
      .map((place) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        openNow: place.opening_hours?.open_now,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        distance: getDistance(
          parseFloat(lat),
          parseFloat(lng),
          place.geometry.location.lat,
          place.geometry.location.lng
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8);


    return NextResponse.json({ stores });
  } catch (err) {
    console.error("Google Places error:", err);
    return NextResponse.json({ error: "Failed to fetch stores", details: String(err) }, { status: 500 });
  }
}


interface GooglePlace {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  opening_hours?: { open_now?: boolean };
  geometry: { location: { lat: number; lng: number } };
  business_status?: string;
}


function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
