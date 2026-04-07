"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import recipesData from "@/data/recipes.json";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";


interface Recipe { id: string; title: string; description: string; prepTimeMin: number; calories: number; cuisine: string; emoji: string; mealType: string; mode: string[]; dietTags: string[]; ingredients: { ingredientId: string; quantity: number; unit: string }[]; }
interface IngredientData { id: string; name: string; nameFr?: string; emoji?: string; category: string; unit: string; basePrice: number; defaultShelfDays: number; }


const RECIPES = recipesData as Recipe[];
const INGREDIENTS = ingredientsData as IngredientData[];


const STORES = [
  { id: "best", name: "Best price", emoji: "💰", multiplier: 0 },
  { id: "costco", name: "Costco", emoji: "🛒", multiplier: 0.82 },
  { id: "maxi", name: "Maxi", emoji: "🛒", multiplier: 0.85 },
  { id: "super_c", name: "Super C", emoji: "🛒", multiplier: 0.88 },
  { id: "walmart", name: "Walmart", emoji: "🛒", multiplier: 0.90 },
  { id: "marche_adonis", name: "Marché Adonis", emoji: "🛒", multiplier: 0.95 },
  { id: "metro", name: "Metro", emoji: "🛒", multiplier: 1.05 },
  { id: "iga", name: "IGA", emoji: "🛒", multiplier: 1.08 },
  { id: "provigo", name: "Provigo", emoji: "🛒", multiplier: 1.10 },
];


const PAID_STORES = STORES.filter((s) => s.id !== "best");


function getBestStore(ing: IngredientData) {
  let best = PAID_STORES[0];
  let bestPrice = Infinity;
  for (const s of PAID_STORES) {
    const p = ing.basePrice * s.multiplier * 100;
    if (p < bestPrice) { bestPrice = p; best = s; }
  }
  return { store: best, price: bestPrice };
}


function getPrice(ing: IngredientData, storeId: string) {
  if (storeId === "best") return getBestStore(ing).price;
  const store = STORES.find((s) => s.id === storeId);
  return ing.basePrice * (store?.multiplier ?? 1) * 100;
}


