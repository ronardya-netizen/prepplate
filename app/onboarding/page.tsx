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


/* ── SVG icon components ── */
function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.25)" />
      <path d="M10 8 L16 14 L22 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 14 L16 24" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M11 18 Q16 22 21 18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function PantryIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="16" r="8" fill="#e8470d" opacity="0.15" />
      <path d="M10 12 Q14 8 18 12" stroke="#e8470d" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="13" r="1.5" fill="#4a8c3f" />
      <path d="M14 11 L14 8" stroke="#4a8c3f" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 9 Q14 7 16 9" stroke="#4a8c3f" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <ellipse cx="14" cy="18" rx="6" ry="4" fill="#e8470d" opacity="0.9" />
      <ellipse cx="14" cy="17" rx="6" ry="4" fill="#f06830" />
      <path d="M11 17 Q14 15 17 17" stroke="#fff" strokeWidth="0.8" opacity="0.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function MealIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M8 20 Q14 24 20 20" stroke="#e8470d" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="14" cy="16" rx="8" ry="5" fill="#e8470d" opacity="0.12" />
      <ellipse cx="11" cy="14" rx="2.5" ry="3" fill="#4a8c3f" opacity="0.8" />
      <ellipse cx="17" cy="14" rx="2.5" ry="3" fill="#f06830" opacity="0.8" />
      <path d="M13 11 L15 11" stroke="#e8470d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 8 L14 11" stroke="#4a8c3f" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 9 L14 8 L16 9" stroke="#4a8c3f" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function HungerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="8" y="10" width="12" height="12" rx="3" fill="#e8470d" opacity="0.85" />
      <rect x="8" y="10" width="12" height="3" rx="1.5" fill="#c83a08" />
      <circle cx="12" cy="17" r="1" fill="#fff" opacity="0.6" />
      <circle cx="16" cy="17" r="1" fill="#fff" opacity="0.6" />
      <path d="M10 10 L10 8 Q14 6 18 8 L18 10" stroke="#e8470d" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <line x1="14" y1="6" x2="14" y2="4" stroke="#e8470d" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function HomeTabIcon({ active }: { active?: boolean }) {
  const color = active ? "#e8470d" : "#b0a090";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z" fill={active ? color : "none"} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <rect x="9" y="14" width="6" height="7" rx="1" fill={active ? "#fff" : "none"} stroke={active ? "#fff" : color} strokeWidth="1.5" />
    </svg>
  );
}

function PantryTabIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b0a090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="3" x2="12" y2="8" />
    </svg>
  );
}

function PlanTabIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b0a090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="4" x2="9" y2="9" />
      <line x1="15" y1="4" x2="15" y2="9" />
    </svg>
  );
}

function ProfileTabIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b0a090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21C4 16.58 7.58 13 12 13C16.42 13 20 16.58 20 21" />
    </svg>
  );
}


const FEATURES = [
  { icon: <PantryIcon />, desc: "Tell us what you have, add what's in your pantry" },
  { icon: <MealIcon />, desc: "Get meal ideas instantly, make the most out of your ingredients" },
  { icon: <HungerIcon />, desc: "Help reduce hunger, every subscription helps fund meals for others" },
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


  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "18px",
    borderRadius: 50,
    border: "none",
    background: "#e8470d",
    color: "#fff",
    fontSize: 18,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
    boxShadow: "0 6px 24px rgba(232,71,13,.3)",
    letterSpacing: "0.3px",
  };


  return (
    <main style={{ maxWidth: 480, margin: "0 auto", background: "#fdf7f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif", position: "relative", paddingBottom: 72 }}>


      {/* Step 1 — Welcome */}
      {step === 1 && (
        <div>
          {/* Hero section with warm gradient */}
          <div style={{
            background: "linear-gradient(170deg, #e8750d 0%, #f0a050 40%, #f5c48a 75%, #fdf7f2 100%)",
            padding: "48px 24px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}>
            {/* Top-left brand mark */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
              <LogoIcon size={32} />
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "0.2px" }}>PrepPlate</span>
            </div>

            {/* Welcome heading — left-aligned, large */}
            <h1 style={{
              fontSize: 38,
              fontWeight: 900,
              color: "#3a1f0d",
              margin: "0 0 12px",
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
            }}>
              Welcome to<br />PrepPlate
            </h1>
            <p style={{
              fontSize: 15,
              color: "#5a3a20",
              fontWeight: 600,
              margin: 0,
              lineHeight: 1.5,
              opacity: 0.85,
            }}>
              Cook smarter, waste less,<br />and help fight hunger
            </p>
          </div>


          {/* Feature pills */}
          <div style={{ padding: "24px 20px 20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {FEATURES.map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, #fce8da 0%, #f8d4bc 100%)",
                  borderRadius: 50,
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(200,120,60,0.12)",
                  }}>
                    {item.icon}
                  </div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#3a1f0d",
                    lineHeight: 1.45,
                  }}>
                    {item.desc}
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


      {/* Step 3 — Initial pantry */}
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
          <div style={{ position: "fixed", bottom: 72, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "16px 20px", background: "#fdf7f2", borderTop: "1px solid #f0e8de" }}>
            <button onClick={finish} disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Setting up your pantry..." : selectedIngredients.size === 0 ? "Skip — I'll add later" : `Done — I have ${selectedIngredients.size} items`}
            </button>
          </div>
        </div>
      )}


      {/* Bottom tab bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "10px 0 20px",
        background: "#fdf7f2",
        borderTop: "1px solid #f0e8de",
      }}>
        {[
          { label: "Home", icon: <HomeTabIcon active />, active: true },
          { label: "Pantry", icon: <PantryTabIcon /> },
          { label: "Plan", icon: <PlanTabIcon /> },
          { label: "Profile", icon: <ProfileTabIcon /> },
        ].map((tab) => (
          <div key={tab.label} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            cursor: "pointer",
          }}>
            {tab.icon}
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: tab.active ? "#e8470d" : "#b0a090",
            }}>
              {tab.label}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
