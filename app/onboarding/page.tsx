"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";

interface IngredientData { id: string; name: string; category: string; }
const INGREDIENTS = ingredientsData as IngredientData[];

const CUISINES = ["Haitian", "French", "Italian", "Indian", "Mexican", "Asian", "American"];
const QUICK_PANTRY = [
  { id: "ing-001", name: "Pasta" }, { id: "ing-002", name: "Garlic" },
  { id: "ing-003", name: "Butter" }, { id: "ing-004", name: "Olive oil" },
  { id: "ing-005", name: "Parmesan" }, { id: "ing-006", name: "Chickpeas" },
  { id: "ing-007", name: "Bell pepper" }, { id: "ing-008", name: "Onion" },
  { id: "ing-011", name: "Rice" }, { id: "ing-014", name: "Eggs" },
  { id: "ing-017", name: "Black beans" }, { id: "ing-021", name: "Banana" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggleCuisine(c: string) { setCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]); }
  function toggleIngredient(id: string) { setSelectedIngredients((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); }

  async function finish() {
    setSaving(true);
    const userId = getUserId();

    // Save preferences
    localStorage.setItem("prepplate-settings", JSON.stringify({ cuisines, nutritionGoal: "none", budget: 300, groceryFreq: "Weekly", shareActivity: true }));

    // Create user and add pantry items
    await fetch("/api/user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    await Promise.all(Array.from(selectedIngredients).map((ingredientId) =>
      fetch("/api/pantry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, ingredientId, quantityLevel: 1 }) })
    ));

    localStorage.setItem("prepplate-onboarded", "true");
    router.push("/home");
  }

  const btnStyle = { width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#e8470d", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", marginTop: 8 };
  const H = { background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 100%)", paddingBottom: 24 };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>

      {/* Step 1 — Welcome */}
      {step === 1 && (
        <div>
          <div style={{ ...H, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px 32px" }}>
            <Image src="/logo.png" alt="P'tit Chef" width={80} height={80} style={{ borderRadius: 20, objectFit: "cover", marginBottom: 20 }} />
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 8px", textAlign: "center" }}>Welcome to P&apos;tit Chef</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.8)", fontWeight: 600, textAlign: "center", margin: 0 }}>Open app. Know what to cook. Reduce food waste.</p>
          </div>
          <div style={{ padding: "24px 20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                { icon: "🧺", title: "Tell us what you have", desc: "Add ingredients from your pantry" },
                { icon: "🍳", title: "Get instant suggestions", desc: "3 meals you can cook right now" },
                { icon: "🌱", title: "Reduce food waste", desc: "Use expiring items first, always" },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 14px", background: "#fff8f4", borderRadius: 12, border: "1px solid #fad8c8" }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "#c09878", fontWeight: 600, marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={btnStyle}>Get started</button>
          </div>
        </div>
      )}

      {/* Step 2 — Cuisine preferences */}
      {step === 2 && (
        <div style={{ padding: "32px 20px 24px" }}>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#c09878" }}>Step 1 of 2</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#3a1f0d", margin: "0 0 6px" }}>What cuisines do you love?</h2>
          <p style={{ fontSize: 13, color: "#c09878", fontWeight: 600, margin: "0 0 20px" }}>We'll prioritize these in your suggestions</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {CUISINES.map((c) => (
              <button key={c} onClick={() => toggleCuisine(c)} style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, border: "1.5px solid", borderColor: cuisines.includes(c) ? "#e8470d" : "#e8d8c8", background: cuisines.includes(c) ? "#e8470d" : "#fff", color: cuisines.includes(c) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(3)} style={btnStyle}>
            {cuisines.length === 0 ? "Skip for now" : `Continue with ${cuisines.length} selected`}
          </button>
        </div>
      )}

      {/* Step 3 — Initial pantry */}
      {step === 3 && (
        <div style={{ padding: "32px 20px 100px" }}>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#c09878" }}>Step 2 of 2</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#3a1f0d", margin: "0 0 6px" }}>What do you have at home?</h2>
          <p style={{ fontSize: 13, color: "#c09878", fontWeight: 600, margin: "0 0 20px" }}>Tap everything you currently have. You can always update later.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {QUICK_PANTRY.map((item) => (
              <button key={item.id} onClick={() => toggleIngredient(item.id)} style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, border: "1.5px solid", borderColor: selectedIngredients.has(item.id) ? "#e8470d" : "#e8d8c8", background: selectedIngredients.has(item.id) ? "#e8470d" : "#fff", color: selectedIngredients.has(item.id) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {selectedIngredients.has(item.id) ? "✓ " : ""}{item.name}
              </button>
            ))}
          </div>
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "16px 20px", background: "#fff", borderTop: "1px solid #f0e8de" }}>
            <button onClick={finish} disabled={saving} style={{ ...btnStyle, marginTop: 0, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Setting up your pantry..." : selectedIngredients.size === 0 ? "Skip — I'll add later" : `Done — I have ${selectedIngredients.size} items`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
