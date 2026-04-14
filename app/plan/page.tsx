"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import recipesData from "@/data/recipes.json";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";


interface Recipe { id: string; title: string; description: string; prepTimeMin: number; calories: number; cuisine: string; emoji: string; mealType: string; mode: string[]; dietTags: string[]; ingredients: { ingredientId: string; quantity: number; unit: string }[]; }
interface IngredientData { id: string; name: string; nameFr?: string; emoji?: string; category: string; unit: string; basePrice: number; defaultShelfDays: number; }
interface StorePrice { storeName: string; price: number; type?: string; link?: string; }
interface IngredientPriceResult { ingredient: string; stores: StorePrice[]; inStore?: StorePrice[]; online?: StorePrice[]; cheapest: StorePrice | null; }


const RECIPES = recipesData as Recipe[];
const INGREDIENTS = ingredientsData as IngredientData[];
const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];


function getTodayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}


export default function PlanPage() {
  const [pantryIds, setPantryIds] = useState<Set<string>>(new Set());
  const [weekPlan, setWeekPlan] = useState<(Recipe | null)[]>(Array(7).fill(null));
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(true);


  const [postalCode, setPostalCode] = useState("");
  const [radius, setRadius] = useState(5);
  const [locationLabel, setLocationLabel] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [ingredientPrices, setIngredientPrices] = useState<Record<string, IngredientPriceResult>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesError, setPricesError] = useState("");


  const L = lang === "fr";
  const dayLabels = L ? DAYS_FR : DAYS_EN;


  useEffect(() => {
    const id = getUserId();
    setLang(localStorage.getItem("prepplate-lang") ?? "en");


    const savedPostal = localStorage.getItem("prepplate-postal") ?? "";
    const savedRadius = localStorage.getItem("prepplate-radius") ?? "5";
    const savedLabel = localStorage.getItem("prepplate-location-label") ?? "";
    if (savedPostal) { setPostalCode(savedPostal); setRadius(parseInt(savedRadius)); setLocationLabel(savedLabel); }


    const savedPlan: (string | null)[] | null = JSON.parse(localStorage.getItem("prepplate-weekplan") ?? "null");
    const pinned: string[] = JSON.parse(localStorage.getItem("prepplate-pinned") ?? "[]");


    fetch(`/api/pantry?userId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        const items = data.items ?? [];
        const ids = new Set<string>(items.map((i: { ingredientId: string }) => i.ingredientId));
        setPantryIds(ids);


        if (savedPlan && savedPlan.length === 7) {
          setWeekPlan(savedPlan.map((rid) => rid ? RECIPES.find((r) => r.id === rid) ?? null : null));
        } else {
          autoFill(ids, pinned);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);


  function autoFill(pantrySet: Set<string>, pinnedIds: string[]) {
    const plan: (Recipe | null)[] = Array(7).fill(null);
    const used = new Set<string>();
    const pinnedRecipes = RECIPES.filter((r) => pinnedIds.includes(r.id));
    pinnedRecipes.slice(0, 7).forEach((r, i) => { plan[i] = r; used.add(r.id); });


    const ranked = RECIPES
      .filter((r) => !used.has(r.id))
      .map((r) => ({ r, cov: (r.ingredients ?? []).filter((i) => pantrySet.has(i.ingredientId)).length / Math.max((r.ingredients ?? []).length, 1) }))
      .sort((a, b) => b.cov - a.cov);


    for (let i = 0; i < 7; i++) {
      if (!plan[i] && ranked.length) { const next = ranked.shift()!; plan[i] = next.r; }
    }
    setWeekPlan(plan);
    save(plan);
  }


  function save(plan: (Recipe | null)[]) {
    localStorage.setItem("prepplate-weekplan", JSON.stringify(plan.map((r) => r?.id ?? null)));
  }


  function assignMeal(day: number, recipe: Recipe) {
    const next = [...weekPlan]; next[day] = recipe; setWeekPlan(next); save(next); setPickerDay(null);
  }


  function clearDay(day: number) {
    const next = [...weekPlan]; next[day] = null; setWeekPlan(next); save(next);
  }


  function toggleCheck(id: string) {
    const next = new Set(checkedItems); next.has(id) ? next.delete(id) : next.add(id); setCheckedItems(next);
  }


  const activeMeals = weekPlan.filter((m): m is Recipe => m !== null);
  const neededIds = new Set<string>();
  for (const meal of activeMeals) { for (const ing of meal.ingredients ?? []) { if (!pantryIds.has(ing.ingredientId)) neededIds.add(ing.ingredientId); } }
  const groceryList = INGREDIENTS.filter((i) => neededIds.has(i.id));
  const unchecked = groceryList.filter((i) => !checkedItems.has(i.id));
  const checked = groceryList.filter((i) => checkedItems.has(i.id));
  const usedIds = new Set(activeMeals.map((r) => r.id));
  const availableRecipes = RECIPES.filter((r) => !usedIds.has(r.id));


  async function searchStoresAndPrices() {
    const cleaned = postalCode.trim().toUpperCase().replace(/\s/g, "");
    if (cleaned.length < 3) return;
    setLocationLoading(true); setLocationError(""); setPricesError("");


    try {
      const locRes = await fetch(`/api/location?postalCode=${encodeURIComponent(cleaned)}`);
      const locData = await locRes.json();
      if (!locRes.ok) throw new Error(locData.error ?? "Could not find postal code");
      const label = `${locData.city}, ${locData.province}`;
      setLocationLabel(label);
      localStorage.setItem("prepplate-postal", cleaned);
      localStorage.setItem("prepplate-radius", String(radius));
      localStorage.setItem("prepplate-location-label", label);
    } catch (e: unknown) {
      setLocationError(e instanceof Error ? e.message : "Could not find location");
      setLocationLoading(false); return;
    }
    setLocationLoading(false);
    if (groceryList.length === 0) return;


    setPricesLoading(true);
    try {
      const location = localStorage.getItem("prepplate-location-label") + ", Canada";
      const priceMap: Record<string, IngredientPriceResult> = {};
      await Promise.all(groceryList.map(async (ing) => {
        try {
          const res = await fetch(`/api/nearby-prices?ingredient=${encodeURIComponent(ing.name)}&location=${encodeURIComponent(location)}&postalCode=${encodeURIComponent(postalCode.trim())}&radius=${radius}`);
          const data = await res.json();
          const mapS = (r: { store: string; price: number; type?: string; link?: string }) => ({ storeName: r.store, price: r.price, type: r.type, link: r.link });
          const inStore = (data.inStore ?? []).map(mapS);
          const online = (data.online ?? []).map(mapS);
          priceMap[ing.id] = { ingredient: ing.name, stores: [...inStore, ...online], inStore, online, cheapest: inStore[0] ?? online[0] ?? null };
        } catch {}
      }));
      setIngredientPrices(priceMap);
    } catch { setPricesError(L ? "Impossible de charger les prix." : "Could not load prices."); }
    finally { setPricesLoading(false); }
  }


  function exportToInstacart() {
    const items = unchecked.map((i) => i.name).join(", ");
    window.open(`https://www.instacart.com/store/search/${encodeURIComponent(items)}`, "_blank");
  }


  function copyGroceryList() {
    const text = unchecked.map((i) => `- ${i.emoji ?? ""} ${i.name}`).join("\n");
    navigator.clipboard.writeText(text);
    alert(L ? "Liste copiee!" : "List copied!");
  }


  function shareGroceryList() {
    const text = (L ? "Ma liste d'epicerie PrepPlate:\n" : "My PrepPlate grocery list:\n") + unchecked.map((i) => `- ${i.emoji ?? ""} ${i.name}`).join("\n");
    if (navigator.share) { navigator.share({ title: "PrepPlate", text }); } else { copyGroceryList(); }
  }


  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>


      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Image src="/logo-icon.png" alt="PrepPlate" width={36} height={36} style={{ borderRadius: 10, objectFit: "cover" }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>PrepPlate</span>
          </div>
          <a href="/profile" style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, textDecoration: "none", cursor: "pointer" }}>👤</a>
        </div>
        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{L ? "Mon plan de la semaine" : "My Week"}</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>{L ? "Organisez vos repas • Prix en temps reel" : "Organize your meals • Live prices"}</p>
        </div>
      </div>


      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>


        {/* ── Weekly Calendar ── */}
        <div style={{ padding: "0 16px 4px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>
            🗓 {L ? "Semaine" : "This week"}
          </div>


          {loading ? (
            <div className="skeleton" style={{ height: 200, marginBottom: 12 }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {weekPlan.map((meal, idx) => {
                const isToday = idx === getTodayIndex();
                const missing = meal ? (meal.ingredients ?? []).filter((i) => !pantryIds.has(i.ingredientId)) : [];
                const missingNames = missing.map((i) => { const ing = INGREDIENTS.find((x) => x.id === i.ingredientId); return ing ? (L && ing.nameFr ? ing.nameFr : ing.name) : ""; }).filter(Boolean);
                return (
                  <div key={idx} className="animate-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: isToday ? "#fff8f4" : "#fff", border: `1.5px solid ${isToday ? "#e8470d" : "#f0e8de"}`, borderRadius: 12 }}>
                    <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: isToday ? "#e8470d" : "#c09878" }}>{dayLabels[idx]}</div>
                      {isToday && <div style={{ fontSize: 8, fontWeight: 800, color: "#e8470d" }}>{L ? "Auj." : "Today"}</div>}
                    </div>


                    {meal ? (
                      <>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fff8f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{meal.emoji}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meal.title}</div>
                          <div style={{ fontSize: 10, color: "#c09878", fontWeight: 600, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {missing.length > 0
                              ? `🛒 ${L ? "Manque" : "Need"}: ${missingNames.join(", ")}`
                              : `✓ ${L ? "Tout pret" : "Ready"}`}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <button onClick={() => setPickerDay(idx)} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", padding: "4px" }}>🔄</button>
                          <button onClick={() => clearDay(idx)} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", padding: "4px" }}>✕</button>
                        </div>
                      </>
                    ) : (
                      <button onClick={() => setPickerDay(idx)} style={{ flex: 1, padding: "8px 12px", background: "#fff8f4", border: "1.5px dashed #fad8c8", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#c09878", cursor: "pointer", fontFamily: "'Nunito', sans-serif", textAlign: "left" }}>
                        + {L ? "Ajouter un repas" : "Add a meal"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>


        {/* ── Meal Picker Modal ── */}
        {pickerDay !== null && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 480, maxHeight: "70vh", background: "#fff", borderRadius: "20px 20px 0 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0e8de", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#3a1f0d" }}>{dayLabels[pickerDay]} — {L ? "Choisir un repas" : "Pick a meal"}</div>
                  <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>{availableRecipes.length} {L ? "disponibles" : "available"}</div>
                </div>
                <button onClick={() => setPickerDay(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#c09878", padding: "4px" }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                {availableRecipes.map((r) => {
                  const miss = (r.ingredients ?? []).filter((i) => !pantryIds.has(i.ingredientId)).length;
                  return (
                    <div key={r.id} onClick={() => assignMeal(pickerDay, r)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1.5px solid #f0e8de", borderRadius: 12, marginBottom: 6, cursor: "pointer", background: "#fff" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff8f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{r.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{r.title}</div>
                        <div style={{ fontSize: 10, color: "#c09878", fontWeight: 600 }}>
                          ⏱ {r.prepTimeMin} min · 🔥 {r.calories} kcal · 🛒 {miss} {L ? "manquants" : "missing"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}


        <div style={{ height: 8, background: "#f5f0eb", margin: "12px 0 0" }} />


        {/* ── Nearby Stores ── */}
        <div style={{ padding: "14px 16px 8px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>
            🏪 {L ? "Prix a proximite" : "Nearby prices"}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && searchStoresAndPrices()} placeholder={L ? "Code postal (ex: H2X 1Y4)" : "Postal code (e.g. H2X 1Y4)"} maxLength={7} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e8d8c8", fontSize: 14, fontFamily: "'Nunito', sans-serif", outline: "none", letterSpacing: "0.08em", fontWeight: 700 }} />
            <button onClick={searchStoresAndPrices} disabled={locationLoading || pricesLoading || postalCode.trim().length < 3} style={{ padding: "10px 16px", borderRadius: 10, background: "#e8470d", border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: postalCode.trim().length < 3 ? "not-allowed" : "pointer", fontFamily: "'Nunito', sans-serif", opacity: postalCode.trim().length < 3 ? 0.5 : 1, whiteSpace: "nowrap" }}>
              {locationLoading || pricesLoading ? "..." : (L ? "Chercher" : "Search")}
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[3, 5, 10, 15].map((r) => (
              <button key={r} onClick={() => setRadius(r)} style={{ padding: "4px 10px", borderRadius: 14, fontSize: 11, fontWeight: 700, border: "1.5px solid", borderColor: radius === r ? "#e8470d" : "#e8d8c8", background: radius === r ? "#e8470d" : "#fff", color: radius === r ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {r} km
              </button>
            ))}
          </div>
          {locationError && <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, margin: "0 0 8px" }}>{locationError}</p>}
          {locationLabel && !locationError && <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginBottom: 8 }}>📍 {L ? "Resultats pres de" : "Results near"} {locationLabel}</div>}
          {pricesError && <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, margin: "0 0 8px" }}>{pricesError}</p>}
        </div>


        <div style={{ height: 8, background: "#f5f0eb" }} />


        {/* ── Grocery List ── */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
              🛒 {L ? "Liste d'epicerie" : "Grocery list"} ({unchecked.length})
            </div>
            {groceryList.length > 0 && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={shareGroceryList} style={{ padding: "4px 10px", borderRadius: 14, fontSize: 10, fontWeight: 700, border: "1.5px solid #e8d8c8", background: "#fff", color: "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                  📤 {L ? "Partager" : "Share"}
                </button>
                <button onClick={copyGroceryList} style={{ padding: "4px 10px", borderRadius: 14, fontSize: 10, fontWeight: 700, border: "1.5px solid #e8d8c8", background: "#fff", color: "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                  📋 {L ? "Copier" : "Copy"}
                </button>
              </div>
            )}
          </div>


          {groceryList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#3a1f0d" }}>{L ? "Tout est dans votre garde-manger!" : "Everything is in your pantry!"}</div>
            </div>
          ) : (
            <>
              {unchecked.map((ing) => {
                const isExpanded = expandedItem === ing.id;
                const priceData = ingredientPrices[ing.id];
                const cheapest = priceData?.cheapest;
                return (
                  <div key={ing.id} className="animate-item" style={{ marginBottom: 8, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: isExpanded ? "12px 12px 0 0" : 12, gap: 10 }}>
                      <div onClick={() => toggleCheck(ing.id)} style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid #e8d8c8", background: "#fff", cursor: "pointer", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d" }}>{ing.emoji} {L && ing.nameFr ? ing.nameFr : ing.name}</div>
                        <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>
                          {cheapest ? `${L ? "Moins cher chez" : "Cheapest at"} ${cheapest.storeName} · $${cheapest.price.toFixed(2)}` : (L ? "Appuyez ▼ pour les prix" : "Tap ▼ for prices")}
                        </div>
                      </div>
                      <button onClick={() => setExpandedItem(isExpanded ? null : ing.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#e8470d", fontWeight: 700, padding: "0 4px", fontFamily: "'Nunito', sans-serif" }}>
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                    {isExpanded && (
                      <div style={{ border: "1px solid #f0e8de", borderTop: "none", borderRadius: "0 0 12px 12px", background: "#fafaf8", overflow: "hidden" }}>
                        {!priceData || priceData.stores.length === 0 ? (
                          <div style={{ padding: "12px 14px", fontSize: 12, color: "#c09878", fontWeight: 600 }}>
                            {locationLabel ? (L ? "Aucun prix trouve." : "No prices found. Try searching above.") : (L ? "Entrez un code postal pour voir les prix." : "Enter a postal code above to see prices.")}
                          </div>
                        ) : (
                          <>
                            {(priceData.inStore ?? []).length > 0 && (
                              <>
                                <div style={{ padding: "6px 14px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#16a34a", background: "#f0fdf4" }}>🏪 {L ? "En magasin" : "In-store"}</div>
                                {(priceData.inStore ?? []).map((p, i) => (
                                  <div key={"s" + i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderBottom: "0.5px solid #f0e8de" }}>
                                    <span style={{ fontSize: 13, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? "#16a34a" : "#3a1f0d" }}>{i === 0 ? "🏆 " : ""}{p.storeName}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ fontSize: 13, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? "#16a34a" : "#c09878" }}>${p.price.toFixed(2)}</span>
                                      {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#e8470d", fontWeight: 700, textDecoration: "none" }}>→</a>}
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                            {(priceData.online ?? []).length > 0 && (
                              <>
                                <div style={{ padding: "6px 14px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#a08060", background: "#faf8f5" }}>🌐 {L ? "En ligne" : "Online"}</div>
                                {(priceData.online ?? []).map((p, i) => (
                                  <div key={"o" + i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderBottom: "0.5px solid #f0e8de" }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#3a1f0d" }}>{p.storeName}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ fontSize: 13, fontWeight: 600, color: "#c09878" }}>${p.price.toFixed(2)}</span>
                                      {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#e8470d", fontWeight: 700, textDecoration: "none" }}>→</a>}
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}


              {checked.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", margin: "14px 0 8px" }}>✓ {L ? "Dans le panier" : "In cart"} ({checked.length})</div>
                  {checked.map((ing) => (
                    <div key={ing.id} onClick={() => toggleCheck(ing.id)} style={{ display: "flex", alignItems: "center", padding: "10px 14px", marginBottom: 6, border: "1px solid #f0e8de", borderRadius: 12, opacity: 0.4, cursor: "pointer", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: "#e8470d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d", textDecoration: "line-through" }}>{ing.emoji} {L && ing.nameFr ? ing.nameFr : ing.name}</span>
                    </div>
                  ))}
                </>
              )}


              {/* Export buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 16, marginBottom: 20 }}>
                <button onClick={exportToInstacart} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: "#0aaf51", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  🛒 Instacart
                </button>
                <button onClick={shareGroceryList} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1.5px solid #e8d8c8", background: "#fff", color: "#3a1f0d", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  📤 {L ? "Partager" : "Share"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
