"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getUserId } from "@/lib/user";


const CUISINES = ["Haitian", "French", "Italian", "Indian", "Mexican", "Asian", "Middle Eastern", "American", "African"];
const DIETS = ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Halal", "Kosher"];
const QUICK_PANTRY = [
  { id: "ing-001", name: { en: "Pasta", fr: "Pâtes" } },
  { id: "ing-002", name: { en: "Garlic", fr: "Ail" } },
  { id: "ing-003", name: { en: "Butter", fr: "Beurre" } },
  { id: "ing-004", name: { en: "Olive oil", fr: "Huile d'olive" } },
  { id: "ing-005", name: { en: "Parmesan", fr: "Parmesan" } },
  { id: "ing-006", name: { en: "Chickpeas", fr: "Pois chiches" } },
  { id: "ing-007", name: { en: "Bell pepper", fr: "Poivron" } },
  { id: "ing-008", name: { en: "Onion", fr: "Oignon" } },
  { id: "ing-011", name: { en: "Rice", fr: "Riz" } },
  { id: "ing-014", name: { en: "Eggs", fr: "Oeufs" } },
  { id: "ing-017", name: { en: "Black beans", fr: "Haricots noirs" } },
  { id: "ing-021", name: { en: "Banana", fr: "Banane" } },
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
    step1of3: "Step 1 of 3",
    step2of3: "Step 2 of 3",
    step3of3: "Step 3 of 3",
    dietTitle: "Any dietary restrictions?",
    dietSubtitle: "Select all that apply",
    cuisineTitle: "What cuisines do you love?",
    cuisineSubtitle: "We'll prioritize these in your suggestions",
    pantryTitle: "What do you have at home?",
    pantrySubtitle: "Tap everything you currently have. You can always update later.",
    skip: "Skip",
    cont: "Continue",
    pantrySkip: "Skip — I'll add later",
    pantryDone: (n: number) => `Done — I have ${n} items`,
    saving: "Setting up your pantry...",
    ready: "I'm ready!",
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
    step1of3: "Étape 1 sur 3",
    step2of3: "Étape 2 sur 3",
    step3of3: "Étape 3 sur 3",
    dietTitle: "Des restrictions alimentaires?",
    dietSubtitle: "Sélectionnez tout ce qui s'applique",
    cuisineTitle: "Quelles cuisines aimez-vous?",
    cuisineSubtitle: "Nous prioriserons celles-ci dans vos suggestions",
    pantryTitle: "Qu'avez-vous à la maison?",
    pantrySubtitle: "Appuyez sur tout ce que vous avez. Vous pouvez toujours mettre à jour plus tard.",
    skip: "Passer",
    cont: "Continuer",
    pantrySkip: "Passer — j'ajouterai plus tard",
    pantryDone: (n: number) => `Terminé — j'ai ${n} article${n > 1 ? "s" : ""}`,
    saving: "Configuration de votre garde-manger...",
    ready: "Je suis prêt!",
  },
};


