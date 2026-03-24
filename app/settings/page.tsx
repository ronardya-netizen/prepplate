"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getUserId } from "@/lib/user";

const CUISINES = ["Italian", "French", "Indian", "Mexican", "Haitian", "Asian", "Middle Eastern", "American"];
const NUTRITION_GOALS = [{ id: "low-cal", label: "Low calorie", icon: "🥗" }, { id: "high-protein", label: "High protein", icon: "💪" }, { id: "balanced", label: "Balanced", icon: "⚖️" }];
const GROCERY_FREQ = ["Daily", "Twice a week", "Weekly", "Bi-weekly", "Monthly"];

export default function SettingsPage() {
  const [nutritionGoal, setNutritionGoal] = useState("balanced");
  const [cuisines, setCuisines] = useState<string[]>(["Haitian", "French"]);
  const [budget, setBudget] = useState(300);
  const [groceryFreq, setGroceryFreq] = useState("Weekly");
  const [strictPantry, setStrictPantry] = useState(true);
  const [saved, setSaved] = useState(false);

  function toggleCuisine(c: string) {
    setCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  function saveSettings() {
    const settings = { nutritionGoal, cuisines, budget, groceryFreq, strictPantry };
    localStorage.setItem("prepplate-settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  useEffect(() => {
    const s = localStorage.getItem("prepplate-settings");
    if (s) {
      const parsed = JSON.parse(s);
      setNutritionGoal(parsed.nutritionGoal ?? "balanced");
      setCuisines(parsed.cuisines ?? ["Haitian", "French"]);
      setBudget(parsed.budget ?? 300);
      setGroceryFreq(parsed.groceryFreq ?? "Weekly");
      setStrictPantry(parsed.strictPantry ?? true);
    }
  }, []);

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="P'tit Chef" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>P&apos;tit Chef</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>Eat smart. Save more. Share more.</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>Settings ⚙️</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>Personalize your experience</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        {/* Nutrition goal */}
        <Section label="Nutrition goal">
          <div style={{ display: "flex", gap: 8 }}>
            {NUTRITION_GOALS.map((g) => (
              <button key={g.id} onClick={() => setNutritionGoal(g.id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 12, border: "1.5px solid", borderColor: nutritionGoal === g.id ? "#e8470d" : "#e8d8c8", background: nutritionGoal === g.id ? "#fff0ec" : "#fff", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{g.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: nutritionGoal === g.id ? "#e8470d" : "#a08060" }}>{g.label}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* Preferred cuisines */}
        <Section label="Preferred cuisines">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CUISINES.map((c) => (
              <button key={c} onClick={() => toggleCuisine(c)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: cuisines.includes(c) ? "#e8470d" : "#e8d8c8", background: cuisines.includes(c) ? "#e8470d" : "#fff", color: cuisines.includes(c) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {c}
              </button>
            ))}
          </div>
        </Section>

        {/* Monthly budget */}
        <Section label={`Monthly grocery budget: $${budget}`}>
          <input type="range" min={50} max={600} step={10} value={budget} onChange={(e) => setBudget(parseInt(e.target.value))} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 4 }}>
            <span>$50</span><span>$600</span>
          </div>
        </Section>

        {/* Grocery frequency */}
        <Section label="Grocery frequency">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {GROCERY_FREQ.map((f) => (
              <button key={f} onClick={() => setGroceryFreq(f)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: groceryFreq === f ? "#e8470d" : "#e8d8c8", background: groceryFreq === f ? "#e8470d" : "#fff", color: groceryFreq === f ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {f}
              </button>
            ))}
          </div>
        </Section>

        {/* Pantry strictness */}
        <Section label="Meal suggestions">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => setStrictPantry(true)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${strictPantry ? "#e8470d" : "#e8d8c8"}`, background: strictPantry ? "#fff0ec" : "#fff", cursor: "pointer", textAlign: "left", fontFamily: "'Nunito', sans-serif" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${strictPantry ? "#e8470d" : "#e8d8c8"}`, background: strictPantry ? "#e8470d" : "#fff", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>Only meals I can cook now</div>
                <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>100% pantry match required</div>
              </div>
            </button>
            <button onClick={() => setStrictPantry(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${!strictPantry ? "#e8470d" : "#e8d8c8"}`, background: !strictPantry ? "#fff0ec" : "#fff", cursor: "pointer", textAlign: "left", fontFamily: "'Nunito', sans-serif" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${!strictPantry ? "#e8470d" : "#e8d8c8"}`, background: !strictPantry ? "#e8470d" : "#fff", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>Allow 1-2 missing ingredients</div>
                <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>More variety, minor shopping needed</div>
              </div>
            </button>
          </div>
        </Section>

        {/* Save button */}
        <div style={{ padding: "8px 16px 16px" }}>
          <button onClick={saveSettings} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: saved ? "#2d6a3f" : "#e8470d", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            {saved ? "✓ Saved!" : "Save settings"}
          </button>
        </div>

      </div>
    </main>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}
