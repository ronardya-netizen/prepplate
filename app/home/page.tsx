"use client";
import { getUserId } from "@/lib/user";
import { useEffect, useState } from "react";
import Image from "next/image";
import MealCard from "@/components/MealCard";
import { SuggestionResult } from "@/lib/suggestions";

const CUISINES = [
  { id: "all", label: "All", flag: "🍽️" },
  { id: "italian", label: "Italian", flag: "🍕" },
  { id: "french", label: "French", flag: "🥐" },
  { id: "indian", label: "Indian", flag: "🍛" },
  { id: "mexican", label: "Mexican", flag: "🌮" },
  { id: "haitian", label: "Haitian", flag: "🇭🇹" },
  { id: "asian", label: "Asian", flag: "🥢" },
  { id: "middle-eastern", label: "Middle Eastern", flag: "🧆" },
  { id: "american", label: "American", flag: "🍔" },
];

const MODES = [
  { id: "all", label: "All", icon: "🍽️" },
  { id: "quick", label: "Quick", icon: "⚡" },
  { id: "low-cal", label: "Low cal", icon: "🥗" },
  { id: "high-protein", label: "High protein", icon: "💪" },
  { id: "comfort", label: "Comfort", icon: "🍝" },
  { id: "healthy", label: "Healthy", icon: "🌿" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [cuisine, setCuisine] = useState("all");
  const [mode, setMode] = useState("all");
  const [savedMeals, setSavedMeals] = useState<Set<string>>(new Set());
  const [pantryItems, setPantryItems] = useState<{ingredientId: string; expiryDays?: number}[]>([]);
  const [userId, setUserId] = useState("user-001");

  useEffect(() => {
    const id = getUserId();
    setUserId(id);
    const saved = localStorage.getItem("bookmarked-meals");
    if (saved) setSavedMeals(new Set(JSON.parse(saved)));
    fetch(`/api/pantry?userId=${id}`)
      .then((r) => r.json())
      .then((data) => setPantryItems(data.items ?? []));
  }, []);

  useEffect(() => {
    if (userId) fetchSuggestions(cuisine, mode);
  }, [cuisine, mode, userId, pantryItems]);

  async function fetchSuggestions(c: string, m: string) {
    setLoading(true);
    try {
      const id = getUserId();
      const settings = JSON.parse(localStorage.getItem("prepplate-settings") ?? "{}");
      const expiring = pantryItems
        .filter((i) => i.expiryDays !== undefined && i.expiryDays <= 2)
        .map((i) => i.ingredientId)
        .join(",");
      const res = await fetch(`/api/suggestions?userId=${id}&time=60&budget=${settings.budget ?? 50}&cuisine=${c}&mode=${m}&expiring=${expiring}`);
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function toggleSave(recipeId: string) {
    const next = new Set(savedMeals);
    next.has(recipeId) ? next.delete(recipeId) : next.add(recipeId);
    setSavedMeals(next);
    localStorage.setItem("bookmarked-meals", JSON.stringify([...next]));
  }

  const expiringCount = pantryItems.filter((i) => i.expiryDays !== undefined && i.expiryDays <= 2).length;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 10 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Image src="/logo-icon.png" alt="PrepPlate" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>PrepPlate</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>

        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>{getGreeting()} 👋</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>
            {expiringCount > 0 ? `${expiringCount} ingredient${expiringCount > 1 ? "s" : ""} expiring soon — use them first!` : "What are we cooking today?"}
          </p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 14 }}>

        {expiringCount > 0 && (
          <div onClick={() => setMode("all")} style={{ margin: "0 16px 12px", padding: "10px 14px", background: "#fff0ec", border: "1.5px solid #e8470d", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 18 }}>⏰</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#e8470d" }}>Use expiring ingredients first</div>
              <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>Meals below prioritize what expires soon</div>
            </div>
          </div>
        )}

        <div style={{ padding: "0 20px 6px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>Mode</div>
        <div style={{ display: "flex", gap: 6, padding: "0 16px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: mode === m.id ? "#e8470d" : "#e8d8c8", background: mode === m.id ? "#e8470d" : "#fff", color: mode === m.id ? "#fff" : "#a08060", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif" }}>
              <span style={{ fontSize: 14 }}>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "0 20px 6px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>Cuisine</div>
        <div style={{ display: "flex", gap: 6, padding: "0 16px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
          {CUISINES.map((c) => (
            <button key={c.id} onClick={() => setCuisine(c.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: cuisine === c.id ? "#e8470d" : "#e8d8c8", background: cuisine === c.id ? "#e8470d" : "#fff", color: cuisine === c.id ? "#fff" : "#a08060", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif" }}>
              <span style={{ fontSize: 14 }}>{c.flag}</span>{c.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
          {loading ? "Finding meals…" : `${suggestions.length} suggestion${suggestions.length !== 1 ? "s" : ""}`}
        </div>

        <div style={{ padding: "0 16px" }}>
          {loading ? (
            <p style={{ color: "#c09878", fontSize: 14, padding: "20px 0", fontWeight: 700 }}>Finding the best meals for you…</p>
          ) : suggestions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
              <p style={{ color: "#c09878", fontSize: 14, fontWeight: 700, margin: 0 }}>No meals found.</p>
              <p style={{ color: "#d0c0b0", fontSize: 12, fontWeight: 600, marginTop: 4 }}>Try a different mode or add more ingredients to your pantry.</p>
            </div>
          ) : (
            suggestions.slice(0,3).map((s) => (
              <MealCard key={s.recipe.id} suggestion={s} isSaved={savedMeals.has(s.recipe.id)} onToggleSave={toggleSave} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}