export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
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


  function toggleDiet(d: string) {
    setDietaryRestrictions((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }


  function toggleCuisine(c: string) {
    setCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }


  function toggleIngredient(id: string) {
    setSelectedIngredients((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }


  async function finish() {
    setSaving(true);
    const userId = getUserId();


    localStorage.setItem("prepplate-settings", JSON.stringify({
      cuisines,
      dietaryRestrictions,
      nutritionGoal: "none",
      budget: 300,
      groceryFreq: "Weekly",
      shareActivity: true,
      lang,
    }));
    localStorage.setItem("prepplate-lang", lang);


    await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        dietPrefs: dietaryRestrictions,
        cuisines,
      }),
    });


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


  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px",
    borderRadius: 16,
    border: "none",
    background: "#e8470d",
    color: "#fff",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
    boxShadow: "0 4px 16px rgba(232,71,13,.35)",
    letterSpacing: "0.3px",
  };


  const pillStyle = (selected: boolean): React.CSSProperties => ({
    padding: "9px 18px",
    borderRadius: 22,
    fontSize: 13,
    fontWeight: 700,
    border: "1.5px solid",
    borderColor: selected ? "#e8470d" : "#e8d8c8",
    background: selected ? "#e8470d" : "#fff",
    color: selected ? "#fff" : "#a08060",
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
  });


  const slideStyle: React.CSSProperties = {
    transition: "opacity 0.25s ease, transform 0.25s ease",
    opacity: animating ? 0 : 1,
    transform: animating ? `translateX(${direction === "forward" ? "30px" : "-30px"})` : "translateX(0)",
  };


  const progressBar = (filled: number) => (
    <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
      {[1, 2, 3].map((n) => (
        <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: n <= filled ? "#e8470d" : "#e8d8c8" }} />
      ))}
    </div>
  );


  return (
    <main style={{ maxWidth: 480, margin: "0 auto", background: "#fdf7f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif", overflow: "hidden" }}>


      {/* ── Step 1: Welcome ── */}
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


      {/* ── Step 2: Dietary Restrictions ── */}
      {step === 2 && (
        <div style={{ ...slideStyle, padding: "32px 20px 24px" }}>
          {progressBar(1)}
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#c09878" }}>{t.step1of3}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#3a1f0d", margin: "0 0 6px" }}>{t.dietTitle}</h2>
          <p style={{ fontSize: 13, color: "#c09878", fontWeight: 600, margin: "0 0 24px" }}>{t.dietSubtitle}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            {DIETS.map((d) => (
              <button key={d} onClick={() => toggleDiet(d)} style={pillStyle(dietaryRestrictions.includes(d))}>
                {dietaryRestrictions.includes(d) ? "✓ " : ""}{d}
              </button>
            ))}
          </div>
          <button onClick={() => goToStep(3)} style={btnStyle}>
            {dietaryRestrictions.length === 0 ? t.skip : t.cont}
          </button>
        </div>
      )}


      {/* ── Step 3: Cuisines ── */}
      {step === 3 && (
        <div style={{ ...slideStyle, padding: "32px 20px 24px" }}>
          {progressBar(2)}
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#c09878" }}>{t.step2of3}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#3a1f0d", margin: "0 0 6px" }}>{t.cuisineTitle}</h2>
          <p style={{ fontSize: 13, color: "#c09878", fontWeight: 600, margin: "0 0 24px" }}>{t.cuisineSubtitle}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            {CUISINES.map((c) => (
              <button key={c} onClick={() => toggleCuisine(c)} style={pillStyle(cuisines.includes(c))}>
                {cuisines.includes(c) ? "✓ " : ""}{c}
              </button>
            ))}
          </div>
          <button onClick={() => goToStep(4)} style={btnStyle}>
            {cuisines.length === 0 ? t.skip : t.cont}
          </button>
        </div>
      )}


      {/* ── Step 4: Pantry ── */}
      {step === 4 && (
        <div style={{ ...slideStyle, padding: "32px 20px 160px" }}>
          {progressBar(3)}
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#c09878" }}>{t.step3of3}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#3a1f0d", margin: "0 0 6px" }}>{t.pantryTitle}</h2>
          <p style={{ fontSize: 13, color: "#c09878", fontWeight: 600, margin: "0 0 24px" }}>{t.pantrySubtitle}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK_PANTRY.map((item) => (
              <button key={item.id} onClick={() => toggleIngredient(item.id)} style={pillStyle(selectedIngredients.has(item.id))}>
                {selectedIngredients.has(item.id) ? "✓ " : ""}{item.name[lang]}
              </button>
            ))}
          </div>
          <div style={{ position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "16px 20px", background: "#fdf7f2", borderTop: "1px solid #f0e8de" }}>
            <button onClick={finish} disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.7 : 1 }}>
              {saving ? t.saving : selectedIngredients.size === 0 ? t.pantrySkip : t.ready}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
