"use client";
import { useState, useEffect, useRef } from "react";
import recipesData from "@/data/recipes.json";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";


interface Recipe {
  id: string;
  title: string;
  emoji: string;
  calories: number;
  prepTimeMin: number;
  ingredients: {
    ingredientId: string;
    quantity: number;
    unit: string;
    isOptional?: boolean;
  }[];
}


interface IngredientData {
  id: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number;
}


interface StorePrice {
  storeName: string;
  price: number;
  link: string;
}


interface LivePriceResult {
  name: string;
  stores: StorePrice[];
}


const PRICE_CACHE_TTL_MS = 60 * 60 * 1000;


function loadCachedPrices(key: string): LivePriceResult[] | null {
  try {
    const raw = localStorage.getItem(`prices-cache-${key}`);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > PRICE_CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}


function saveCachedPrices(key: string, data: LivePriceResult[]) {
  try {
    localStorage.setItem(`prices-cache-${key}`, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}


export default function PlanPage() {
  const [pantryIds, setPantryIds] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [postalInput, setPostalInput] = useState("");
  const [locationString, setLocationString] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [livePrices, setLivePrices] = useState<LivePriceResult[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesError, setPricesError] = useState("");


  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    const id = getUserId();
    fetch(`/api/pantry?userId=${id}`)
      .then((r) => r.json())
      .then((data) =>
        setPantryIds(
          (data.items ?? []).map((i: { ingredientId: string }) => i.ingredientId)
        )
      );
    const savedPostal = localStorage.getItem("prepplate-postal") ?? "";
    const savedLocation = localStorage.getItem("prepplate-location") ?? "";
    const savedLabel = localStorage.getItem("prepplate-location-label") ?? "";
    if (savedPostal) {
      setPostalInput(savedPostal);
      setLocationString(savedLocation);
      setLocationLabel(savedLabel);
    }
  }, []);


  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const cleaned = postalInput.trim().toUpperCase().replace(/\s/g, "");
    if (cleaned.length < 3) {
      setLocationString("");
      setLocationLabel("");
      setLocationError("");
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLocationLoading(true);
      setLocationError("");
      try {
        const res = await fetch(`/api/location?postalCode=${encodeURIComponent(cleaned)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Unknown error");
        const label = `${data.city}, ${data.province}`;
        setLocationString(data.locationString);
        setLocationLabel(label);
        localStorage.setItem("prepplate-postal", cleaned);
        localStorage.setItem("prepplate-location", data.locationString);
        localStorage.setItem("prepplate-location-label", label);
      } catch (e: unknown) {
        setLocationError(e instanceof Error ? e.message : "Could not find location");
        setLocationString("");
        setLocationLabel("");
      } finally {
        setLocationLoading(false);
      }
    }, 700);
  }, [postalInput]);


  const recipes = recipesData as Recipe[];
  const pantrySet = new Set(pantryIds);


  const plannedMeals = recipes
    .filter((r) => {
      const missing = r.ingredients.filter(
        (i) => !i.isOptional && !pantrySet.has(i.ingredientId)
      );
      return missing.length > 0 && missing.length <= 3;
    })
    .slice(0, 4);


  const allMissingIds = new Set<string>();
  plannedMeals.forEach((m) =>
    m.ingredients
      .filter((i) => !i.isOptional && !pantrySet.has(i.ingredientId))
      .forEach((i) => allMissingIds.add(i.ingredientId))
  );


  const groceryItems = Array.from(allMissingIds)
    .map((id) => {
      const ing = (ingredientsData as IngredientData[]).find((i) => i.id === id);
      return ing ? { id, name: ing.name } : null;
    })
    .filter(Boolean) as { id: string; name: string }[];


  useEffect(() => {
    if (!locationString || groceryItems.length === 0) return;
    const names = groceryItems.map((i) => i.name);
    const cacheKey = `${locationString}::${names.join(",")}`;
    const cached = loadCachedPrices(cacheKey);
    if (cached) {
      setLivePrices(cached);
      return;
    }
    setPricesLoading(true);
    setPricesError("");
    fetch(
      `/api/prices?ingredients=${encodeURIComponent(names.join(","))}&location=${encodeURIComponent(locationString)}`
    )
      .then((r) => r.json())
      .then((data) => {
        const results: LivePriceResult[] = data.results ?? [];
        setLivePrices(results);
        saveCachedPrices(cacheKey, results);
      })
      .catch(() => setPricesError("Could not load live prices"))
      .finally(() => setPricesLoading(false));
  }, [locationString, groceryItems.length]);


  function toggleChecked(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }


  const shoppingItems = groceryItems.map((item) => {
    const live = livePrices.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
    return { ...item, stores: live?.stores ?? [] };
  });


  const cheapestTotal = shoppingItems.reduce(
    (sum, item) => sum + (item.stores[0]?.price ?? 0),
    0
  );


  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>


      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 4px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>Plan & Shop</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>Live prices near you, sorted best deal first</p>
        </div>
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 14px" }}>
            <span style={{ fontSize: 16 }}>📍</span>
            <input
              type="text"
              placeholder="Enter postal code (e.g. H2X 1Y4)"
              value={postalInput}
              onChange={(e) => setPostalInput(e.target.value)}
              maxLength={7}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}
            />
            {locationLoading && <span style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>...</span>}
          </div>
          {locationLabel && !locationError && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.85)", fontWeight: 700, marginTop: 6, paddingLeft: 4 }}>
              📌 Showing prices near {locationLabel}
            </div>
          )}
          {locationError && (
            <div style={{ fontSize: 12, color: "#ffd0c0", fontWeight: 700, marginTop: 6, paddingLeft: 4 }}>
              ⚠ {locationError}
            </div>
          )}
        </div>
      </div>


      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>


        {/* Planned meals */}
        <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
          Meals you could cook next
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          {plannedMeals.length === 0 ? (
            <div style={{ padding: "16px", color: "#c09878", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
              Loading your meal plan...
            </div>
          ) : (
            plannedMeals.map((meal) => {
              const missing = meal.ingredients.filter(
                (i) => !i.isOptional && !pantrySet.has(i.ingredientId)
              );
              return (
                <div key={meal.id} style={{ padding: "10px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff8f4", border: "1px solid #fad8c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {meal.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{meal.title}</div>
                      <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>
                        Need {missing.length} item{missing.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>


        {/* Grocery list */}
        {shoppingItems.length > 0 && (
          <>
            <div style={{ margin: "0 16px 12px", background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>Grocery list</div>
                <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>
                  {shoppingItems.length - checked.size} items remaining
                </div>
              </div>
              {cheapestTotal > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#e8470d" }}>${cheapestTotal.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: "#c09878", fontWeight: 600 }}>best price total</div>
                </div>
              )}
            </div>


            <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
              {locationString ? "Live prices · cheapest first" : "Add postal code to see live prices"}
            </div>


            {pricesLoading && (
              <div style={{ padding: "20px", textAlign: "center", color: "#c09878", fontSize: 13, fontWeight: 600 }}>
                Fetching live prices near you...
              </div>
            )}


            {pricesError && (
              <div style={{ margin: "0 16px 12px", padding: "10px 14px", background: "#fff0ec", borderRadius: 10, fontSize: 13, color: "#e8470d", fontWeight: 700 }}>
                ⚠ {pricesError}
              </div>
            )}


            <div style={{ padding: "0 16px" }}>
              {shoppingItems.map((item) => {
                const cheapest = item.stores[0];
                return (
                  <div key={item.id}>
                    <div
                      onClick={() => toggleChecked(item.id)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: checked.has(item.id) ? "#f5f0e8" : "#fff", border: "1px solid #f0e8de", borderRadius: cheapest && !checked.has(item.id) ? "12px 12px 0 0" : 12, marginBottom: cheapest && !checked.has(item.id) ? 0 : 6, cursor: "pointer", opacity: checked.has(item.id) ? 0.5 : 1 }}
                    >
                      <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: checked.has(item.id) ? "#e8470d" : "#fff", border: `2px solid ${checked.has(item.id) ? "#e8470d" : "#e8d8c8"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800 }}>
                        {checked.has(item.id) ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d", textDecoration: checked.has(item.id) ? "line-through" : "none" }}>
                          {item.name}
                        </div>
                        {!locationString && (
                          <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>Add postal code to see prices</div>
                        )}
                        {locationString && !cheapest && !pricesLoading && (
                          <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>No prices found</div>
                        )}
                        {cheapest && (
                          <div style={{ fontSize: 11, color: "#2d6a3f", fontWeight: 700, marginTop: 1 }}>
                            Best: {cheapest.storeName} · ${cheapest.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                      {cheapest && (
                        <a
                          href={cheapest.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ padding: "6px 10px", borderRadius: 8, background: "#e8470d", color: "#fff", fontSize: 11, fontWeight: 800, textDecoration: "none", flexShrink: 0 }}
                        >
                          Buy
                        </a>
                      )}
                    </div>


                    {cheapest && !checked.has(item.id) && (
                      <div style={{ border: "1px solid #f0e8de", borderTop: "none", borderRadius: "0 0 12px 12px", marginBottom: 6, overflow: "hidden" }}>
                        {item.stores.slice(0, 5).map((store, idx) => (
                          <div
                            key={store.storeName}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px", background: idx === 0 ? "#f0faf4" : "#fafafa", borderTop: idx > 0 ? "1px solid #f0e8de" : undefined }}
                          >
                            <span style={{ fontSize: 12, fontWeight: 700, color: idx === 0 ? "#2d6a3f" : "#a08060" }}>
                              {idx === 0 ? "🏆 " : ""}{store.storeName}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: idx === 0 ? "#2d6a3f" : "#3a1f0d" }}>
                                ${store.price.toFixed(2)}
                              </span>
                              <a
                                href={store.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: 10, fontWeight: 700, color: "#e8470d", textDecoration: "none" }}
                              >
                                →
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}


        {shoppingItems.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#c09878", fontSize: 14, fontWeight: 600 }}>
            Your pantry is well stocked! Add more recipes or remove pantry items to build a grocery list.
          </div>
        )}
      </div>
    </main>
  );
}
