"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import recipesData from "@/data/recipes.json";

interface Recipe { id: string; title: string; description: string; prepTimeMin: number; cuisine: string; emoji: string; calories: number; mode: string[]; ingredients: { ingredientId: string; quantity: number; unit: string; isOptional?: boolean }[]; }

const MOCK_TRENDING = [
  { recipeId: "rec-007", likes: 47, cooks: 128, trending: true },
  { recipeId: "rec-001", likes: 38, cooks: 95, trending: true },
  { recipeId: "rec-004", likes: 31, cooks: 82, trending: false },
  { recipeId: "rec-005", likes: 28, cooks: 74, trending: false },
  { recipeId: "rec-002", likes: 24, cooks: 61, trending: false },
  { recipeId: "rec-003", likes: 19, cooks: 55, trending: false },
  { recipeId: "rec-008", likes: 15, cooks: 43, trending: false },
];

export default function TrendingPage() {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const recipes = recipesData as Recipe[];

  function toggleLike(id: string) {
    const next = new Set(liked);
    next.has(id) ? next.delete(id) : next.add(id);
    setLiked(next);
  }

  const H = { background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={H}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="P'tit Chef" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>P&apos;tit Chef</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>Eat smart. Save more. Share more.</div>
            </div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>Trending 🔥</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>Most cooked meals this week</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>
        <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>This week&apos;s top meals</div>
        <div style={{ padding: "0 16px" }}>
          {MOCK_TRENDING.map((t, idx) => {
            const recipe = recipes.find((r) => r.id === t.recipeId);
            if (!recipe) return null;
            const isLiked = liked.has(recipe.id);
            return (
              <div key={recipe.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fff", border: t.trending ? "1.5px solid #e8470d" : "1px solid #f0e8de", borderRadius: 14, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: idx < 3 ? "#e8470d" : "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: idx < 3 ? "#fff" : "#c09878", flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fff8f4", border: "1px solid #fad8c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{recipe.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{recipe.title}</div>
                    {t.trending && <span style={{ fontSize: 9, fontWeight: 800, background: "#fff0ec", color: "#e8470d", padding: "2px 6px", borderRadius: 4 }}>HOT</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>
                    ⏱ {recipe.prepTimeMin} min · 🔥 {recipe.calories} kcal
                  </div>
                  <div style={{ fontSize: 11, color: "#a08060", fontWeight: 600, marginTop: 2 }}>
                    {t.cooks} cooks this week
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => toggleLike(recipe.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: isLiked ? "#e8470d" : "#d0c0b0", padding: 0 }}>
                    {isLiked ? "❤️" : "🤍"}
                  </button>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#c09878" }}>{t.likes + (isLiked ? 1 : 0)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ margin: "8px 16px 16px", background: "#f0faf3", border: "1px solid #b8ddc4", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#2d6a3f", marginBottom: 4 }}>Want to see your friends&apos; favorites?</div>
          <div style={{ fontSize: 11, color: "#5a9e6f", fontWeight: 600 }}>Social features coming soon — invite friends and see what they&apos;re cooking.</div>
        </div>
      </div>
    </main>
  );
}