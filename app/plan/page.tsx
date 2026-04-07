"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import recipesData from "@/data/recipes.json";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";
import { getLang, t } from "@/lib/i18n";

interface Recipe { id: string; title: string; emoji: string; calories: number; prepTimeMin: number; ingredients: { ingredientId: string; quantity: number; unit: string; isOptional?: boolean }[]; }
interface IngredientData { id: string; name: string; category: string; unit: string; basePrice: number; }
interface GroceryResult { title: string; price: string; store: string; link: string; thumbnail: string; }
interface CachedResults { results: GroceryResult[]; timestamp: number; }

const CACHE_TTL = 24 * 60 * 60 * 1000;

function StoreLogo({ store }: { store: string }) {
  const [error, setError] = useState(false);
  const domain = store.toLowerCase().replace(/\s/g, "").replace(".ca", "").replace(".com", "");
  const logoUrl = `https://logo.clearbit.com/${domain}.ca`;
  if (error) return <div style={{ width: 20, height: 20, borderRadius: 4, background: "#f0e8de", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#c09878" }}>{store[0]}</div>;
  return <img src={logoUrl} alt={store} width={20} height={20} style={{ borderRadius: 4, objectFit: "contain" }} onError={() => setError(true)} />;
}

export default function PlanPage() {
  const [pantryIds, setPantryIds] = useState<string[]>([]);
  const [savedMealIds, setSavedMealIds] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [postalCode, setPostalCode] = useState("");
  const [editingPostal, setEditingPostal] = useState(false);
  const [postalInput, setPostalInput] = useState("");
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [groceryData, setGroceryData] = useState<Record<string, GroceryResult[]>>({});
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const T = t[lang].plan;

  useEffect(() => {
    const id = getUserId();
    setLang(getLang());
    fetch(`/api/pantry?userId=${id}`).then((r) => r.json()).then((data) => setPantryIds((data.items ?? []).map((i: { ingredientId: string }) => i.ingredientId)));
    const savedPostal = localStorage.getItem("prepplate-postal");
    if (savedPostal) setPostalCode(savedPostal);
    const planMeals = JSON.parse(localStorage.getItem("plan-meals") ?? "[]");
    setSavedMealIds(planMeals);
  }, []);

  async function fetchGroceryResults(ingredientName: string, ingredientId: string) {
    const cacheKey = `grocery-${ingredientId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed: CachedResults = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        setGroceryData((prev) => ({ ...prev, [ingredientId]: parsed.results }));
        return;
      }
    }
    setLoadingItems((prev) => new Set(prev).add(ingredientId));
    try {
      const res = await fetch(`/api/grocery-search?ingredient=${encodeURIComponent(ingredientName)}&postal=${postalCode || "H3A1B1"}`);
      const data = await res.json();
      const results = data.results ?? [];
      setGroceryData((prev) => ({ ...prev, [ingredientId]: results }));
      localStorage.setItem(cacheKey, JSON.stringify({ results, timestamp: Date.now() }));
    } catch (e) { console.error(e); }
    finally {
      setLoadingItems((prev) => { const next = new Set(prev); next.delete(ingredientId); return next; });
    }
  }

  function savePostal() {
    const cleaned = postalInput.toUpperCase().trim();
    setPostalCode(cleaned);
    localStorage.setItem("prepplate-postal", cleaned);
    setEditingPostal(false);
  }

  function unsaveMeal(recipeId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = savedMealIds.filter((id) => id !== recipeId);
    setSavedMealIds(updated);
    localStorage.setItem("plan-meals", JSON.stringify(updated));
  }

  function toggleChecked(id: string) {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  }

  const recipes = recipesData as Recipe[];
  const pantrySet = new Set(pantryIds);
  const savedMeals = recipes.filter((r) => savedMealIds.includes(r.id));
  const plannedMeals = savedMeals.length > 0 ? savedMeals : recipes.filter((r) => {
    const missing = r.ingredients.filter((i) => !i.isOptional && !pantrySet.has(i.ingredientId));
    return missing.length > 0 && missing.length <= 3;
  }).slice(0, 4);

  const allMissingIds = new Set<string>();
  plannedMeals.forEach((m) => m.ingredients.filter((i) => !i.isOptional && !pantrySet.has(i.ingredientId)).forEach((i) => allMissingIds.add(i.ingredientId)));

  const shoppingItems = Array.from(allMissingIds).map((id) => {
    const ing = (ingredientsData as IngredientData[]).find((i) => i.id === id);
    if (!ing) return null;
    return { id, name: ing.name, category: ing.category };
  }).filter(Boolean) as { id: string; name: string; category: string }[];

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Image src="/logo-icon.png" alt="PrepPlate" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>PrepPlate</div>
          </div>
          <a href="/profile" style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, textDecoration: "none", cursor: "pointer" }}>👤</a>
        </div>
        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>{T.title}</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>{T.subtitle}</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        {/* Postal code */}
        <div style={{ margin: "0 16px 16px", padding: "12px 14px", background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editingPostal ? 10 : 0 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#3a1f0d" }}>{postalCode ? T.postalSet(postalCode) : T.postalEmpty}</div>
              <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>
                {postalCode ? (lang === "fr" ? "Résultats adaptés à votre région" : "Results tailored to your area") : T.postalSub}
              </div>
            </div>
            <button onClick={() => { setEditingPostal(!editingPostal); setPostalInput(postalCode); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #e8d8c8", background: "#fff", color: "#e8470d", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
              {editingPostal ? T.cancel : postalCode ? T.change : T.add}
            </button>
          </div>
          {editingPostal && (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={postalInput} onChange={(e) => setPostalInput(e.target.value)} placeholder="e.g. H3A 1B1" maxLength={7} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e8d8c8", fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none", textTransform: "uppercase" }} />
              <button onClick={savePostal} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#e8470d", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>{T.save}</button>
            </div>
          )}
        </div>

        {/* Meals */}
        <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
          {savedMeals.length > 0 ? `${savedMeals.length} ${lang === "fr" ? "repas sauvegardé" : "saved meal"}${savedMeals.length > 1 ? "s" : ""}` : T.mealsNext}
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          {plannedMeals.map((meal) => {
            const missing = meal.ingredients.filter((i) => !i.isOptional && !pantrySet.has(i.ingredientId));
            const isSaved = savedMealIds.includes(meal.id);
            return (
              <div key={meal.id} onClick={() => window.location.href = `/meal/${meal.id}`} style={{ padding: "10px 14px", background: "#fff", border: isSaved ? "1.5px solid #e8470d" : "1px solid #f0e8de", borderRadius: 12, marginBottom: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff8f4", border: "1px solid #fad8c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{meal.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{meal.title}</div>
                    <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>{T.need(missing.length)}</div>
                  </div>
                  {isSaved && (
                    <button onClick={(e) => unsaveMeal(meal.id, e)} style={{ fontSize: 9, fontWeight: 800, background: "#fff0ec", color: "#e8470d", padding: "2px 7px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                      {lang === "fr" ? "Retirer" : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grocery list */}
        {shoppingItems.length > 0 && (
          <>
            <div style={{ margin: "0 16px 12px", background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{T.groceryList}</div>
              <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>{T.itemsRemaining(shoppingItems.length - checked.size)}</div>
            </div>

            <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
              {lang === "fr" ? "Appuyez sur un article pour trouver le meilleur prix à proximité" : "Tap an item to find the best price nearby"}
            </div>

            <div style={{ padding: "0 16px" }}>
              {shoppingItems.map((item) => {
                const results = groceryData[item.id];
                const isLoading = loadingItems.has(item.id);
                const cheapest = results?.[0];
                return (
                  <div key={item.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: checked.has(item.id) ? "#f5f0e8" : "#fff", border: "1px solid #f0e8de", borderRadius: results ? "12px 12px 0 0" : 12, opacity: checked.has(item.id) ? 0.5 : 1 }}>
                      <div onClick={() => toggleChecked(item.id)} style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: checked.has(item.id) ? "#e8470d" : "#fff", border: `2px solid ${checked.has(item.id) ? "#e8470d" : "#e8d8c8"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                        {checked.has(item.id) ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d", textDecoration: checked.has(item.id) ? "line-through" : "none" }}>{item.name}</div>
                        {cheapest && <div style={{ fontSize: 11, color: "#2d6a3f", fontWeight: 700, marginTop: 1 }}>Best: {cheapest.price} @ {cheapest.store}</div>}
                      </div>
                      <button onClick={() => fetchGroceryResults(item.name, item.id)} disabled={isLoading} style={{ padding: "6px 10px", borderRadius: 8, background: results ? "#2d6a3f" : "#e8470d", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", border: "none", fontFamily: "'Nunito', sans-serif", flexShrink: 0 }}>
                        {isLoading ? "..." : results ? (lang === "fr" ? "Voir" : "View") : (lang === "fr" ? "Prix →" : "Prices →")}
                      </button>
                    </div>

                    {results && results.length > 0 && (
                      <div style={{ border: "1px solid #f0e8de", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                        {results.slice(0, 4).map((r, i) => (
                          <a key={i} href={r.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: i === 0 ? "#f0faf3" : "#fff", borderTop: "0.5px solid #f0e8de", textDecoration: "none" }}>
                            {r.thumbnail && <img src={r.thumbnail} alt={r.title} width={36} height={36} style={{ borderRadius: 6, objectFit: "contain", flexShrink: 0 }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#3a1f0d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <StoreLogo store={r.store} />
                                <span style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>{r.store}</span>
                                {i === 0 && <span style={{ fontSize: 9, fontWeight: 800, background: "#e8f5ec", color: "#2d6a3f", padding: "1px 5px", borderRadius: 4 }}>BEST</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? "#2d6a3f" : "#3a1f0d" }}>{r.price}</div>
                              <div style={{ fontSize: 10, color: "#e8470d", fontWeight: 700 }}>{lang === "fr" ? "Acheter →" : "Buy →"}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {results && results.length === 0 && (
                      <div style={{ padding: "8px 14px", background: "#fff8f4", border: "1px solid #f0e8de", borderTop: "none", borderRadius: "0 0 12px 12px", fontSize: 12, color: "#c09878", fontWeight: 600 }}>
                        {lang === "fr" ? "Aucun résultat trouvé" : "No results found"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
