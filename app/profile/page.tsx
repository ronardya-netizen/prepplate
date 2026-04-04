"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getUserId } from "@/lib/user";

const CUISINES = ["Haitian", "French", "Italian", "Indian", "Mexican", "Asian", "Middle Eastern", "American"];
const GROCERY_FREQ = ["Daily", "Twice a week", "Weekly", "Bi-weekly", "Monthly"];

export default function ProfilePage() {
  const [nutritionGoal, setNutritionGoal] = useState("none");
  const [cuisines, setCuisines] = useState<string[]>(["Haitian", "French"]);
  const [budget, setBudget] = useState(300);
  const [groceryFreq, setGroceryFreq] = useState("Weekly");
  const [shareActivity, setShareActivity] = useState(true);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    setUserId(getUserId());
    const s = localStorage.getItem("prepplate-settings");
    if (s) {
      const p = JSON.parse(s);
      setNutritionGoal(p.nutritionGoal ?? "none");
      setCuisines(p.cuisines ?? ["Haitian", "French"]);
      setBudget(p.budget ?? 300);
      setGroceryFreq(p.groceryFreq ?? "Weekly");
      setShareActivity(p.shareActivity ?? true);
    }
  }, []);

  function toggleCuisine(c: string) { setCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]); }

  function saveSettings() {
    localStorage.setItem("prepplate-settings", JSON.stringify({ nutritionGoal, cuisines, budget, groceryFreq, shareActivity }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Image src="/logo.png" alt="PrepPlate" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>
        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Profile</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>Your preferences</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>Nutrition goal</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ id: "none", label: "None" }, { id: "low-cal", label: "Low calorie" }, { id: "high-protein", label: "High protein" }].map((g) => (
              <button key={g.id} onClick={() => setNutritionGoal(g.id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 12, border: "1.5px solid", borderColor: nutritionGoal === g.id ? "#e8470d" : "#e8d8c8", background: nutritionGoal === g.id ? "#fff0ec" : "#fff", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800, color: nutritionGoal === g.id ? "#e8470d" : "#a08060" }}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>Preferred cuisines</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CUISINES.map((c) => (
              <button key={c} onClick={() => toggleCuisine(c)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: cuisines.includes(c) ? "#e8470d" : "#e8d8c8", background: cuisines.includes(c) ? "#e8470d" : "#fff", color: cuisines.includes(c) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>Monthly grocery budget: ${budget}</div>
          <input type="range" min={50} max={600} step={10} value={budget} onChange={(e) => setBudget(parseInt(e.target.value))} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 4 }}><span>$50</span><span>$600</span></div>
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>Grocery frequency</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {GROCERY_FREQ.map((f) => (
              <button key={f} onClick={() => setGroceryFreq(f)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: groceryFreq === f ? "#e8470d" : "#e8d8c8", background: groceryFreq === f ? "#e8470d" : "#fff", color: groceryFreq === f ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>Privacy</div>
          <div onClick={() => setShareActivity(!shareActivity)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f5f0e8", borderRadius: 12, cursor: "pointer" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>Share activity anonymously</div>
              <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>Helps improve trending meals</div>
            </div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: shareActivity ? "#e8470d" : "#e8d8c8", position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 2, left: shareActivity ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 6 }}>Your ID</div>
          <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, background: "#f5f0e8", padding: "8px 12px", borderRadius: 8, wordBreak: "break-all" }}>{userId}</div>
        </div>

        <div style={{ padding: "8px 16px 16px" }}>
          <button onClick={saveSettings} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: saved ? "#2d6a3f" : "#e8470d", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            {saved ? "Saved!" : "Save settings"}
          </button>
        </div>
      </div>
    </main>
  );
}

