"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import recipesData from "@/data/recipes.json";
import { getUserId } from "@/lib/user";


interface Recipe { id: string; title: string; description: string; prepTimeMin: number; calories: number; cuisine: string; emoji: string; mealType: string; mode: string[]; dietTags: string[]; ingredients: { ingredientId: string }[]; }


const RECIPES = recipesData as Recipe[];


const CUISINE_FILTERS = [
  { id: "all", label: "All" },
  { id: "italian", label: "🍕 Italian" },
  { id: "haitian", label: "🇭🇹 Haitian" },
  { id: "french", label: "🥐 French" },
  { id: "asian", label: "🥢 Asian" },
  { id: "mexican", label: "🌮 Mexican" },
  { id: "indian", label: "🍛 Indian" },
  { id: "middle-eastern", label: "🧆 Middle Eastern" },
  { id: "american", label: "🍔 American" },
];


export default function DiscoverPage() {
  const [pantryIds, setPantryIds] = useState<Set<string>>(new Set());
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [cuisine, setCuisine] = useState("all");
  const [lang, setLang] = useState("en");
  const router = useRouter();


  useEffect(() => {
    const id = getUserId();
    setLang(localStorage.getItem("prepplate-lang") ?? "en");
    const saved = localStorage.getItem("prepplate-pinned") ?? "[]";
    setPinned(new Set(JSON.parse(saved)));


    fetch(`/api/pantry?userId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        const ids = new Set<string>((data.items ?? []).map((i: { ingredientId: string }) => i.ingredientId));
        setPantryIds(ids);
      });
  }, []);


  function togglePin(id: string) {
    const next = new Set(pinned);
    next.has(id) ? next.delete(id) : next.add(id);
    setPinned(next);
    localStorage.setItem("prepplate-pinned", JSON.stringify([...next]));
  }


  // Only show recipes where user is MISSING 1-3 ingredients
  const discoverRecipes = RECIPES.filter((r) => {
    const missing = (r.ingredients ?? []).filter((i) => !pantryIds.has(i.ingredientId)).length;
    return missing >= 1 && missing <= 3;
  }).filter((r) => cuisine === "all" || r.cuisine === cuisine);


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
            {lang === "fr" ? "Découvrir" : "Discover"}
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>
            {lang === "fr"
              ? `${discoverRecipes.length} recettes à 1-3 ingrédients près • ${pinned.size} épinglée${pinned.size !== 1 ? "s" : ""}`
              : `${discoverRecipes.length} recipes within 1-3 ingredients • ${pinned.size} pinned`}
          </p>
        </div>
      </div>


      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 14 }}>


        {/* Cuisine filter */}
        <div style={{ display: "flex", gap: 6, padding: "0 16px 14px", overflowX: "auto", scrollbarWidth: "none" }}>
          {CUISINE_FILTERS.map((c) => (
            <button key={c.id} onClick={() => setCuisine(c.id)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: cuisine === c.id ? "#e8470d" : "#e8d8c8", background: cuisine === c.id ? "#e8470d" : "#fff", color: cuisine === c.id ? "#fff" : "#a08060", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif" }}>
              {c.label}
            </button>
          ))}
        </div>


        {/* Pinned strip */}
        {pinned.size > 0 && (
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 8 }}>
              📌 {lang === "fr" ? "Épinglées" : "Pinned"}
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
              {RECIPES.filter((r) => pinned.has(r.id)).map((r) => (
                <div key={r.id} onClick={() => router.push(`/meal/${r.id}`)} style={{ flexShrink: 0, width: 110, padding: "10px 12px", background: "#fff8f4", border: "1.5px solid #e8470d", borderRadius: 12, cursor: "pointer" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{r.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#3a1f0d", lineHeight: 1.2 }}>{r.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Recipe cards */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {discoverRecipes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#3a1f0d", marginBottom: 4 }}>
                {lang === "fr" ? "Votre garde-manger est bien rempli!" : "Your pantry is well stocked!"}
              </div>
              <div style={{ fontSize: 12, color: "#c09878", fontWeight: 600 }}>
                {lang === "fr" ? "Allez sur Accueil pour voir vos recettes disponibles." : "Head to Home to see recipes you can cook now."}
              </div>
            </div>
          ) : discoverRecipes.map((recipe) => {
            const isPinned = pinned.has(recipe.id);
            const missing = (recipe.ingredients ?? []).filter((i) => !pantryIds.has(i.ingredientId)).length;


            return (
              <div key={recipe.id} style={{ background: "#fff", border: `1.5px solid ${isPinned ? "#e8470d" : "#f0e8de"}`, borderRadius: 14, overflow: "hidden" }}>
                <div onClick={() => router.push(`/meal/${recipe.id}`)} style={{ padding: "14px 14px 10px", cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fff8f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                      {recipe.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#3a1f0d", marginBottom: 2 }}>{recipe.title}</div>
                      <div style={{ fontSize: 12, color: "#a08060", fontWeight: 600, marginBottom: 6 }}>{recipe.description}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#c09878", background: "#f5ede6", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>⏱ {recipe.prepTimeMin} min</span>
                        <span style={{ fontSize: 11, color: "#c09878", background: "#f5ede6", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>🔥 {recipe.calories} kcal</span>
                        <span style={{ fontSize: 11, color: "#e8470d", background: "#fff0ec", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                          🛒 {missing} {lang === "fr" ? `ingrédient${missing > 1 ? "s" : ""} manquant${missing > 1 ? "s" : ""}` : `ingredient${missing > 1 ? "s" : ""} missing`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", borderTop: "1px solid #f0e8de" }}>
                  <button onClick={() => router.push(`/meal/${recipe.id}`)} style={{ flex: 1, padding: "10px", background: "none", border: "none", fontSize: 12, fontWeight: 800, color: "#e8470d", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                    {lang === "fr" ? "Voir la recette →" : "View recipe →"}
                  </button>
                  <button onClick={() => togglePin(recipe.id)} style={{ padding: "10px 16px", background: isPinned ? "#fff0ec" : "none", border: "none", borderLeft: "1px solid #f0e8de", fontSize: 12, fontWeight: 800, color: isPinned ? "#e8470d" : "#c09878", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                    {isPinned ? (lang === "fr" ? "📌 Épinglé" : "📌 Pinned") : (lang === "fr" ? "📌 Épingler" : "📌 Pin")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}


