"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getUserId } from "@/lib/user";

interface ImpactData {
  mealsCooked: number;
  ingredientsSaved: number;
  estimatedWasteKg: number;
  peopleFed: number;
  joinDate: string;
}

export default function ImpactPage() {
  const [impact, setImpact] = useState<ImpactData>({ mealsCooked: 0, ingredientsSaved: 0, estimatedWasteKg: 0, peopleFed: 0, joinDate: new Date().toISOString() });
  const [pantryCount, setPantryCount] = useState(0);

  useEffect(() => {
    const id = getUserId();
    const saved = localStorage.getItem("prepplate-impact");
    if (saved) setImpact(JSON.parse(saved));

    fetch(`/api/pantry?userId=${id}`)
      .then((r) => r.json())
      .then((data) => setPantryCount((data.items ?? []).length));
  }, []);

  function logMealCooked() {
    const updated = {
      ...impact,
      mealsCooked: impact.mealsCooked + 1,
      ingredientsSaved: impact.ingredientsSaved + 3,
      estimatedWasteKg: Math.round((impact.estimatedWasteKg + 0.4) * 10) / 10,
      peopleFed: Math.floor((impact.mealsCooked + 1) * 0.5),
    };
    setImpact(updated);
    localStorage.setItem("prepplate-impact", JSON.stringify(updated));
  }

  const daysSinceJoin = Math.max(1, Math.floor((Date.now() - new Date(impact.joinDate).getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: "linear-gradient(180deg, #1a3d2a 0%, #2d6a3f 60%, #3d8a52 100%)", paddingBottom: 24 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="P'tit Chef" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>P&apos;tit Chef</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>Eat smart. Save more. Share more.</div>
            </div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>M</div>
        </div>
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Your impact 🌱</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>Day {daysSinceJoin} of reducing food waste</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 20 }}>

        {/* Main stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 16px" }}>
          <StatCard value={impact.mealsCooked} label="Meals cooked" unit="" color="#e8470d" bg="#fff0ec" icon="🍳" />
          <StatCard value={impact.estimatedWasteKg} label="Food waste saved" unit="kg" color="#2d6a3f" bg="#f0faf3" icon="🌱" />
          <StatCard value={impact.ingredientsSaved} label="Ingredients used" unit="" color="#d97706" bg="#fffbeb" icon="🧺" />
          <StatCard value={impact.peopleFed} label="People fed" unit="" color="#7c3aed" bg="#f5f3ff" icon="🤝" />
        </div>

        {/* Pantry health */}
        <div style={{ margin: "0 16px 16px", padding: "14px", background: "#f0faf3", border: "1px solid #b8ddc4", borderRadius: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#2d6a3f", marginBottom: 8 }}>Pantry health</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#2d6a3f" }}>{pantryCount} ingredients</div>
              <div style={{ fontSize: 12, color: "#5a8a6a", fontWeight: 600, marginTop: 2 }}>tracked in your pantry</div>
            </div>
            <div style={{ fontSize: 36 }}>🧺</div>
          </div>
        </div>

        {/* Log a meal */}
        <div style={{ margin: "0 16px 16px", padding: "14px", background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d", marginBottom: 4 }}>Did you cook a meal today?</div>
          <div style={{ fontSize: 12, color: "#c09878", fontWeight: 600, marginBottom: 12 }}>Tap to log it and track your impact</div>
          <button onClick={logMealCooked} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "#e8470d", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            I cooked a meal!
          </button>
        </div>

        {/* Mission */}
        <div style={{ margin: "0 16px 16px", padding: "14px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#7c3aed", marginBottom: 8 }}>Our mission</div>
          <div style={{ fontSize: 13, color: "#4c1d95", fontWeight: 600, lineHeight: 1.6 }}>
            Every meal cooked with what you already have reduces food waste and helps feed someone in need. P&apos;tit Chef donates a portion of every subscription to local food banks in Montreal.
          </div>
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#ede9fe", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>
            🤝 Partner: Montreal Food Bank
          </div>
        </div>

      </div>
    </main>
  );
}

function StatCard({ value, label, unit, color, bg, icon }: { value: number; label: string; unit: string; color: string; bg: string; icon: string; }) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: "14px", border: `1px solid ${color}22` }}>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
        {unit && <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>{unit}</div>}
      </div>
      <div style={{ fontSize: 20 }}>{icon}</div>
    </div>
  );
}

