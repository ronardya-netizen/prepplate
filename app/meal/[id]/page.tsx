"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import recipesData from "@/data/recipes.json";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";

interface Step { id: number; title: string; instruction: string; timerSeconds?: number; }
interface Recipe { id: string; title: string; description: string; prepTimeMin: number; cuisine: string; emoji: string; calories: number; mealType: string; dietTags: string[]; ingredients: { ingredientId: string; quantity: number; unit: string; isOptional?: boolean }[]; steps: Step[]; }
interface IngredientData { id: string; name: string; category: string; unit: string; }

export default function MealPage() {
  const { id } = useParams();
  const router = useRouter();
  const [pantryIds, setPantryIds] = useState<Set<string>>(new Set());

  const recipe = (recipesData as Recipe[]).find((r) => r.id === id);
  const ingredients = ingredientsData as IngredientData[];

  useEffect(() => {
    const userId = getUserId();
    fetch(`/api/pantry?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => setPantryIds(new Set((data.items ?? []).map((i: { ingredientId: string }) => i.ingredientId))));
  }, []);

  if (!recipe) return <div style={{ padding: 20, fontFamily: "'Nunito', sans-serif" }}>Recipe not found</div>;

  const required = recipe.ingredients.filter((i) => !i.isOptional);
  const have = required.filter((i) => pantryIds.has(i.ingredientId));
  const missing = required.filter((i) => !pantryIds.has(i.ingredientId));
  const coveragePct = Math.round((have.length / required.length) * 100);

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 100px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 60%, #a0724a 100%)", paddingBottom: 24 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image src="/logo.png" alt="P'tit Chef" width={32} height={32} style={{ borderRadius: 8, objectFit: "cover" }} />
          </div>
        </div>
        <div style={{ padding: "8px 20px 0", textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>{recipe.emoji}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>{recipe.title}</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.8)", fontWeight: 600, margin: "0 0 12px" }}>{recipe.description}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,.2)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>⏱ {recipe.prepTimeMin} min</span>
            <span style={{ background: "rgba(255,255,255,.2)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>🔥 {recipe.calories} kcal</span>
            <span style={{ background: "rgba(255,255,255,.2)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>🌍 {recipe.cuisine}</span>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 20 }}>

        {/* Coverage bar */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#c09878" }}>Pantry coverage</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: coveragePct === 100 ? "#2d6a3f" : "#e8470d" }}>{coveragePct}%</span>
          </div>
          <div style={{ height: 8, background: "#f0e8de", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${coveragePct}%`, background: coveragePct === 100 ? "#2d6a3f" : "#e8470d", borderRadius: 4 }} />
          </div>
        </div>

        {/* Ingredients */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>Ingredients</div>
          {have.map((ing) => {
            const info = ingredients.find((i) => i.id === ing.ingredientId);
            return (
              <div key={ing.ingredientId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #f0e8de" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#e8f5ec", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: "#2d6a3f", fontWeight: 800 }}>✓</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d", flex: 1 }}>{info?.name ?? ing.ingredientId}</span>
                <span style={{ fontSize: 12, color: "#c09878", fontWeight: 600 }}>{ing.quantity} {ing.unit}</span>
              </div>
            );
          })}
          {missing.map((ing) => {
            const info = ingredients.find((i) => i.id === ing.ingredientId);
            return (
              <div key={ing.ingredientId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #f0e8de", opacity: 0.5 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#fff0ec", border: "1.5px dashed #e8470d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: "#e8470d", fontWeight: 800 }}>✗</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d", flex: 1 }}>{info?.name ?? ing.ingredientId}</span>
                <span style={{ fontSize: 12, color: "#e8470d", fontWeight: 600 }}>missing</span>
              </div>
            );
          })}
        </div>

        {/* Steps preview */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>Steps ({recipe.steps.length})</div>
          {recipe.steps.map((step) => (
            <div key={step.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #f0e8de" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#c09878", flexShrink: 0, marginTop: 1 }}>{step.id}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{step.title}</div>
                <div style={{ fontSize: 12, color: "#c09878", fontWeight: 600, marginTop: 2 }}>{step.instruction}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start cooking button */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "16px 20px 24px", background: "#fff", borderTop: "1px solid #f0e8de" }}>
        <button onClick={() => router.push(`/meal/${recipe.id}/cook`)} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "#e8470d", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
          Start Cooking →
        </button>
      </div>
    </main>
  );
}

