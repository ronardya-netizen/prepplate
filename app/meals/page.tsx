"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import recipesData from "@/data/recipes.json";
import storePricesData from "@/data/store-prices.json";
import ingredientsData from "@/data/ingredients.json";
import promotionsData from "@/data/promotions.json";

interface Recipe { id: string; title: string; description: string; prepTimeMin: number; dietTags: string[]; cuisine: string; emoji: string; ingredients: { ingredientId: string; quantity: number; unit: string; isOptional?: boolean }[]; }
interface StorePrice { storeId: string; storeName: string; price: number; salePrice: number | null; effectivePrice: number; unit: string; inStock: boolean; }
interface StorePriceData { ingredientId: string; name: string; stores: { storeId: string; storeName: string; price: number; salePrice: number | null; unit: string; inStock: boolean; }[]; }
interface IngredientData { id: string; name: string; category: string; unit: string; basePrice: number; }
interface Promotion { ingredientId: string; discountPct: number; validFrom: string; validUntil: string; }

const PANTRY_IDS = ["ing-001","ing-002","ing-004","ing-005","ing-008","ing-010","ing-011","ing-014"];
const STORE_URLS: Record<string, string> = { maxi: "https://www.maxi.ca/en/search?q=", iga: "https://www.iga.net/en/search?term=", metro: "https://www.metro.ca/en/search?filter=", walmart: "https://www.walmart.ca/search?q=", instacart: "https://www.instacart.ca/store/search_v3/term?term=", amazon: "https://www.amazon.ca/s?k=" };

function getCheapestStore(ingredientId: string, name: string): (StorePrice & { buyUrl: string }) | null {
  const item = (storePricesData as StorePriceData[]).find((d) => d.ingredientId === ingredientId);
  if (!item) return null;
  const available = item.stores.filter((s) => s.inStock).map((s) => ({ ...s, effectivePrice: s.salePrice ?? s.price, buyUrl: `${STORE_URLS[s.storeId] ?? "#"}${encodeURIComponent(name)}` }));
  if (!available.length) return null;
  return available.sort((a, b) => a.effectivePrice - b.effectivePrice)[0];
}

function getEffectivePrice(ingredientId: string): number {
  const now = new Date();
  const promo = (promotionsData as Promotion[]).find((p) => p.ingredientId === ingredientId && new Date(p.validFrom) <= now && new Date(p.validUntil) >= now);
  const ing = (ingredientsData as IngredientData[]).find((i) => i.id === ingredientId);
  if (!ing) return 0;
  return ing.basePrice * (1 - (promo?.discountPct ?? 0) / 100);
}

export default function MyMealsPage() {
  const [bookmarked, setBookmarked] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("bookmarked-meals");
    if (saved) setBookmarked(JSON.parse(saved));
  }, []);

  function removeBookmark(id: string) {
    const updated = bookmarked.filter((b) => b !== id);
    setBookmarked(updated);
    localStorage.setItem("bookmarked-meals", JSON.stringify(updated));
  }

  const recipes = recipesData as Recipe[];
  const myMeals = recipes.filter((r) => bookmarked.includes(r.id));
  const pantrySet = new Set(PANTRY_IDS);

  const allMissingIds = new Set<string>();
  myMeals.forEach((meal) => meal.ingredients.filter((i) => !i.isOptional && !pantrySet.has(i.ingredientId)).forEach((i) => allMissingIds.add(i.ingredientId)));

  const missingIngredients = Array.from(allMissingIds).map((id) => {
    const ing = (ingredientsData as IngredientData[]).find((i) => i.id === id);
    if (!ing) return null;
    const cheapest = getCheapestStore(id, ing.name);
    const effectivePrice = getEffectivePrice(id);
    const usedInMeals = myMeals.filter((m) => m.ingredients.some((i) => i.ingredientId === id)).map((m) => m.title);
    return { id, name: ing.name, category: ing.category, effectivePrice, cheapest, usedInMeals };
  }).filter(Boolean) as { id: string; name: string; category: string; effectivePrice: number; cheapest: (StorePrice & { buyUrl: string }) | null; usedInMeals: string[] }[];

  const totalMissingCost = missingIngredients.reduce((sum, i) => sum + (i.cheapest?.effectivePrice ?? i.effectivePrice), 0);

  const H = { background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={H}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="P'tit Chef" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>P&apos;tit Chef</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>Eat smart. Save more. Share more.</div>
            </div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>My meals 🔖</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>{myMeals.length} meal{myMeals.length !== 1 ? "s" : ""} saved · {missingIngredients.length} items to buy</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        {myMeals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔖</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#3a1f0d", marginBottom: 8 }}>No meals saved yet</div>
            <div style={{ fontSize: 13, color: "#c09878", fontWeight: 600, marginBottom: 20 }}>Go to Home and tap the bookmark icon on any meal</div>
            <Link href="/home" style={{ background: "#e8470d", color: "#fff", padding: "12px 24px", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 800 }}>Browse meals</Link>
          </div>
        ) : (
          <>
            {/* Saved meals */}
            <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>Saved meals</div>
            <div style={{ padding: "0 16px 16px" }}>
              {myMeals.map((meal) => {
                const missing = meal.ingredients.filter((i) => !i.isOptional && !pantrySet.has(i.ingredientId));
                const cost = meal.ingredients.reduce((sum, i) => sum + getEffectivePrice(i.ingredientId) * i.quantity, 0);
                return (
                  <div key={meal.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: 12, marginBottom: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fff8f4", border: "1px solid #fad8c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{meal.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{meal.title}</div>
                      <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>{meal.prepTimeMin} min · ~${cost.toFixed(2)} · {missing.length} to buy</div>
                    </div>
                    <button onClick={() => removeBookmark(meal.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#e8470d" }}>🔖</button>
                  </div>
                );
              })}
            </div>

            {/* Missing ingredients */}
            {missingIngredients.length > 0 && (
              <>
                <div style={{ margin: "0 16px 12px", background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>Shopping list</div>
                    <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>{missingIngredients.length} items needed</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#e8470d" }}>${totalMissingCost.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: "#c09878", fontWeight: 600 }}>best price</div>
                  </div>
                </div>

                <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>What to buy · best price today</div>
                <div style={{ padding: "0 16px" }}>
                  {missingIngredients.map((item) => (
                    <div key={item.id} style={{ padding: "10px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: 12, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>For: {item.usedInMeals.join(", ")}</div>
                        </div>
                        {item.cheapest ? (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#e8470d" }}>${item.cheapest.effectivePrice.toFixed(2)}</div>
                            <div style={{ fontSize: 10, color: "#2d6a3f", fontWeight: 700 }}>{item.cheapest.storeName}</div>
                            {item.cheapest.salePrice && <div style={{ fontSize: 9, background: "#e8f5ec", color: "#2d6a3f", padding: "1px 5px", borderRadius: 4, fontWeight: 800, marginTop: 2 }}>SALE</div>}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#e8470d" }}>${item.effectivePrice.toFixed(3)}</div>
                        )}
                        {item.cheapest && (
                          <a href={item.cheapest.buyUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 10px", borderRadius: 8, background: "#e8470d", color: "#fff", fontSize: 11, fontWeight: 800, textDecoration: "none", flexShrink: 0 }}>Buy</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}