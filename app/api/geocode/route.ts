import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postalCode = searchParams.get("postalCode");


  if (!postalCode) return NextResponse.json({ error: "postalCode required" }, { status: 400 });


  try {
    const formatted = postalCode.replace(/\s/g, "").toUpperCase();
    const spaced = formatted.length === 6 ? `${formatted.slice(0, 3)} ${formatted.slice(3)}` : formatted;


    // Use Google Geocoding API
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(spaced + ", Canada")}&components=country:CA&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();


    if (googleData.status === "OK" && googleData.results?.length > 0) {
      const result = googleData.results[0];
      const { lat, lng } = result.geometry.location;
      const city = result.address_components?.find((c: { types: string[] }) =>
        c.types.includes("locality") || c.types.includes("sublocality")
      )?.long_name ?? spaced;
      return NextResponse.json({ lat, lng, label: `${spaced} · ${city}`, source: "google" });
    }


    // Fallback: Nominatim with Canada country code
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(formatted)}&country=Canada&format=json&limit=1`;
    const nominatimRes = await fetch(nominatimUrl, { headers: { "User-Agent": "PrepPlate/1.0" } });
    const nominatimData = await nominatimRes.json();


    if (nominatimData?.length > 0) {
      const { lat, lon, display_name } = nominatimData[0];
      const city = display_name.split(",")[0]?.trim() ?? spaced;
      return NextResponse.json({ lat: parseFloat(lat), lng: parseFloat(lon), label: `${spaced} · ${city}`, source: "nominatim" });
    }


    return NextResponse.json({ error: "Postal code not found in Canada" }, { status: 404 });
  } catch (err) {
    console.error("Geocode error:", err);
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
