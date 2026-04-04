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

const FEATURES = [
  { icon: "🧺", title: "Add the ingredients", desc: "from your pantry" },
  { icon: "🔍", title: "Get instant meal suggestions", desc: "across 25+ cuisines" },
  { icon: "❤️", title: "Support PrepPlate's mission", desc: "to fight hunger" },
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
    await fetch("/api/user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    for (const ingredientId of Array.from(selectedIngredients)) {
      await fetch("/api/pantry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, ingredientId, quantityLevel: "some" }) });
    }
    localStorage.setItem("prepplate-onboarded", "true");
    router.push("/home");
  }

  const btnStyle: React.CSSProperties = { width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "#e8470d", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", boxShadow: "0 4px 16px rgba(232,71,13,.35)", letterSpacing: "0.3px" };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", background: "#fdf7f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>

      {step === 1 && (
        <div>
          <div style={{ background: "linear-gradient(160deg, #c84b0c 0%, #8B5E3C 60%, #6b3a1f 100%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 24px 36px" }}>
            <Image src="/logo.png" alt="PrepPlate" width={80} height={80} style={{ borderRadius: 20, objectFit: "cover", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,.2)" }} />
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 10px", textAlign: "center", letterSpacing: "-0.5px", textShadow: "0 2px 8px rgba(0,0,0,.2)" }}>Welcome to PrepPlate</h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.85)", fontWeight: 600, textAlign: "center", margin: 0, lineHeight: 1.5 }}>Smarter cooking starts here</p>
          </div>
          <div style={{ padding: "28px 20px", background: "#fdf7f2" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {FEATURES.map((item) => (
                <div key={item.desc} style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px", background: "#fff", borderRadius: 18, boxShadow: "0 2px 12px rgba(232,71,13,.08)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #fde8d8, #fad8c8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 24 }}>{item.icon}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d", lineHeight: 1.5 }}><strong>{item.title}</strong><br /><span style={{ fontWeight: 600, color: "#a08060" }}>{item.desc}</span></div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={btnStyle}>Get started</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ padding: "32px 20px 24px" }}>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#c09878" }}>Step 1 of 2</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#3a1f0d", margin: "0 0 6px" }}>What cuisines do you love?</h2>
          <p style={{ fontSize: 13, color: "#c09878", fontWeight: 600, margin: "0 0 24px" }}>We&apos;ll prioritize these in your suggestions</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            {CUISINES.map((c) => (
              <button key={c} onClick={() => toggleCuisine(c)} style={{ padding: "9px 18px", borderRadius: 22, fontSize: 13, fontWeight: 700, border: "1.5px solid", borderColor: cuisines.includes(c) ? "#e8470d" : "#e8d8c8", background: cuisines.includes(c) ? "#e8470d" : "#fff", color: cuisines.includes(c) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(3)} style={btnStyle}>
            {cuisines.length === 0 ? "Skip for now" : `Continue with ${cuisines.length} selected`}
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={{ padding: "32px 20px 160px" }}>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#c09878" }}>Step 2 of 2</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#3a1f0d", margin: "0 0 6px" }}>What do you have at home?</h2>
          <p style={{ fontSize: 13, color: "#c09878", fontWeight: 600, margin: "0 0 24px" }}>Tap everything you currently have. You can always update later.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK_PANTRY.map((item) => (
              <button key={item.id} onClick={() => toggleIngredient(item.id)} style={{ padding: "9px 18px", borderRadius: 22, fontSize: 13, fontWeight: 700, border: "1.5px solid", borderColor: selectedIngredients.has(item.id) ? "#e8470d" : "#e8d8c8", background: selectedIngredients.has(item.id) ? "#e8470d" : "#fff", color: selectedIngredients.has(item.id) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {selectedIngredients.has(item.id) ? "✓ " : ""}{item.name}
              </button>
            ))}
          </div>
          <div style={{ position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "16px 20px", background: "#fdf7f2", borderTop: "1px solid #f0e8de" }}>
            <button onClick={finish} disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Setting up your pantry..." : selectedIngredients.size === 0 ? "Skip — I'll add later" : `Done — I have ${selectedIngredients.size} items`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

