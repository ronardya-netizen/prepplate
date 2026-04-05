"use client";
import { useState } from "react";
import Image from "next/image";

const COMMUNITY_MEALS = [
  { id: "1", title: "Rice and peas", emoji: "🍚", cuisine: "Haitian", likes: 47, sharedBy: "Marie L.", timeAgo: "2h ago", note: "My grandma's recipe, so comforting!" },
  { id: "2", title: "Garlic butter pasta", emoji: "🍝", cuisine: "Italian", likes: 38, sharedBy: "Jean P.", timeAgo: "4h ago", note: "Under 20 min and the whole family loved it" },
  { id: "3", title: "Spinach feta scramble", emoji: "🥚", cuisine: "Middle Eastern", likes: 31, sharedBy: "Sophie T.", timeAgo: "6h ago", note: "Perfect high protein breakfast" },
  { id: "4", title: "Haitian rice and beans", emoji: "🍛", cuisine: "Haitian", likes: 28, sharedBy: "Marc A.", timeAgo: "1d ago", note: "Classic diri ak pwa, never disappoints" },
  { id: "5", title: "Chickpea stir-fry", emoji: "🥘", cuisine: "Asian", likes: 22, sharedBy: "Lea M.", timeAgo: "1d ago", note: "Great way to use up pantry staples" },
];

export default function DiscoverPage() {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("all");

  function toggleLike(id: string) {
    const next = new Set(liked);
    next.has(id) ? next.delete(id) : next.add(id);
    setLiked(next);
  }

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "haitian", label: "Haitian" },
    { id: "quick", label: "Quick" },
    { id: "popular", label: "Popular" },
  ];

  const filtered = filter === "all" ? COMMUNITY_MEALS : filter === "haitian" ? COMMUNITY_MEALS.filter((m) => m.cuisine === "Haitian") : filter === "popular" ? [...COMMUNITY_MEALS].sort((a, b) => b.likes - a.likes) : COMMUNITY_MEALS;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="PrepPlate" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>PrepPlate</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>Cook smarter, waste less</div>
            </div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Discover</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>Meals your community is cooking</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        {/* Community stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 16px 16px" }}>
          <div style={{ background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 12, padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#e8470d" }}>142</div>
            <div style={{ fontSize: 10, color: "#c09878", fontWeight: 700 }}>Meals shared</div>
          </div>
          <div style={{ background: "#f0faf3", border: "1px solid #b8ddc4", borderRadius: 12, padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#2d6a3f" }}>38</div>
            <div style={{ fontSize: 10, color: "#7ab88a", fontWeight: 700 }}>Members</div>
          </div>
          <div style={{ background: "#fff0ec", border: "1px solid #fad8c8", borderRadius: 12, padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#e8470d" }}>12</div>
            <div style={{ fontSize: 10, color: "#c09878", fontWeight: 700 }}>Today</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 6, padding: "0 16px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: filter === f.id ? "#e8470d" : "#e8d8c8", background: filter === f.id ? "#e8470d" : "#fff", color: filter === f.id ? "#fff" : "#a08060", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Meal feed */}
        <div style={{ padding: "0 16px" }}>
          {filtered.map((meal, idx) => (
            <div key={meal.id} style={{ padding: "12px 14px", background: "#fff", border: idx === 0 ? "1.5px solid #e8470d" : "1px solid #f0e8de", borderRadius: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "#fff8f4", border: "1px solid #fad8c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{meal.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{meal.title}</div>
                    <span style={{ fontSize: 10, color: "#c09878", fontWeight: 600, flexShrink: 0 }}>{meal.timeAgo}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>Shared by {meal.sharedBy} · {meal.cuisine}</div>
                  <div style={{ fontSize: 12, color: "#6b4c30", fontWeight: 600, marginTop: 6, lineHeight: 1.5, fontStyle: "italic" }}>"{meal.note}"</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "0.5px solid #f0e8de" }}>
                <button onClick={() => toggleLike(meal.id)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: liked.has(meal.id) ? "#e8470d" : "#c09878", fontFamily: "'Nunito', sans-serif" }}>
                  {liked.has(meal.id) ? "❤️" : "🤍"} {meal.likes + (liked.has(meal.id) ? 1 : 0)} likes
                </button>
                <button style={{ padding: "5px 12px", borderRadius: 8, border: "1.5px solid #e8d8c8", background: "#fff", color: "#e8470d", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                  Cook this
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Share CTA */}
        <div style={{ margin: "0 16px 16px", padding: "14px", background: "#f0faf3", border: "1px solid #b8ddc4", borderRadius: 14, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#2d6a3f", marginBottom: 4 }}>Cook something great?</div>
          <div style={{ fontSize: 12, color: "#7ab88a", fontWeight: 600, marginBottom: 12 }}>Share it with your community!</div>
          <button style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#2d6a3f", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Share a meal</button>
        </div>

      </div>
    </main>
  );
}

