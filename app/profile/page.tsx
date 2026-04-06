"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getUserId } from "@/lib/user";
import { getLang, t, Lang } from "@/lib/i18n";

const CUISINES = ["Haitian", "French", "Italian", "Indian", "Mexican", "Asian", "Middle Eastern", "American", "African"];

const DIETARY_PREFS = {
  en: [
    { id: "vegetarian", label: "🥦 Vegetarian" },
    { id: "vegan", label: "🌱 Vegan" },
    { id: "gluten-free", label: "🌾 Gluten-free" },
  ],
  fr: [
    { id: "vegetarian", label: "🥦 Végétarien" },
    { id: "vegan", label: "🌱 Végétalien" },
    { id: "gluten-free", label: "🌾 Sans gluten" },
  ],
};

export default function ProfilePage() {
  const [nutritionGoal, setNutritionGoal] = useState("none");
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>(["Haitian", "French"]);
  const [budget, setBudget] = useState(300);
  const [groceryFreq, setGroceryFreq] = useState("Weekly");
  const [shareActivity, setShareActivity] = useState(true);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState("");
  const [lang, setLang] = useState<Lang>("en");

  const T = t[lang].profile;

  useEffect(() => {
    setUserId(getUserId());
    const s = localStorage.getItem("prepplate-settings");
    if (s) {
      const p = JSON.parse(s);
      setNutritionGoal(p.nutritionGoal ?? "none");
      setDietaryPrefs(p.dietaryPrefs ?? []);
      setCuisines(p.cuisines ?? ["Haitian", "French"]);
      setBudget(p.budget ?? 300);
      setGroceryFreq(p.groceryFreq ?? "Weekly");
      setShareActivity(p.shareActivity ?? true);
      setLang(p.lang ?? "en");
    }
  }, []);

  function toggleCuisine(c: string) { setCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]); }
  function toggleDietaryPref(id: string) { setDietaryPrefs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]); }

  function saveSettings() {
    localStorage.setItem("prepplate-settings", JSON.stringify({ nutritionGoal, dietaryPrefs, cuisines, budget, groceryFreq, shareActivity, lang }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const freqOptions = [
    { en: "Daily", fr: "Quotidien" },
    { en: "Twice a week", fr: "Deux fois/sem." },
    { en: "Weekly", fr: "Hebdomadaire" },
    { en: "Bi-weekly", fr: "Bimensuel" },
    { en: "Monthly", fr: "Mensuel" },
  ];

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>

      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Image src="/logo-icon.png" alt="PrepPlate" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>PrepPlate</div>
          </div>
          <a href="/profile" style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, textDecoration: "none", cursor: "pointer" }}>👤</a>
        </div>
        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>{T.title}</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>{T.subtitle}</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 20 }}>

        {/* Language toggle */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>Language / Langue</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["en", "fr"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "1.5px solid", borderColor: lang === l ? "#e8470d" : "#e8d8c8", background: lang === l ? "#fff0ec" : "#fff", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, color: lang === l ? "#e8470d" : "#a08060" }}>
                {l === "en" ? "🇬🇧 English" : "🇫🇷 Français"}
              </button>
            ))}
          </div>
        </div>

        {/* Nutrition goal */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>{T.nutritionGoal}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ id: "none", label: T.none }, { id: "low-cal", label: T.lowCal }, { id: "high-protein", label: T.highProtein }].map((g) => (
              <button key={g.id} onClick={() => setNutritionGoal(g.id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 12, border: "1.5px solid", borderColor: nutritionGoal === g.id ? "#e8470d" : "#e8d8c8", background: nutritionGoal === g.id ? "#fff0ec" : "#fff", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800, color: nutritionGoal === g.id ? "#e8470d" : "#a08060" }}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dietary preferences */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>
            {lang === "fr" ? "Préférences alimentaires" : "Dietary preferences"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DIETARY_PREFS[lang].map((d) => (
              <button key={d.id} onClick={() => toggleDietaryPref(d.id)} style={{ padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: dietaryPrefs.includes(d.id) ? "#2d6a3f" : "#e8d8c8", background: dietaryPrefs.includes(d.id) ? "#2d6a3f" : "#fff", color: dietaryPrefs.includes(d.id) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {d.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 8 }}>
            {lang === "fr" ? "Nous filtrerons les recettes selon vos restrictions" : "We'll filter recipes based on your restrictions"}
          </div>
        </div>

        {/* Cuisines */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>{T.cuisines}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CUISINES.map((c) => (
              <button key={c} onClick={() => toggleCuisine(c)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: cuisines.includes(c) ? "#e8470d" : "#e8d8c8", background: cuisines.includes(c) ? "#e8470d" : "#fff", color: cuisines.includes(c) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>{T.budget}: ${budget}</div>
          <input type="range" min={50} max={600} step={10} value={budget} onChange={(e) => setBudget(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#e8470d" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 4 }}><span>$50</span><span>$600</span></div>
        </div>

        {/* Grocery frequency */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>{T.frequency}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {freqOptions.map((f) => {
              const label = lang === "fr" ? f.fr : f.en;
              const isSelected = groceryFreq === f.en;
              return (
                <button key={f.en} onClick={() => setGroceryFreq(f.en)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: isSelected ? "#e8470d" : "#e8d8c8", background: isSelected ? "#e8470d" : "#fff", color: isSelected ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Privacy */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>{T.privacy}</div>
          <div onClick={() => setShareActivity(!shareActivity)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#f5f0e8", borderRadius: 12, cursor: "pointer" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{T.shareActivity}</div>
              <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>{T.shareDesc}</div>
            </div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: shareActivity ? "#e8470d" : "#e8d8c8", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: shareActivity ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>Feedback</div>
          <a href="https://forms.google.com" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#f0faf3", border: "1px solid #b8ddc4", borderRadius: 12, textDecoration: "none" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#2d6a3f" }}>{T.feedback}</div>
              <div style={{ fontSize: 11, color: "#7ab88a", fontWeight: 600, marginTop: 2 }}>{T.feedbackSub}</div>
            </div>
            <span style={{ fontSize: 18 }}>→</span>
          </a>
        </div>

        {/* User ID */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 6 }}>{T.yourId}</div>
          <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, background: "#f5f0e8", padding: "8px 12px", borderRadius: 8, wordBreak: "break-all" }}>{userId}</div>
        </div>

        {/* Save button */}
        <div style={{ padding: "8px 16px 16px" }}>
          <button onClick={saveSettings} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: saved ? "#2d6a3f" : "#e8470d", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", transition: "background 0.2s" }}>
            {saved ? `✓ ${T.saved}` : T.save}
          </button>
        </div>

      </div>
    </main>
  );
}
