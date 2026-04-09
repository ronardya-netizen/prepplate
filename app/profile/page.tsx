"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getUserId } from "@/lib/user";
import Link from "next/link";


const CUISINES = ["Haitian", "French", "Italian", "Indian", "Mexican", "Asian", "Middle Eastern", "American", "African"];
const NUTRITION_GOALS = ["None", "Low calorie", "High protein"];
const GROCERY_FREQUENCIES = ["Daily", "Twice a week", "Weekly", "Bi-weekly", "Monthly"];


export default function ProfilePage() {
  const [userId, setUserId] = useState("");
  const [nutritionGoal, setNutritionGoal] = useState("None");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [budget, setBudget] = useState(300);
  const [groceryFreq, setGroceryFreq] = useState("Weekly");
  const [shareActivity, setShareActivity] = useState(true);
  const [lang, setLang] = useState("en");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);


  useEffect(() => {
    const id = getUserId();
    setUserId(id);
    const settings = JSON.parse(localStorage.getItem("prepplate-settings") ?? "{}");
    if (settings.nutritionGoal) setNutritionGoal(settings.nutritionGoal);
    if (settings.cuisines) setCuisines(settings.cuisines);
    if (settings.budget) setBudget(settings.budget);
    if (settings.groceryFreq) setGroceryFreq(settings.groceryFreq);
    if (settings.shareActivity !== undefined) setShareActivity(settings.shareActivity);
    if (settings.lang) setLang(settings.lang);
    if (settings.dietaryRestrictions) setDietaryRestrictions(settings.dietaryRestrictions);
  }, []);


  function toggleCuisine(c: string) {
    setCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }


  function toggleDietary(d: string) {
    setDietaryRestrictions((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }



  function saveSettings() {
    const settings = { nutritionGoal, cuisines, budget, groceryFreq, shareActivity, lang, dietaryRestrictions};
    localStorage.setItem("prepplate-settings", JSON.stringify(settings));
    localStorage.setItem("prepplate-lang", lang);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }


  const L = lang === "fr";


  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Image src="/logo-icon.png" alt="PrepPlate" width={36} height={36} style={{ borderRadius: 10, objectFit: "cover" }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>PrepPlate</span>
          </div>
          <Link href="/profile" style={{ textDecoration: "none" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8470d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </Link>
        </div>
        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{L ? "Profil" : "Profile"}</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>{L ? "Vos préférences" : "Your preferences"}</p>
        </div>
      </div>


      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, padding: "20px 16px 80px" }}>


        <Section label={L ? "Langue" : "Language"}>
          <div style={{ display: "flex", gap: 8 }}>
            {["en", "fr"].map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: "8px 20px", borderRadius: 20, fontSize: 13, fontWeight: 700, border: "1.5px solid", borderColor: lang === l ? "#e8470d" : "#e8d8c8", background: lang === l ? "#e8470d" : "#fff", color: lang === l ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {l === "en" ? "English" : "Français"}
              </button>
            ))}
          </div>
        </Section>



        <Section label={L ? "Objectif nutritionnel" : "Nutrition goal"}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {NUTRITION_GOALS.map((g) => (
              <button key={g} onClick={() => setNutritionGoal(g)} style={{ padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: nutritionGoal === g ? "#e8470d" : "#e8d8c8", background: nutritionGoal === g ? "#e8470d" : "#fff", color: nutritionGoal === g ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {g}
              </button>
            ))}
          </div>
        </Section>


        <Section label={L ? "Restrictions alimentaires" : "Dietary restrictions"}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Halal", "Kosher"].map((d) => (
              <button key={d} onClick={() => toggleDietary(d)} style={{ padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: dietaryRestrictions.includes(d) ? "#e8470d" : "#e8d8c8", background: dietaryRestrictions.includes(d) ? "#e8470d" : "#fff", color: dietaryRestrictions.includes(d) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {d}
              </button>
            ))}
          </div>
        </Section>


        <Section label={L ? "Cuisines préférées" : "Preferred cuisines"}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CUISINES.map((c) => (
              <button key={c} onClick={() => toggleCuisine(c)} style={{ padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: cuisines.includes(c) ? "#e8470d" : "#e8d8c8", background: cuisines.includes(c) ? "#e8470d" : "#fff", color: cuisines.includes(c) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {c}
              </button>
            ))}
          </div>
        </Section>


        <Section label={`${L ? "Budget épicerie mensuel" : "Monthly grocery budget"}: $${budget}`}>
          <input type="range" min={50} max={600} step={10} value={budget} onChange={(e) => setBudget(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#e8470d" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 4 }}>
            <span>$50</span><span>$600</span>
          </div>
        </Section>


        <Section label={L ? "Fréquence d'épicerie" : "Grocery frequency"}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {GROCERY_FREQUENCIES.map((f) => (
              <button key={f} onClick={() => setGroceryFreq(f)} style={{ padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: groceryFreq === f ? "#e8470d" : "#e8d8c8", background: groceryFreq === f ? "#e8470d" : "#fff", color: groceryFreq === f ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {f}
              </button>
            ))}
          </div>
        </Section>


        <Section label={L ? "Confidentialité" : "Privacy"}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#f5f0eb", borderRadius: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{L ? "Partager l'activité anonymement" : "Share activity anonymously"}</div>
              <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>{L ? "Aide à améliorer les suggestions" : "Helps improve meal suggestions"}</div>
            </div>
            <div onClick={() => setShareActivity(!shareActivity)} style={{ width: 44, height: 24, borderRadius: 12, background: shareActivity ? "#e8470d" : "#e8d8c8", cursor: "pointer", position: "relative", transition: "background .2s" }}>
              <div style={{ position: "absolute", top: 2, left: shareActivity ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
            </div>
          </div>
        </Section>


        <Section label={L ? "Votre identifiant" : "Your ID"}>
          <div style={{ padding: "10px 14px", background: "#f5f0eb", borderRadius: 10, fontSize: 12, color: "#c09878", fontWeight: 600, fontFamily: "monospace" }}>
            {userId}
          </div>
        </Section>


        <button onClick={saveSettings} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: saved ? "#22c55e" : "#e8470d", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", transition: "background .3s", marginTop: 8 }}>
          {saved ? (L ? "✓ Sauvegardé!" : "✓ Saved!") : (L ? "Sauvegarder" : "Save settings")}
        </button>
      </div>
    </main>
  );
}


function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}
