"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import recipesData from "@/data/recipes.json";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";
import { getLang, t } from "@/lib/i18n";

interface Recipe { id: string; title: string; emoji: string; calories: number; prepTimeMin: number; ingredients: { ingredientId: string; quantity: number; unit: string; isOptional?: boolean }[]; }
interface IngredientData { id: string; name: string; category: string; unit: string; basePrice: number; }

const MONTREAL_STORES = [
  { id: "maxi", name: "Maxi", searchUrl: "https://www.maxi.ca/en/search?q=", website: "https://www.maxi.ca", emoji: "🔴" },
  { id: "iga", name: "IGA", searchUrl: "https://www.iga.net/en/search?term=", website: "https://www.iga.net", emoji: "🟢" },
  { id: "metro", name: "Metro", searchUrl: "https://www.metro.ca/en/search?filter=", website: "https://www.metro.ca", emoji: "🔵" },
  { id: "superc", name: "Super C", searchUrl: "https://www.superc.ca/en/search?q=", website: "https://www.superc.ca", emoji: "🟡" },
  { id: "provigo", name: "Provigo", searchUrl: "https://www.provigo.ca/en/search?filter=", website: "https://www.provigo.ca", emoji: "🟠" },
  { id: "walmart", name: "Walmart", searchUrl: "https://www.walmart.ca/search?q=", website: "https://www.walmart.ca", emoji: "🔵" },
  { id: "costco", name: "Costco", searchUrl: "https://www.costco.ca/CatalogSearch?keyword=", website: "https://www.costco.ca", emoji: "⭕" },
  { id: "pa", name: "PA Supermarché", searchUrl: "https://www.pasupermarche.com/search?q=", website: "https://www.pasupermarche.com", emoji: "🟣" },
  { id: "adonis", name: "Marché Adonis", searchUrl: "https://www.marcheadonis.com/en/search?q=", website: "https://www.marcheadonis.com", emoji: "🟤" },
  { id: "avril", name: "Avril", searchUrl: "https://www.avril.ca/en/search?q=", website: "https://www.avril.ca", emoji: "🌿" },
  { id: "rachelle", name: "Rachelle-Béry", searchUrl: "https://www.rachelle-bery.com/recherche?q=", website: "https://www.rachelle-bery.com", emoji: "🌱" },
  { id: "instacart", name: "Instacart", searchUrl: "https://www.instacart.ca/store/search_v3/term?term=", website: "https://www.instacart.ca", emoji: "🛒" },
];

function getStoresForPostal(postalCode: string): typeof MONTREAL_STORES {
  const prefix = postalCode.toUpperCase().replace(/\s/g, "").substring(0, 2);
  const allMontreal = ["H1","H2","H3","H4","H5","H7","H8","H9","J4","J5","J6","J7","J8"];
  const isMontreal = allMontreal.some((p) => prefix.startsWith(p));
  if (isMontreal) return MONTREAL_STORES;
  // Ontario
  const onPrefixes = ["M1","M2","M3","M4","M5","M6","K1","K2","L1","L2","L3","L4"];
  if (onPrefixes.some((p) => prefix.startsWith(p))) {
    return MONTREAL_STORES.filter((s) => ["walmart", "costco", "instacart"].includes(s.id));
  }
  return MONTREAL_STORES.filter((s) => ["walmart", "instacart"].includes(s.id));
}

