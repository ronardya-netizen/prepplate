"use client";
import { SuggestionResult } from "@/lib/suggestions";
import Link from "next/link";
import { useState, useEffect } from "react";

interface MealCardProps { suggestion: SuggestionResult; isSaved?: boolean; onToggleSave?: (id: string) => void; }

export default function MealCard({ suggestion, isSaved, onToggleSave }: MealCardProps) {
  const { recipe, pricing, missingIngredients, pantryIngredients, coveragePct } = suggestion;
  const [bookmarked, setBookmarked] = useState(isSaved ?? false);

  useEffect(() => { setBookmarked(isSaved ?? false); }, [isSaved]);

  function toggleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onToggleSave?.(recipe.id);
  }

  const totalDots = Math.min(recipe.ingredients.length, 6);
  const haveDots = Math.round((coveragePct / 100) * totalDots);
  const needDots = totalDots - haveDots;

  return (
    <div style={{ background: "#fff", border: pricing.hasSaleItems ? "1.5px solid #e8470d" : "1px solid #f0e8de", borderRadius: 14, marginBottom: 10, overflow: "hidden", fontFamily: "'Nunito', sans-serif" }}>
      <Link href={`/meal/${recipe.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ display: "flex", alignItems: "flex-start", padding: "12px 14px 8px", gap: 10 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "#fff8f4", border: "1px solid #fad8c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{recipe.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#3a1f0d", lineHeight: 1.3 }}>{recipe.title}</div>
            <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>{recipe.description}</div>
            <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
              <Badge variant="neutral">{recipe.prepTimeMin} min</Badge>
              <Badge variant="neutral">🔥 {recipe.calories} kcal</Badge>
              <Badge variant="neutral">~${pricing.totalCost.toFixed(2)}</Badge>
              {pricing.hasSaleItems && <Badge variant="sale">Save ${pricing.totalSavings.toFixed(2)}</Badge>}
              {missingIngredients.length > 0 && <Badge variant="missing">Buy {missingIngredients.length} item{missingIngredients.length > 1 ? "s" : ""}</Badge>}
            </div>
          </div>
          <button onClick={toggleBookmark} style={{ width: 30, height: 30, borderRadius: "50%", background: bookmarked ? "#fde8d8" : "#f5f0e8", border: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: bookmarked ? "#e8470d" : "#d0c0b0", flexShrink: 0 }}>
            {bookmarked ? "🔖" : "🏷️"}
          </button>
        </div>
      </Link>
      <div style={{ display: "flex", alignItems: "center", padding: "7px 14px 10px", borderTop: "1px solid #f5ede5", gap: 4 }}>
        {Array.from({ length: haveDots }).map((_, i) => <div key={`h${i}`} style={{ width: 8, height: 8, borderRadius: "50%", background: "#e8470d" }} />)}
        {Array.from({ length: needDots }).map((_, i) => <div key={`n${i}`} style={{ width: 8, height: 8, borderRadius: "50%", background: "#e8d8c8" }} />)}
        <span style={{ fontSize: 11, color: "#c09878", marginLeft: 5, fontWeight: 600 }}>{pantryIngredients.length}/{recipe.ingredients.filter(i => !i.isOptional).length} in pantry{missingIngredients.length === 0 ? " · nothing to buy" : ""}</span>
      </div>
    </div>
  );
}

function Badge({ children, variant }: { children: React.ReactNode; variant: "neutral" | "sale" | "missing" }) {
  const styles: Record<string, React.CSSProperties> = { neutral: { background: "#f5f0e8", color: "#a08060" }, sale: { background: "#e8f5ec", color: "#2d6a3f" }, missing: { background: "#fff0ec", color: "#e8470d" } };
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, ...styles[variant] }}>{children}</span>;
}
