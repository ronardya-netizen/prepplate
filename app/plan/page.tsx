"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import recipesData from "@/data/recipes.json";
import storePricesData from "@/data/store-prices.json";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";

interface Recipe { id: string; title: string; emoji: string; calories: number; prepTimeMin: number; ingredients: { ingredientId: string; quantity: number; unit: string; isOptional?: boolean }[]; }
interface IngredientData { id: string; name: string; category: string; unit: string; basePrice: number; }
interface StorePriceData { ingredientId: string; name: string; stores: { storeId: string; storeName: string; price: number; salePrice: number | null; unit: string; inStock: boolean; }[]; }

const STORE_URLS: Record<string, string> = { maxi: "https://www.maxi.ca/en/search?q=", iga: "https://www.iga.net/en/search?term=", metro: "https://www.metro.ca/en/search?filter=", walmart: "https://www.walmart.ca/search?q=", instacart: "https://www.instacart.ca/store/search_v3/term?term=", amazon: "https://www.amazon.ca/s?k=" };

const STORE_WEBSITE: Record<string, string> = { maxi: "https://www.maxi.ca", iga: "https://www.iga.net", metro: "https://www.metro.ca", walmart: "https://www.walmart.ca", instacart: "https://www.instacart.ca", amazon: "https://www.amazon.ca" };

// Map postal code prefixes to nearby stores (Quebec/Ontario focused)
function getNearbyStores(postalCode: string): string[] {
  const prefix = postalCode.toUpperCase().replace(/\s/g, "").substring(0, 3);
  const qcPrefixes = ["H1", "H2", "H3", "H4", "H5", "H7", "H8", "H9", "J4", "J5", "J6", "J7", "J8", "G1", "G2", "G3"];
  const onPrefixes = ["M1", "M2", "M3", "M4", "M5", "M6", "K1", "K2", "L1", "L2", "L3", "L4"];
  const isQC = qcPrefixes.some((p) => prefix.startsWith(p));
  const isON = onPrefixes.some((p) => prefix.startsWith(p));
  if (isQC) return ["maxi", "iga", "metro", "walmart", "instacart"];
  if (isON) return ["walmart", "metro", "instacart", "amazon"];
  return ["walmart", "instacart", "amazon"];
}

function getCheapest(ingredientId: string, name: string, allowedStores: string[]) {
  const item = (storePricesData as StorePriceData[]).find((d) => d.ingredientId === ingredientId);
  if (!item) return null;
  const available = item.stores.filter((s) => s.inStock && allowedStores.includes(s.storeId)).map((s) => ({ ...s, effectivePrice: s.salePrice ?? s.price, buyUrl: `${STORE_URLS[s.storeId] ?? "#"}${encodeURIComponent(name)}`, onSale: !!s.salePrice }));
  if (!available.length) return null;
  return available.sort((a, b) => a.effectivePrice - b.effectivePrice)[0];
}

