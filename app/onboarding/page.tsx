"use client";
import { useState, useEffect } from "react";
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

const CONTENT = {
  en: {
    welcome: "Welcome to PrepPlate",
    subtitle: "Smarter cooking starts here",
    features: [
      { icon: "🧺", title: "Add ingredients from your pantry" },
      { icon: "🥘", title: "Get instant meal suggestions across 10+ cuisines" },
      { icon: "❤️", title: "Support PrepPlate's mission to fight hunger" },
    ],
    cta: "Get started",
    step1of2: "Step 1 of 2",
    step2of2: "Step 2 of 2",
    cuisineTitle: "What cuisines do you love?",
    cuisineSubtitle: "We'll prioritize these in your suggestions",
    cuisineSkip: "Skip for now",
    cuisineContinue: (n: number) => `Continue with ${n} selected`,
    pantryTitle: "What do you have at home?",
    pantrySubtitle: "Tap everything you currently have. You can always update later.",
    pantrySkip: "Skip — I'll add later",
    pantryDone: (n: number) => `Done — I have ${n} items`,
    saving: "Setting up your pantry...",
  },
  fr: {
    welcome: "Bienvenue sur PrepPlate",
    subtitle: "Cuisinez plus intelligemment",
    features: [
      { icon: "🧺", title: "Ajoutez vos ingrédients du garde-manger" },
      { icon: "🥘", title: "Obtenez des suggestions instantanées pour 10+ cuisines" },
      { icon: "❤️", title: "Soutenez la mission de PrepPlate contre la faim" },
    ],
    cta: "Commencer",
    step1of2: "Étape 1 sur 2",
    step2of2: "Étape 2 sur 2",
    cuisineTitle: "Quelles cuisines aimez-vous?",
    cuisineSubtitle: "Nous prioriserons celles-ci dans vos suggestions",
    cuisineSkip: "Passer pour l'instant",
    cuisineContinue: (n: number) => `Continuer avec ${n} sélectionnée${n > 1 ? "s" : ""}`,
    pantryTitle: "Qu'avez-vous à la maison?",
    pantrySubtitle: "Appuyez sur tout ce que vous avez. Vous pouvez toujours mettre à jour plus tard.",
    pantrySkip: "Passer — j'ajouterai plus tard",
    pantryDone: (n: number) => `Terminé — j'ai ${n} article${n > 1 ? "s" : ""}`,
    saving: "Configuration de votre garde-manger...",
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const t = CONTENT[lang];

  function goToStep(next: number, dir: "forward" | "back" = "forward") {
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 250);
  }

  function toggleCuisine(c: string) { setCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]); }
  function toggleIngredient(id: string) { setSelectedIngredients((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); }

  async function finish() {
    setSaving(true);
    const userId = getUserId();
    localStorage.setItem("prepplate-settings", JSON.stringify({ cuisines, nutritionGoal: "none", budget: 300, groceryFreq: "Weekly", shareActivity: true, lang }));
    await fetch("/api/user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    for (const ingredientId of Array.from(selectedIngredients)) {
      await fetch("/api/pantry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, ingredientId, quantityLevel: "some" }) });
    }
    localStorage.setItem("prepplate-onboarded", "true");
    router.push("/home");
  }

  const btnStyle: React.CSSProperties = { width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "#e8470d", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", boxShadow: "0 4px 16px rgba(232,71,13,.35)", letterSpacing: "0.3px" };

  const slideStyle: React.CSSProperties = {
    transition: "opacity 0.25s ease, transform 0.25s ease",
    opacity: animating ? 0 : 1,
    transform: animating ? `translateX(${direction === "forward" ? "30px" : "-30px"})` : "translateX(0)",
  };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", background: "#fdf7f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif", overflow: "hidden" }}>

      {/* Step 1 — Welcome */}
      {step === 1 && (
        <div style={slideStyle}>
          <div style={{ background: "linear-gradient(160deg, #c84b0c 0%, #8B5E3C 60%, #6b3a1f 100%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 24px 36px", position: "relative" }}>
            {/* Language toggle */}
            <div style={{ position: "absolute", top: 16, right: 16, display: "flex", background: "rgba(255,255,255,.15)", borderRadius: 20, padding: 3 }}>
              <button onClick={() => setLang("en")} style={{ padding: "4px 10px", borderRadius: 16, border: "none", background: lang === "en" ? "#fff" : "transparent", color: lang === "en" ? "#e8470d" : "rgba(255,255,255,.8)", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>EN</button>
              <button onClick={() => setLang("fr")} style={{ padding: "4px 10px", borderRadius: 16, border: "none", background: lang === "fr" ? "#fff" : "transparent", color: lang === "fr" ? "#e8470d" : "rgba(255,255,255,.8)", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>FR</button>
            </div>
            <Image src="/logo.png" alt="PrepPlate" width={80} height={80} style={{ borderRadius: 20, objectFit: "cover", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,.2)" }} />
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 10px", textAlign: "center", letterSpacing: "-0.5px", textShadow: "0 2px 8px rgba(0,0,0,.2)" }}>{t.welcome}</h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.85)", fontWeight: 600, textAlign: "center", margin: 0, lineHeight: 1.5 }}>{t.subtitle}</p>
          </div>
          <div style={{ padding: "28px 20px", background: "#fdf7f2" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {t.features.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px", background: "#fff", borderRadius: 18, boxShadow: "0 2px 12px rgba(232,71,13,.08)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #fde8d8, #fad8c8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 24 }}>{item.icon}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d", lineHeight: 1.5 }}>{item.title}</div>
                </div>
              ))}
            </div>
            <button onClick={() => goToStep(2)} style={btnStyle}>{t.cta}</button>
          </div>
        </div>
      )}

      {/* Step 2 — Cuisines */}
      {step === 2 && (
        <div style={{ ...slideStyle, padding: "32px 20px 24px" }}>
          {/* Progress */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#e8470d" }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#e8d8c8" }} />
          </div>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#c09878" }}>{t.step1of2}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#3a1f0d", margin: "0 0 6px" }}>{t.cuisineTitle}</h2>
          <p style={{ fontSize: 13, color: "#c09878", fontWeight: 600, margin: "0 0 24px" }}>{t.cuisineSubtitle}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            {CUISINES.map((c) => (
              <button key={c} onClick={() => toggleCuisine(c)} style={{ padding: "9px 18px", borderRadius: 22, fontSize: 13, fontWeight: 700, border: "1.5px solid", borderColor: cuisines.includes(c) ? "#e8470d" : "#e8d8c8", background: cuisines.includes(c) ? "#e8470d" : "#fff", color: cuisines.includes(c) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {cuisines.includes(c) ? "✓ " : ""}{c}
              </button>
            ))}
          </div>
          <button onClick={() => goToStep(3)} style={btnStyle}>
            {cuisines.length === 0 ? t.cuisineSkip : t.cuisineContinue(cuisines.length)}
          </button>
        </div>
      )}

      {/* Step 3 — Pantry */}
      {step === 3 && (
        <div style={{ ...slideStyle, padding: "32px 20px 160px" }}>
          {/* Progress */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#e8470d" }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#e8470d" }} />
          </div>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#c09878" }}>{t.step2of2}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#3a1f0d", margin: "0 0 6px" }}>{t.pantryTitle}</h2>
          <p style={{ fontSize: 13, color: "#c09878", fontWeight: 600, margin: "0 0 24px" }}>{t.pantrySubtitle}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK_PANTRY.map((item) => (
              <button key={item.id} onClick={() => toggleIngredient(item.id)} style={{ padding: "9px 18px", borderRadius: 22, fontSize: 13, fontWeight: 700, border: "1.5px solid", borderColor: selectedIngredients.has(item.id) ? "#e8470d" : "#e8d8c8", background: selectedIngredients.has(item.id) ? "#e8470d" : "#fff", color: selectedIngredients.has(item.id) ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {selectedIngredients.has(item.id) ? "✓ " : ""}{item.name}
              </button>
            ))}
          </div>
          <div style={{ position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "16px 20px", background: "#fdf7f2", borderTop: "1px solid #f0e8de" }}>
            <button onClick={finish} disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.7 : 1 }}>
              {saving ? t.saving : selectedIngredients.size === 0 ? t.pantrySkip : t.pantryDone(selectedIngredients.size)}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}