export default function PlanPage() {
  const [pantryIds, setPantryIds] = useState<Set<string>>(new Set());
  const [expiringIds, setExpiringIds] = useState<Set<string>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [weekMeals, setWeekMeals] = useState<Recipe[]>([]);
  const [removedMeals, setRemovedMeals] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const [selectedStore, setSelectedStore] = useState("best");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [swipedMeal, setSwipedMeal] = useState<string | null>(null);
  const [swipedItem, setSwipedItem] = useState<string | null>(null);
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const id = getUserId();
    setLang(localStorage.getItem("prepplate-lang") ?? "en");
    const pinned: string[] = JSON.parse(localStorage.getItem("prepplate-pinned") ?? "[]");
    setPinnedIds(new Set(pinned));


    fetch(`/api/pantry?userId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        const items = data.items ?? [];
        const ids = new Set<string>(items.map((i: { ingredientId: string }) => i.ingredientId));
        setPantryIds(ids);


        const expiring = new Set<string>(
          items
            .filter((i: { quantityLevel?: string }) => {
              const match = (i.quantityLevel ?? "").match(/expiry:(\d+)/);
              return match && parseInt(match[1]) <= 2;
            })
            .map((i: { ingredientId: string }) => i.ingredientId)
        );
        setExpiringIds(expiring);


        const pinnedRecipes = RECIPES.filter((r) => pinned.includes(r.id));
        const pinnedSet = new Set(pinnedRecipes.map((r) => r.id));


        const expiryRecipes = RECIPES
          .filter((r) => !pinnedSet.has(r.id))
          .filter((r) => (r.ingredients ?? []).some((i) => expiring.has(i.ingredientId)))
          .slice(0, 2);


        const usedIds = new Set([...pinnedRecipes, ...expiryRecipes].map((r) => r.id));


        const fillRecipes = RECIPES
          .filter((r) => !usedIds.has(r.id))
          .map((r) => ({
            recipe: r,
            missing: (r.ingredients ?? []).filter((i) => !ids.has(i.ingredientId)).length,
          }))
          .sort((a, b) => a.missing - b.missing)
          .slice(0, Math.max(0, 5 - pinnedRecipes.length - expiryRecipes.length))
          .map((x) => x.recipe);


        setWeekMeals([...pinnedRecipes, ...expiryRecipes, ...fillRecipes].slice(0, 5));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);


  function toggleCheck(id: string) {
    const next = new Set(checkedItems);
    next.has(id) ? next.delete(id) : next.add(id);
    setCheckedItems(next);
  }


  function removeMeal(id: string) {
    setRemovedMeals((prev) => new Set([...prev, id]));
    setSwipedMeal(null);
  }


  function removeItem(id: string) {
    setRemovedItems((prev) => new Set([...prev, id]));
    setSwipedItem(null);
  }


  const activeMeals = weekMeals.filter((m) => !removedMeals.has(m.id));


  const neededIds = new Set<string>();
  for (const meal of activeMeals) {
    for (const ing of meal.ingredients ?? []) {
      if (!pantryIds.has(ing.ingredientId)) neededIds.add(ing.ingredientId);
    }
  }


  const groceryList = INGREDIENTS.filter((i) => neededIds.has(i.id) && !removedItems.has(i.id));
  const unchecked = groceryList.filter((i) => !checkedItems.has(i.id));
  const checked = groceryList.filter((i) => checkedItems.has(i.id));
  const total = unchecked.reduce((sum, ing) => sum + getPrice(ing, selectedStore), 0);


  const addableMeals = RECIPES
    .filter((r) => !weekMeals.find((m) => m.id === r.id) && !removedMeals.has(r.id))
    .slice(0, 4);


  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>


      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Image src="/logo-icon.png" alt="PrepPlate" width={36} height={36} style={{ borderRadius: 10, objectFit: "cover" }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>PrepPlate</span>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>
        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
            {lang === "fr" ? "Mon plan de la semaine" : "My Week"}
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>
            {lang === "fr" ? "Glissez pour modifier • Liste optimisée" : "Swipe to edit • Optimized grocery list"}
          </p>
        </div>
      </div>


      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>


        {/* ── SECTION 1: Weekly meals ── */}
        <div style={{ padding: "0 16px 4px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>
            🗓 {lang === "fr" ? "Vos repas cette semaine" : "Your meals this week"}
          </div>


          {loading ? (
            <p style={{ color: "#c09878", fontSize: 13, fontWeight: 700 }}>
              {lang === "fr" ? "Construction de votre plan…" : "Building your plan…"}
            </p>
          ) : (
            <>
              {activeMeals.map((meal) => {
                const missing = (meal.ingredients ?? []).filter((i) => !pantryIds.has(i.ingredientId)).length;
                const isPinned = pinnedIds.has(meal.id);
                const hasExpiring = (meal.ingredients ?? []).some((i) => expiringIds.has(i.ingredientId));
                const isSwiped = swipedMeal === meal.id;


                return (
                  <div key={meal.id} style={{ position: "relative", marginBottom: 8, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0 12px 12px 0" }}>
                      <button onClick={() => removeMeal(meal.id)} style={{ background: "none", border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                        {lang === "fr" ? "Retirer" : "Remove"}
                      </button>
                    </div>
                    <div
                      onClick={() => setSwipedMeal(isSwiped ? null : meal.id)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fff", border: "1.5px solid #f0e8de", borderRadius: 12, cursor: "pointer", transform: isSwiped ? "translateX(-76px)" : "translateX(0)", transition: "transform .25s ease", position: "relative", zIndex: 1 }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff8f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                        {meal.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{meal.title}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                          {isPinned && <span style={{ fontSize: 10, background: "#fff0ec", color: "#e8470d", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>📌 {lang === "fr" ? "Épinglé" : "Pinned"}</span>}
                          {hasExpiring && <span style={{ fontSize: 10, background: "#fff7ed", color: "#f59e0b", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>⏰ {lang === "fr" ? "Ingrédients expirent" : "Uses expiring"}</span>}
                          {missing > 0
                            ? <span style={{ fontSize: 10, background: "#f5f5f5", color: "#888", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>🛒 {missing} {lang === "fr" ? "à acheter" : "to buy"}</span>
                            : <span style={{ fontSize: 10, background: "#f0fdf4", color: "#22c55e", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>✓ {lang === "fr" ? "Tout en stock" : "All in pantry"}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 16, color: "#e8d8c8", fontWeight: 300 }}>‹</span>
                    </div>
                  </div>
                );
              })}


              {/* Add meal strip */}
              {activeMeals.length < 5 && addableMeals.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#c09878", fontWeight: 700, marginBottom: 6 }}>
                    {lang === "fr" ? "+ Ajouter un repas" : "+ Add a meal"}
                  </div>
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
                    {addableMeals.map((r) => (
                      <div key={r.id} onClick={() => setWeekMeals((prev) => [...prev, r])} style={{ flexShrink: 0, padding: "8px 12px", background: "#fff8f4", border: "1.5px dashed #fad8c8", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 18 }}>{r.emoji}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#3a1f0d" }}>{r.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>


        {/* Divider */}
        <div style={{ height: 8, background: "#f5f0eb", margin: "4px 0 0" }} />


        {/* ── SECTION 2: Store selector ── */}
        <div style={{ padding: "14px 16px 8px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 8 }}>
            🏪 {lang === "fr" ? "Choisir votre épicerie" : "Choose your store"}
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
            {STORES.map((store) => (
              <button key={store.id} onClick={() => setSelectedStore(store.id)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: selectedStore === store.id ? "#e8470d" : "#e8d8c8", background: selectedStore === store.id ? "#e8470d" : "#fff", color: selectedStore === store.id ? "#fff" : "#a08060", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif" }}>
                {store.name}
              </button>
            ))}
          </div>
        </div>


        {/* ── SECTION 3: Grocery list ── */}
        <div style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
              🛒 {lang === "fr" ? "Liste d'épicerie" : "Grocery list"} ({unchecked.length})
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#e8470d" }}>~${total.toFixed(2)}</div>
          </div>


          {groceryList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#3a1f0d", marginBottom: 4 }}>
                {lang === "fr" ? "Tout est dans votre garde-manger!" : "Everything is in your pantry!"}
              </div>
              <div style={{ fontSize: 12, color: "#c09878", fontWeight: 600 }}>
                {lang === "fr" ? "Rien à acheter pour ces repas." : "Nothing to buy for these meals."}
              </div>
            </div>
          ) : (
            <>
              {unchecked.map((ing) => {
                const best = getBestStore(ing);
                const price = getPrice(ing, selectedStore);
                const isBestMode = selectedStore === "best";
                const isExpanded = expandedItem === ing.id;
                const isSwiped = swipedItem === ing.id;


                return (
                  <div key={ing.id} style={{ position: "relative", marginBottom: 8, borderRadius: 12, overflow: "hidden" }}>
                    {/* Swipe-to-remove background */}
                    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <button onClick={() => removeItem(ing.id)} style={{ background: "none", border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                        {lang === "fr" ? "Retirer" : "Remove"}
                      </button>
                    </div>


                    <div style={{ transform: isSwiped ? "translateX(-76px)" : "translateX(0)", transition: "transform .25s ease", position: "relative", zIndex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: isExpanded ? "12px 12px 0 0" : 12, gap: 10 }}>
                        {/* Checkbox */}
                        <div onClick={() => toggleCheck(ing.id)} style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid #e8d8c8", background: "#fff", cursor: "pointer", flexShrink: 0 }} />
                        {/* Swipe handle */}
                        <div onClick={() => setSwipedItem(isSwiped ? null : ing.id)} style={{ flex: 1, cursor: "pointer" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d" }}>
                            {ing.emoji} {lang === "fr" && ing.nameFr ? ing.nameFr : ing.name}
                          </div>
                          <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>
                            {isBestMode
                              ? `${lang === "fr" ? "Moins cher chez" : "Cheapest at"} ${best.store.name} · $${best.price.toFixed(2)}`
                              : `${STORES.find((s) => s.id === selectedStore)?.name} · $${price.toFixed(2)}`}
                          </div>
                        </div>
                        {/* Expand prices */}
                        <button onClick={() => setExpandedItem(isExpanded ? null : ing.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#c09878", fontWeight: 700, padding: "0 4px", fontFamily: "'Nunito', sans-serif" }}>
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      </div>


                      {/* Price comparison across all stores */}
                      {isExpanded && (
                        <div style={{ border: "1px solid #f0e8de", borderTop: "none", borderRadius: "0 0 12px 12px", background: "#fafaf8", overflow: "hidden" }}>
                          {PAID_STORES.map((store) => {
                            const p = ing.basePrice * store.multiplier * 100;
                            const isLowest = store.id === best.store.id;
                            return (
                              <div key={store.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderBottom: "0.5px solid #f0e8de", background: isLowest ? "#f0fdf4" : "transparent" }}>
                                <span style={{ fontSize: 13, fontWeight: isLowest ? 800 : 600, color: isLowest ? "#16a34a" : "#3a1f0d" }}>
                                  {store.name} {isLowest && "✓"}
                                </span>
                                <span style={{ fontSize: 13, fontWeight: isLowest ? 800 : 600, color: isLowest ? "#16a34a" : "#c09878" }}>
                                  ${p.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}


              {/* Checked / in cart */}
              {checked.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", margin: "14px 0 8px" }}>
                    ✓ {lang === "fr" ? "Dans le panier" : "In cart"} ({checked.length})
                  </div>
                  {checked.map((ing) => (
                    <div key={ing.id} onClick={() => toggleCheck(ing.id)} style={{ display: "flex", alignItems: "center", padding: "10px 14px", marginBottom: 6, border: "1px solid #f0e8de", borderRadius: 12, opacity: 0.4, cursor: "pointer", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: "#e8470d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d", textDecoration: "line-through" }}>
                        {ing.emoji} {lang === "fr" && ing.nameFr ? ing.nameFr : ing.name}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
