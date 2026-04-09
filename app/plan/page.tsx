"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import recipesData from "@/data/recipes.json";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";




interface Recipe { id: string; title: string; description: string; prepTimeMin: number; calories: number; cuisine: string; emoji: string; mealType: string; mode: string[]; dietTags: string[]; ingredients: { ingredientId: string; quantity: number; unit: string }[]; }
interface IngredientData { id: string; name: string; nameFr?: string; emoji?: string; category: string; unit: string; basePrice: number; defaultShelfDays: number; }
interface NearbyStore { name: string; address: string; placeId: string; }
interface StorePrice { storeName: string; address: string; price: number; }
interface IngredientPriceResult { ingredient: string; stores: StorePrice[]; cheapest: StorePrice | null; }




const RECIPES = recipesData as Recipe[];
const INGREDIENTS = ingredientsData as IngredientData[];




export default function PlanPage() {
  const [pantryIds, setPantryIds] = useState<Set<string>>(new Set());
  const [expiringIds, setExpiringIds] = useState<Set<string>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [weekMeals, setWeekMeals] = useState<Recipe[]>([]);
  const [removedMeals, setRemovedMeals] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [swipedMeal, setSwipedMeal] = useState<string | null>(null);
  const [swipedItem, setSwipedItem] = useState<string | null>(null);
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(true);


  // Postal code & store state
  const [postalCode, setPostalCode] = useState("");
  const [radius, setRadius] = useState(5);
  const [locationLabel, setLocationLabel] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [ingredientPrices, setIngredientPrices] = useState<Record<string, IngredientPriceResult>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesError, setPricesError] = useState("");




  useEffect(() => {
    const id = getUserId();
    const savedLang = localStorage.getItem("prepplate-lang") ?? "en";
    setLang(savedLang);


    // Restore saved postal code & radius
    const savedPostal = localStorage.getItem("prepplate-postal") ?? "";
    const savedRadius = localStorage.getItem("prepplate-radius") ?? "5";
    const savedLabel = localStorage.getItem("prepplate-location-label") ?? "";
    if (savedPostal) {
      setPostalCode(savedPostal);
      setRadius(parseInt(savedRadius));
      setLocationLabel(savedLabel);
    }


    // Load pinned meals from localStorage
    const pinned: string[] = JSON.parse(localStorage.getItem("prepplate-pinned") ?? "[]");
    setPinnedIds(new Set(pinned));


    // Load pantry from DB
    fetch(`/api/pantry?userId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        const items = data.items ?? [];
        const ids = new Set<string>(items.map((i: { ingredientId: string }) => i.ingredientId));
        setPantryIds(ids);


        const expiring = new Set<string>(
          items.filter((i: { quantityLevel?: string }) => {
            const match = (i.quantityLevel ?? "").match(/expiry:(\d+)/);
            return match && parseInt(match[1]) <= 2;
          }).map((i: { ingredientId: string }) => i.ingredientId)
        );
        setExpiringIds(expiring);


        // Build week meals — pinned first, then expiry, then fill
        const pinnedRecipes = RECIPES.filter((r) => pinned.includes(r.id));
        const pinnedSet = new Set(pinnedRecipes.map((r) => r.id));
        const expiryRecipes = RECIPES
          .filter((r) => !pinnedSet.has(r.id) && (r.ingredients ?? []).some((i) => expiring.has(i.ingredientId)))
          .slice(0, 2);
        const usedIds = new Set([...pinnedRecipes, ...expiryRecipes].map((r) => r.id));
        const fillRecipes = RECIPES
          .filter((r) => !usedIds.has(r.id))
          .map((r) => ({ recipe: r, missing: (r.ingredients ?? []).filter((i) => !ids.has(i.ingredientId)).length }))
          .sort((a, b) => a.missing - b.missing)
          .slice(0, Math.max(0, 5 - pinnedRecipes.length - expiryRecipes.length))
          .map((x) => x.recipe);


        setWeekMeals([...pinnedRecipes, ...expiryRecipes, ...fillRecipes].slice(0, 5));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);




  async function searchStoresAndPrices() {
    const cleaned = postalCode.trim().toUpperCase().replace(/\s/g, "");
    if (cleaned.length < 3) return;


    setLocationLoading(true);
    setLocationError("");
    setPricesError("");


    try {
      // Step 1: Geocode postal code for display label
      const locRes = await fetch(`/api/location?postalCode=${encodeURIComponent(cleaned)}`);
      const locData = await locRes.json();
      if (!locRes.ok) throw new Error(locData.error ?? "Could not find postal code");
      const label = `${locData.city}, ${locData.province}`;
      setLocationLabel(label);


      // Save to localStorage
      localStorage.setItem("prepplate-postal", cleaned);
      localStorage.setItem("prepplate-radius", String(radius));
      localStorage.setItem("prepplate-location-label", label);
    } catch (e: unknown) {
      setLocationError(e instanceof Error ? e.message : "Could not find location");
      setLocationLoading(false);
      return;
    }
    setLocationLoading(false);


    // Step 2: Fetch nearby store prices for all grocery items
    if (groceryList.length === 0) return;


    setPricesLoading(true);
    try {
      const ingredientNames = groceryList.map((i) => i.name).join(",");
      const res = await fetch(
        `/api/nearby-prices?postalCode=${encodeURIComponent(postalCode.trim())}&radius=${radius}&ingredients=${encodeURIComponent(ingredientNames)}`
      );
      const data = await res.json();


      // Map results back to ingredient IDs
      const stores: NearbyStore[] = data.stores ?? [];
      setNearbyStores(stores);


      const priceMap: Record<string, IngredientPriceResult> = {};
      for (const result of (data.results ?? [])) {
        const ing = groceryList.find((i) => i.name.toLowerCase() === result.ingredient?.toLowerCase());
        if (ing) {
          priceMap[ing.id] = result;
        }
      }
      setIngredientPrices(priceMap);
    } catch {
      setPricesError(L ? "Impossible de charger les prix." : "Could not load prices.");
    } finally {
      setPricesLoading(false);
    }
  }




  function toggleCheck(id: string) {
    const next = new Set(checkedItems);
    next.has(id) ? next.delete(id) : next.add(id);
    setCheckedItems(next);
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
  const addableMeals = RECIPES.filter((r) => !weekMeals.find((m) => m.id === r.id) && !removedMeals.has(r.id)).slice(0, 4);
  const L = lang === "fr";




  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>


      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Image src="/logo-icon.png" alt="PrepPlate" width={36} height={36} style={{ borderRadius: 10, objectFit: "cover" }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>PrepPlate</span>
          </div>
          <a href="/profile" style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, textDecoration: "none", cursor: "pointer" }}>👤</a>
        </div>
        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
            {L ? "Mon plan de la semaine" : "My Week"}
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>
            {L ? "Glissez pour modifier • Prix en temps réel" : "Swipe to edit • Live prices"}
          </p>
        </div>
      </div>


      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>


        {/* Weekly meals */}
        <div style={{ padding: "0 16px 4px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>
            🗓 {L ? "Vos repas cette semaine" : "Your meals this week"}
          </div>
          {loading ? (
            <p style={{ color: "#c09878", fontSize: 13, fontWeight: 700 }}>{L ? "Construction du plan…" : "Building your plan…"}</p>
          ) : activeMeals.length === 0 ? (
            <div style={{ padding: "16px", background: "#fff8f4", borderRadius: 12, fontSize: 13, color: "#c09878", fontWeight: 600 }}>
              {L ? "📌 Épinglez des recettes dans Découvrir pour les voir ici." : "📌 Pin recipes in Discover to see them here."}
            </div>
          ) : (
            <>
              {activeMeals.map((meal) => {
                const missing = (meal.ingredients ?? []).filter((i) => !pantryIds.has(i.ingredientId)).length;
                const isPinned = pinnedIds.has(meal.id);
                const hasExpiring = (meal.ingredients ?? []).some((i) => expiringIds.has(i.ingredientId));
                const isSwiped = swipedMeal === meal.id;
                return (
                  <div key={meal.id} style={{ position: "relative", marginBottom: 8, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <button onClick={() => { setRemovedMeals((p) => new Set([...p, meal.id])); setSwipedMeal(null); }} style={{ background: "none", border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                        {L ? "Retirer" : "Remove"}
                      </button>
                    </div>
                    <div onClick={() => setSwipedMeal(isSwiped ? null : meal.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fff", border: "1.5px solid #f0e8de", borderRadius: 12, cursor: "pointer", transform: isSwiped ? "translateX(-76px)" : "translateX(0)", transition: "transform .25s ease", position: "relative", zIndex: 1 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff8f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{meal.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{meal.title}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                          {isPinned && <span style={{ fontSize: 10, background: "#fff0ec", color: "#e8470d", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>📌 {L ? "Épinglé" : "Pinned"}</span>}
                          {hasExpiring && <span style={{ fontSize: 10, background: "#fff7ed", color: "#f59e0b", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>⏰ {L ? "Ingrédients expirent" : "Uses expiring"}</span>}
                          {missing > 0
                            ? <span style={{ fontSize: 10, background: "#f5f5f5", color: "#888", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>🛒 {missing} {L ? "à acheter" : "to buy"}</span>
                            : <span style={{ fontSize: 10, background: "#f0fdf4", color: "#22c55e", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>✓ {L ? "Tout en stock" : "All in pantry"}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 16, color: "#e8d8c8" }}>‹</span>
                    </div>
                  </div>
                );
              })}
              {activeMeals.length < 5 && addableMeals.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#c09878", fontWeight: 700, marginBottom: 6 }}>{L ? "+ Ajouter un repas" : "+ Add a meal"}</div>
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" as const }}>
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


        <div style={{ height: 8, background: "#f5f0eb", margin: "4px 0 0" }} />


        {/* Nearby stores — postal code input */}
        <div style={{ padding: "14px 16px 8px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>
            🏪 {L ? "Épiceries à proximité" : "Nearby stores"}
          </div>


          {/* Postal code input */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && searchStoresAndPrices()}
              placeholder={L ? "Code postal (ex: H2X 1Y4)" : "Postal code (e.g. H2X 1Y4)"}
              maxLength={7}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e8d8c8", fontSize: 14, fontFamily: "'Nunito', sans-serif", outline: "none", letterSpacing: "0.08em", fontWeight: 700 }}
            />
            <button
              onClick={searchStoresAndPrices}
              disabled={locationLoading || pricesLoading || postalCode.trim().length < 3}
              style={{ padding: "10px 16px", borderRadius: 10, background: "#e8470d", border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: postalCode.trim().length < 3 ? "not-allowed" : "pointer", fontFamily: "'Nunito', sans-serif", opacity: postalCode.trim().length < 3 ? 0.5 : 1, whiteSpace: "nowrap" }}
            >
              {locationLoading || pricesLoading ? "…" : (L ? "Chercher" : "Search")}
            </button>
          </div>


          {/* Radius selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[3, 5, 10, 15].map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                style={{ padding: "4px 10px", borderRadius: 14, fontSize: 11, fontWeight: 700, border: "1.5px solid", borderColor: radius === r ? "#e8470d" : "#e8d8c8", background: radius === r ? "#e8470d" : "#fff", color: radius === r ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}
              >
                {r} km
              </button>
            ))}
          </div>


          {locationError && (
            <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, margin: "0 0 8px" }}>{locationError}</p>
          )}
          {locationLabel && !locationError && (
            <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginBottom: 8 }}>
              📍 {L ? "Résultats près de" : "Results near"} {locationLabel}
            </div>
          )}
          {pricesError && (
            <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, margin: "0 0 8px" }}>{pricesError}</p>
          )}


          {/* Store chips */}
          {nearbyStores.length > 0 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" as const, paddingBottom: 4 }}>
              {nearbyStores.map((store) => (
                <div key={store.placeId} style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 12, border: "1.5px solid #e8d8c8", background: "#fff", minWidth: 100 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#3a1f0d" }}>{store.name}</div>
                  <div style={{ fontSize: 10, color: "#c09878", fontWeight: 600, marginTop: 2, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{store.address}</div>
                </div>
              ))}
            </div>
          )}


          {nearbyStores.length === 0 && !locationLabel && !locationLoading && (
            <div style={{ padding: "10px 14px", background: "#fff8f4", borderRadius: 10, fontSize: 12, color: "#c09878", fontWeight: 600 }}>
              {L
                ? "📍 Entrez votre code postal pour voir les épiceries et prix."
                : "📍 Enter your postal code to see nearby stores and prices."}
            </div>
          )}
        </div>


        <div style={{ height: 8, background: "#f5f0eb", margin: "4px 0 0" }} />


        {/* Grocery list */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>
            🛒 {L ? "Liste d'épicerie" : "Grocery list"} ({unchecked.length})
          </div>
          {groceryList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#3a1f0d" }}>
                {L ? "Tout est dans votre garde-manger!" : "Everything is in your pantry!"}
              </div>
            </div>
          ) : (
            <>
              {unchecked.map((ing) => {
                const isExpanded = expandedItem === ing.id;
                const isSwiped = swipedItem === ing.id;
                const priceData = ingredientPrices[ing.id];
                const storeList = priceData?.stores ?? [];
                const cheapest = priceData?.cheapest;
                return (
                  <div key={ing.id} style={{ position: "relative", marginBottom: 8, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <button onClick={() => { setRemovedItems((p) => new Set([...p, ing.id])); setSwipedItem(null); }} style={{ background: "none", border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                        {L ? "Retirer" : "Remove"}
                      </button>
                    </div>
                    <div style={{ transform: isSwiped ? "translateX(-76px)" : "translateX(0)", transition: "transform .25s ease", position: "relative", zIndex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: isExpanded ? "12px 12px 0 0" : 12, gap: 10 }}>
                        <div onClick={() => toggleCheck(ing.id)} style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid #e8d8c8", background: "#fff", cursor: "pointer", flexShrink: 0 }} />
                        <div onClick={() => setSwipedItem(isSwiped ? null : ing.id)} style={{ flex: 1, cursor: "pointer" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d" }}>
                            {ing.emoji} {L && ing.nameFr ? ing.nameFr : ing.name}
                          </div>
                          <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>
                            {cheapest
                              ? `${L ? "Moins cher chez" : "Cheapest at"} ${cheapest.storeName} · $${cheapest.price.toFixed(2)}`
                              : (L ? "Appuyez ▼ pour les prix" : "Tap ▼ for prices")}
                          </div>
                        </div>
                        <button onClick={() => setExpandedItem(isExpanded ? null : ing.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#e8470d", fontWeight: 700, padding: "0 4px", fontFamily: "'Nunito', sans-serif" }}>
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      </div>
                      {isExpanded && (
                        <div style={{ border: "1px solid #f0e8de", borderTop: "none", borderRadius: "0 0 12px 12px", background: "#fafaf8", overflow: "hidden" }}>
                          {storeList.length === 0 ? (
                            <div style={{ padding: "12px 14px", fontSize: 12, color: "#c09878", fontWeight: 600 }}>
                              {locationLabel
                                ? (L ? "Aucun prix trouvé." : "No prices found. Try searching above.")
                                : (L ? "Entrez un code postal pour voir les prix." : "Enter a postal code above to see prices.")}
                            </div>
                          ) : storeList.map((p, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderBottom: "0.5px solid #f0e8de", background: i === 0 ? "#f0fdf4" : "transparent" }}>
                              <span style={{ fontSize: 13, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? "#16a34a" : "#3a1f0d" }}>
                                {i === 0 ? "🏆 " : ""}{p.storeName}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? "#16a34a" : "#c09878" }}>
                                ${p.price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {checked.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", margin: "14px 0 8px" }}>
                    ✓ {L ? "Dans le panier" : "In cart"} ({checked.length})
                  </div>
                  {checked.map((ing) => (
                    <div key={ing.id} onClick={() => toggleCheck(ing.id)} style={{ display: "flex", alignItems: "center", padding: "10px 14px", marginBottom: 6, border: "1px solid #f0e8de", borderRadius: 12, opacity: 0.4, cursor: "pointer", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: "#e8470d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d", textDecoration: "line-through" }}>
                        {ing.emoji} {L && ing.nameFr ? ing.nameFr : ing.name}
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