export default function PlanPage() {
  const [pantryIds, setPantryIds] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [postalCode, setPostalCode] = useState("");
  const [editingPostal, setEditingPostal] = useState(false);
  const [postalInput, setPostalInput] = useState("");

  useEffect(() => {
    const id = getUserId();
    fetch(`/api/pantry?userId=${id}`).then((r) => r.json()).then((data) => setPantryIds((data.items ?? []).map((i: { ingredientId: string }) => i.ingredientId)));
    const saved = localStorage.getItem("prepplate-postal");
    if (saved) setPostalCode(saved);
  }, []);

  function savePostal() {
    const cleaned = postalInput.toUpperCase().trim();
    setPostalCode(cleaned);
    localStorage.setItem("prepplate-postal", cleaned);
    setEditingPostal(false);
  }

  const nearbyStores = postalCode ? getNearbyStores(postalCode) : ["maxi", "iga", "metro", "walmart", "instacart", "amazon"];
  const recipes = recipesData as Recipe[];
  const pantrySet = new Set(pantryIds);

  const plannedMeals = recipes.filter((r) => {
    const missing = r.ingredients.filter((i) => !i.isOptional && !pantrySet.has(i.ingredientId));
    return missing.length > 0 && missing.length <= 3;
  }).slice(0, 4);

  const allMissingIds = new Set<string>();
  plannedMeals.forEach((m) => m.ingredients.filter((i) => !i.isOptional && !pantrySet.has(i.ingredientId)).forEach((i) => allMissingIds.add(i.ingredientId)));

  const shoppingItems = Array.from(allMissingIds).map((id) => {
    const ing = (ingredientsData as IngredientData[]).find((i) => i.id === id);
    if (!ing) return null;
    const cheapest = getCheapest(id, ing.name, nearbyStores);
    return { id, name: ing.name, cheapest };
  }).filter(Boolean) as { id: string; name: string; cheapest: ReturnType<typeof getCheapest> }[];

  const totalCost = shoppingItems.reduce((sum, i) => sum + (i.cheapest?.effectivePrice ?? 0), 0);

  function toggleChecked(id: string) {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  }

  const H = { background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 10 };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={H}>
        <div style={{ padding: "8px 20px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Image src="/logo-icon.png" alt="PrepPlate" width={120} height={120} style={{ objectFit: "contain" }} />
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>
        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>Plan your next meal</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>See what to cook next &amp; the best prices</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        {/* Postal code section */}
        <div style={{ margin: "0 16px 16px", padding: "12px 14px", background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editingPostal ? 10 : 0 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#3a1f0d" }}>
                {postalCode ? `Showing stores near ${postalCode}` : "Set your postal code"}
              </div>
              <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>
                {postalCode ? `${nearbyStores.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}` : "We'll show you the best nearby stores"}
              </div>
            </div>
            <button onClick={() => { setEditingPostal(!editingPostal); setPostalInput(postalCode); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #e8d8c8", background: "#fff", color: "#e8470d", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
              {editingPostal ? "Cancel" : postalCode ? "Change" : "Add"}
            </button>
          </div>
          {editingPostal && (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={postalInput} onChange={(e) => setPostalInput(e.target.value)} placeholder="e.g. H3A 1B1" maxLength={7} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e8d8c8", fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none", textTransform: "uppercase" }} />
              <button onClick={savePostal} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#e8470d", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Save</button>
            </div>
          )}
        </div>

        {/* Nearby stores */}
        {postalCode && (
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 8 }}>Stores near you</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {nearbyStores.map((storeId) => (
                <a key={storeId} href={STORE_WEBSITE[storeId]} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: 20, background: "#fff8f4", border: "1px solid #fad8c8", fontSize: 12, fontWeight: 700, color: "#e8470d", textDecoration: "none" }}>
                  {storeId.charAt(0).toUpperCase() + storeId.slice(1)}
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>Meals you could cook next</div>
        <div style={{ padding: "0 16px 16px" }}>
          {plannedMeals.map((meal) => {
            const missing = meal.ingredients.filter((i) => !i.isOptional && !pantrySet.has(i.ingredientId));
            const cost = missing.reduce((sum, i) => { const ing = (ingredientsData as IngredientData[]).find((x) => x.id === i.ingredientId); return sum + (ing?.basePrice ?? 0) * i.quantity; }, 0);
            const hasSale = missing.some((i) => { const c = getCheapest(i.ingredientId, "", nearbyStores); return c?.onSale; });
            return (
              <div key={meal.id} style={{ padding: "10px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff8f4", border: "1px solid #fad8c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{meal.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{meal.title}</div>
                    <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>Need {missing.length} item{missing.length > 1 ? "s" : ""} · ~${cost.toFixed(2)}{hasSale ? " · deals available" : ""}</div>
                  </div>
                  {hasSale && <span style={{ fontSize: 9, fontWeight: 800, background: "#e8f5ec", color: "#2d6a3f", padding: "2px 7px", borderRadius: 6 }}>SALE</span>}
                </div>
              </div>
            );
          })}
        </div>

        {shoppingItems.length > 0 && (
          <>
            <div style={{ margin: "0 16px 12px", background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>Grocery list</div>
                <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>{shoppingItems.length - checked.size} items remaining</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#e8470d" }}>${totalCost.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: "#c09878", fontWeight: 600 }}>best price</div>
              </div>
            </div>

            <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>Best price today</div>
            <div style={{ padding: "0 16px" }}>
              {shoppingItems.map((item) => (
                <div key={item.id} onClick={() => toggleChecked(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: checked.has(item.id) ? "#f5f0e8" : "#fff", border: "1px solid #f0e8de", borderRadius: 12, marginBottom: 6, cursor: "pointer", opacity: checked.has(item.id) ? 0.5 : 1 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: checked.has(item.id) ? "#e8470d" : "#fff", border: `2px solid ${checked.has(item.id) ? "#e8470d" : "#e8d8c8"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800 }}>
                    {checked.has(item.id) ? "+" : ""}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d", textDecoration: checked.has(item.id) ? "line-through" : "none" }}>{item.name}</div>
                    {item.cheapest && <div style={{ fontSize: 11, color: "#2d6a3f", fontWeight: 700, marginTop: 1 }}>{item.cheapest.storeName} · ${item.cheapest.effectivePrice.toFixed(2)}{item.cheapest.onSale ? " (sale)" : ""}</div>}
                  </div>
                  {item.cheapest && <a href={item.cheapest.buyUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ padding: "6px 10px", borderRadius: 8, background: "#e8470d", color: "#fff", fontSize: 11, fontWeight: 800, textDecoration: "none", flexShrink: 0 }}>Buy</a>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

