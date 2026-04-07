import { NextRequest, NextResponse } from "next/server";
import ingredientsData from "@/data/ingredients.json";


interface Ingredient { id: string; name: string; nameFr?: string; emoji?: string; category: string; unit: string; basePrice: number; defaultShelfDays: number; }


export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "No image provided" }, { status: 400 });


    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: imageBase64 },
            },
            {
              type: "text",
              text: `This is a grocery receipt. Extract two things:
1. All food ingredients and grocery items purchased
2. The total amount paid (look for TOTAL, SUBTOTAL, MONTANT, or the final amount)


Return ONLY a JSON object in this exact format, nothing else. No markdown, no explanation:
{"ingredients": ["eggs", "pasta", "olive oil"], "total": 24.50}


If you cannot find a total, use null for total.
Only include actual food/cooking ingredients in the ingredients array. Ignore non-food items, store names, dates, taxes separately.`,
            },
          ],
        }],
      }),
    });


    const data = await response.json();
    const text = data.content?.[0]?.text ?? "{}";
    let parsed: { ingredients: string[]; total: number | null } = { ingredients: [], total: null };
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch { parsed = { ingredients: [], total: null }; }


    const detectedNames = parsed.ingredients ?? [];
    const receiptTotal = parsed.total ?? null;


    const ingredients = ingredientsData as Ingredient[];
    const matched: { ingredient: Ingredient; matched: true }[] = [];
    const unmatched: { name: string; matched: false }[] = [];


    for (const name of detectedNames) {
      const lower = name.toLowerCase();
      const found = ingredients.find((i) =>
        i.name.toLowerCase() === lower ||
        i.name.toLowerCase().includes(lower) ||
        lower.includes(i.name.toLowerCase())
      );
      if (found) {
        if (!matched.find((m) => m.ingredient.id === found.id)) {
          matched.push({ ingredient: found, matched: true });
        }
      } else {
        unmatched.push({ name, matched: false });
      }
    }


    return NextResponse.json({ matched, unmatched, receiptTotal });
  } catch (err) {
    console.error("Scan receipt error:", err);
    return NextResponse.json({ error: "Failed to scan receipt" }, { status: 500 });
  }
}
