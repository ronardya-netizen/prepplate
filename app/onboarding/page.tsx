"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { getUserId } from "@/lib/user";


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

    localStorage.setItem("prepplate-settings", JSON.stringify({ cuisines, nutritionGoal: "none", budget: 300, groceryFreq: "Weekly", shareActivity: true }));

    // Create user first and wait for it
    await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
    });

    // Then save pantry items one by one
    for (const ingredientId of Array.from(selectedIngredients)) {
        await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ingredientId, quantityLevel: "some" }),
        });
    }

    localStorage.setItem("prepplate-onboarded", "true");
    router.push("/home");
    }


  const btnStyle = { width: "100%", padding: "16px", borderRadius: 50, border: "none", background: "#c0440f", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", marginTop: 8 };

  // PrepPlate clover/flower icon as inline SVG
  const PrepPlateIcon = ({ size = 28, color = "white" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="13" r="9" fill={color}/>
      <circle cx="27" cy="13" r="9" fill={color}/>
      <circle cx="13" cy="27" r="9" fill={color}/>
      <circle cx="27" cy="27" r="9" fill={color}/>
    </svg>
  );

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>

      {/* Step 1 — Welcome */}
      {step === 1 && (
        <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #e8823a 0%, #f5c49a 45%, #fde9d4 100%)", display: "flex", flexDirection: "column", padding: "52px 24px 36px" }}>
          {/* Logo lockup */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 48 }}>
            <PrepPlateIcon size={28} color="white" />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>PrepPlate</span>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 42, fontWeight: 900, color: "#5c1a00", margin: "0 0 12px", lineHeight: 1.1, letterSpacing: "-1px" }}>
            Welcome to<br />PrepPlate
          </h1>
          <p style={{ fontSize: 16, color: "#7a3a10", fontWeight: 600, margin: "0 0 40px", lineHeight: 1.5 }}>
            Cook smarter, waste less,<br />and help fight hunger
          </p>

          {/* Feature cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: "auto" }}>
            {[
              {
                bg: "#e8470d",
                icon: "🍅",
                text: "Tell us what you have, add what's in your pantry",
              },
              {
                bg: "#d97c2a",
                icon: "🥗",
                text: "Get meal ideas instantly, make the most out of your ingredients",
              },
              {
                bg: "#a85c30",
                icon: "🫙",
                text: "Help reduce hunger, every subscription helps fund meals for others",
              },
            ].map((item) => (
              <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.55)", borderRadius: 50, padding: "14px 20px", backdropFilter: "blur(4px)" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#4a1f00", lineHeight: 1.35 }}>{item.text}</span>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(2)} style={{ ...btnStyle, marginTop: 40 }}>Get started</button>
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
          <div style={{ position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)", width: "480px", maxWidth: 480, padding: "16px 20px", background: "#fff", borderTop: "1px solid #f0e8de" }}>
            <button onClick={finish} disabled={saving} style={{ ...btnStyle, marginTop: 0, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Setting up your pantry..." : selectedIngredients.size === 0 ? "Skip — I'll add later" : `Done — I have ${selectedIngredients.size} items`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
