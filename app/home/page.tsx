"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import MealCard from "@/components/MealCard";
import { SuggestionResult } from "@/lib/suggestions";

const MOCK_USER_ID = "user-001";

const CUISINES = [
  { id: "all",            label: "All",            flag: "🍽️" },
  { id: "italian",        label: "Italian",        flag: "🍕" },
  { id: "french",         label: "French",         flag: "🥐" },
  { id: "indian",         label: "Indian",         flag: "🍛" },
  { id: "mexican",        label: "Mexican",        flag: "🌮" },
  { id: "caribbean",      label: "Caribbean",      flag: "🌴" },
  { id: "asian",          label: "Asian",          flag: "🥢" },
  { id: "middle-eastern", label: "Middle Eastern", flag: "🧆" },
  { id: "american",       label: "American",       flag: "🍔" },
];

export default function HomePage() {
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [cuisine, setCuisine] = useState("all");
  const [savedMeals, setSavedMeals] = useState<Set<string>>(new Set());

  async function fetchSuggestions(selectedCuisine: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/suggestions?userId=${MOCK_USER_ID}&time=60&budget=50&cuisine=${selectedCuisine}`
      );
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSuggestions(cuisine); }, [cuisine]);

  function toggleSave(recipeId: string) {
    setSavedMeals((prev) => {
      const next = new Set(prev);
      next.has(recipeId) ? next.delete(recipeId) : next.add(recipeId);
      return next;
    });
  }

  const saleCount = suggestions.filter((s) => s.pricing.hasSaleItems).length;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="P'tit Chef" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Nunito', sans-serif" }}>P&apos;tit Chef</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>Eat Smarter. Save more. Share more.</div>
            </div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)", fontFamily: "'Nunito', sans-serif" }}>
            Good evening 👋
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0, fontFamily: "'Nunito', sans-serif" }}>
            What are we cooking tonight?
          </p>
        </div>
      </div>

      {/* Cuisine filters */}
      <div style={{ padding: "12px 20px 6px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", fontFamily: "'Nunito', sans-serif" }}>
        Cuisine
      </div>
      <div style={{ display: "flex", gap: 6, padding: "0 16px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
        {CUISINES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCuisine(c.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              border: "1.5px solid",
              borderColor: cuisine === c.id ? "#e8470d" : "#e8d8c8",
              background: cuisine === c.id ? "#e8470d" : "#fff",
              color: cuisine === c.id ? "#fff" : "#a08060",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            <span style={{ fontSize: 14 }}>{c.flag}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Section label */}
      <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", fontFamily: "'Nunito', sans-serif" }}>
        {loading
          ? "Finding meals…"
          : `${suggestions.length} suggestion${suggestions.length !== 1 ? "s" : ""}${saleCount > 0 ? ` · ${saleCount} on sale today` : ""}`}
      </div>

      {/* Meal cards */}
      <div style={{ padding: "0 16px" }}>
        {loading ? (
          <p style={{ color: "#c09878", fontSize: 14, padding: "20px 0", fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
            Finding the best meals for you…
          </p>
        ) : suggestions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>
            <p style={{ color: "#c09878", fontSize: 14, fontWeight: 700, fontFamily: "'Nunito', sans-serif", margin: 0 }}>
              No meals found for this cuisine.
            </p>
            <p style={{ color: "#d0c0b0", fontSize: 12, fontWeight: 600, fontFamily: "'Nunito', sans-serif", marginTop: 4 }}>
              Try a different cuisine or tap All.
            </p>
          </div>
        ) : (
          suggestions.map((s) => (
            <MealCard
              key={s.recipe.id}
              suggestion={s}
              isSaved={savedMeals.has(s.recipe.id)}
              onToggleSave={toggleSave}
            />
          ))
        )}
      </div>
    </main>
  );
}