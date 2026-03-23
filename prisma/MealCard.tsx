"use client";

import { SuggestionResult } from "@/lib/suggestions";
import ingredientsData from "@/data/ingredients.json";
import Link from "next/link";

interface MealCardProps {
  suggestion: SuggestionResult;
  isSaved?: boolean;
  onToggleSave?: (recipeId: string) => void;
}

function getIngredientName(id: string): string {
  const ing = (ingredientsData as { id: string; name: string }[]).find(
    (i) => i.id === id
  );
  return ing?.name ?? id;
}

export default function MealCard({ suggestion, isSaved, onToggleSave }: MealCardProps) {
  const { recipe, pricing, missingIngredients, pantryIngredients, coveragePct } = suggestion;

  const totalDots = Math.min(recipe.ingredients.length, 6);
  const haveDots = Math.round((coveragePct / 100) * totalDots);
  const needDots = totalDots - haveDots;

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: pricing.hasSaleItems
          ? "1px solid #4a7c59"
          : "0.5px solid var(--color-border-tertiary)",
        borderRadius: "12px",
        marginBottom: "10px",
        overflow: "hidden",
      }}
    >
      <Link href={`/meal/${recipe.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ display: "flex", alignItems: "flex-start", padding: "12px 14px 10px", gap: "12px" }}>
          <div
            style={{
              width: 46, height: 46,
              borderRadius: 10,
              background: "var(--color-background-secondary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}
          >
            {recipe.emoji}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{recipe.title}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2, lineHeight: 1.4 }}>
              {recipe.description}
            </div>

            <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
              <Badge variant="neutral">{recipe.prepTimeMin} min</Badge>
              <Badge variant="neutral">~${pricing.totalCost.toFixed(2)}</Badge>
              {pricing.hasSaleItems && (
                <Badge variant="sale">Save ${pricing.totalSavings.toFixed(2)} today</Badge>
              )}
              {missingIngredients.length > 0 && (
                <Badge variant="missing">
                  Buy {missingIngredients.length} item{missingIngredients.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave?.(recipe.id);
            }}
            style={{
              width: 28, height: 28,
              borderRadius: "50%",
              background: "var(--color-background-secondary)",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: isSaved ? "#e91e63" : "var(--color-text-secondary)",
            }}
            aria-label={isSaved ? "Unsave meal" : "Save meal"}
          >
            {isSaved ? "♥" : "♡"}
          </button>
        </div>
      </Link>

      <div
        style={{
          display: "flex", alignItems: "center",
          padding: "8px 14px 10px",
          borderTop: "0.5px solid var(--color-border-tertiary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {Array.from({ length: haveDots }).map((_, i) => (
            <div
              key={`have-${i}`}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#4a7c59" }}
            />
          ))}
          {Array.from({ length: needDots }).map((_, i) => (
            <div
              key={`need-${i}`}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-border-secondary)" }}
            />
          ))}
          <span style={{ fontSize: 10, color: "var(--color-text-secondary)", marginLeft: 5 }}>
            {pantryIngredients.length}/{recipe.ingredients.filter(i => !i.isOptional).length} in pantry
            {missingIngredients.length === 0 ? " · nothing to buy" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "neutral" | "sale" | "missing";
}) {
  const styles: Record<string, React.CSSProperties> = {
    neutral: { background: "var(--color-background-secondary)", color: "var(--color-text-secondary)" },
    sale:    { background: "#e8f5e9", color: "#2e7d32" },
    missing: { background: "#fce4ec", color: "#c62828" },
  };
  return (
    <span
      style={{
        fontSize: 10, fontWeight: 500,
        padding: "3px 7px", borderRadius: 6,
        ...styles[variant],
      }}
    >
      {children}
    </span>
  );
}