export default function PlanPage() {
  const [pantryIds, setPantryIds] = useState<string[]>([]);
  const [savedMealIds, setSavedMealIds] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [postalCode, setPostalCode] = useState("");
  const [editingPostal, setEditingPostal] = useState(false);
  const [postalInput, setPostalInput] = useState("");
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [lang, setLang] = useState<"en" | "fr">("en");

  const T = t[lang].plan;

  useEffect(() => {
    const id = getUserId();
    setLang(getLang());
    fetch(`/api/pantry?userId=${id}`).then((r) => r.json()).then((data) => setPantryIds((data.items ?? []).map((i: { ingredientId: string }) => i.ingredientId)));
    const saved = localStorage.getItem("prepplate-postal");
    if (saved) setPostalCode(saved);
    const savedStore = localStorage.getItem("prepplate-store");
    if (savedStore) setSelectedStore(savedStore);
    const planMeals = JSON.parse(localStorage.getItem("plan-meals") ?? "[]");
    setSavedMealIds(planMeals);
  }, []);

  function savePostal() {
    const cleaned = postalInput.toUpperCase().trim();
    setPostalCode(cleaned);
    localStorage.setItem("prepplate-postal", cleaned);
    setEditingPostal(false);
  }

  function selectStore(storeId: string) {
    setSelectedStore(storeId);
    localStorage.setItem("prepplate-store", storeId);
  }

  function unsaveMeal(recipeId: string) {
    const updated = savedMealIds.filter((id) => id !== recipeId);
    setSavedMealIds(updated);
    localStorage.setItem("plan-meals", JSON.stringify(updated));
  }

  function toggleChecked(id: string) {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  }

  const nearbyStores = postalCode ? getStoresForPostal(postalCode) : MONTREAL_STORES;
  const activeStore = nearbyStores.find((s) => s.id === selectedStore) ?? nearbyStores[0];

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
    return { id, name: ing.name };
  }).filter(Boolean) as { id: string; name: string }[];

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
              <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>{postalCode ? `${nearbyStores.length} ${lang === "fr" ? "magasins près de vous" : "stores near you"}` : T.postalSub}</div>
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

        {/* Store selector */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 8 }}>
            {lang === "fr" ? "Choisir votre magasin" : "Choose your store"}
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
            {nearbyStores.map((store) => (
              <button key={store.id} onClick={() => selectStore(store.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 10px", borderRadius: 12, border: "1.5px solid", borderColor: activeStore.id === store.id ? "#e8470d" : "#e8d8c8", background: activeStore.id === store.id ? "#fff0ec" : "#fff", cursor: "pointer", fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>
                <span style={{ fontSize: 18 }}>{store.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: activeStore.id === store.id ? "#e8470d" : "#a08060" }}>{store.name}</span>
              </button>
            ))}
          </div>
          {activeStore && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#fff8f4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#3a1f0d" }}>
                {lang === "fr" ? `Acheter chez ${activeStore.name}` : `Shopping at ${activeStore.name}`}
              </span>
              <a href={activeStore.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 800, color: "#e8470d", textDecoration: "none" }}>
                {lang === "fr" ? "Visiter →" : "Visit →"}
              </a>
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
              <div key={meal.id} style={{ padding: "10px 14px", background: "#fff", border: isSaved ? "1.5px solid #e8470d" : "1px solid #f0e8de", borderRadius: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff8f4", border: "1px solid #fad8c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{meal.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{meal.title}</div>
                    <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>{T.need(missing.length)}</div>
                  </div>
                  {isSaved && <button onClick={() => unsaveMeal(meal.id)} style={{ fontSize: 9, fontWeight: 800, background: "#fff0ec", color: "#e8470d", padding: "2px 7px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>{lang === "fr" ? "Retirer" : "Remove"}</button>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grocery list */}
        {shoppingItems.length > 0 && (
          <>
            <div style={{ margin: "0 16px 12px", background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{T.groceryList}</div>
                <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>{T.itemsRemaining(shoppingItems.length - checked.size)}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2d6a3f", background: "#f0faf3", padding: "4px 10px", borderRadius: 8 }}>
                {activeStore.emoji} {activeStore.name}
              </div>
            </div>

            <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
              {lang === "fr" ? `Acheter chez ${activeStore.name}` : `Buy at ${activeStore.name}`}
            </div>
            <div style={{ padding: "0 16px" }}>
              {shoppingItems.map((item) => {
                const buyUrl = `${activeStore.searchUrl}${encodeURIComponent(item.name)}`;
                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: checked.has(item.id) ? "#f5f0e8" : "#fff", border: "1px solid #f0e8de", borderRadius: 12, marginBottom: 6, opacity: checked.has(item.id) ? 0.5 : 1 }}>
                    <div onClick={() => toggleChecked(item.id)} style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: checked.has(item.id) ? "#e8470d" : "#fff", border: `2px solid ${checked.has(item.id) ? "#e8470d" : "#e8d8c8"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      {checked.has(item.id) ? "✓" : ""}
                    </div>
                    <div onClick={() => toggleChecked(item.id)} style={{ flex: 1, cursor: "pointer" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d", textDecoration: checked.has(item.id) ? "line-through" : "none" }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>{activeStore.name}</div>
                    </div>
                    <a href={buyUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ padding: "6px 10px", borderRadius: 8, background: "#e8470d", color: "#fff", fontSize: 11, fontWeight: 800, textDecoration: "none", flexShrink: 0 }}>
                      {T.buy} →
                    </a>
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
