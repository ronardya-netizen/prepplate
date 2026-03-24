"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getUserId } from "@/lib/user";

interface TrendingRecipe { id: string; title: string; description: string; prepTimeMin: number; cuisine: string; emoji: string; calories: number; bookmarks: number; }

export default function TrendingPage() {
  const [trending, setTrending] = useState<TrendingRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("bookmarked-meals");
    if (saved) setBookmarked(new Set(JSON.parse(saved)));
    fetch("/api/trending")
      .then((r) => r.json())
      .then((data) => { setTrending(data.trending ?? []); setLoading(false); });
  }, []);

  function toggleBookmark(id: string) {
    const next = new Set(bookmarked);
    next.has(id) ? next.delete(id) : next.add(id);
    setBookmarked(next);
    localStorage.setItem("bookmarked-meals", JSON.stringify([...next]));
  }

  const CUISINE_FLAG: Record<string, string> = { italian: "🍕", french: "🥐", indian: "🍛", mexican: "🌮", haitian: "🇭🇹", asian: "🥢", "middle-eastern": "🧆", american: "🍔" };

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
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>Trending 🔥</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>Most popular meals this week</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>
        {loading ? (
          <p style={{ padding: "30px 20px", color: "#c09878", fontWeight: 700 }}>Loading trending meals...</p>
        ) : (
          <div style={{ padding: "0 16px" }}>
            {trending.map((meal, idx) => (
              <div key={meal.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fff", border: idx === 0 ? "1.5px solid #e8470d" : "1px solid #f0e8de", borderRadius: 14, marginBottom: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: idx === 0 ? "#e8470d" : "#c09878", minWidth: 24, textAlign: "center" }}>#{idx + 1}</div>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fff8f4", border: "1px solid #fad8c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{meal.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{meal.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#a08060", background: "#f5f0e8", padding: "2px 7px", borderRadius: 6 }}>⏱ {meal.prepTimeMin} min</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#a08060", background: "#f5f0e8", padding: "2px 7px", borderRadius: 6 }}>🔥 {meal.calories} kcal</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#a08060", background: "#f5f0e8", padding: "2px 7px", borderRadius: 6 }}>{CUISINE_FLAG[meal.cuisine] ?? "🌍"} {meal.cuisine}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#2d6a3f", fontWeight: 700, marginTop: 3 }}>🔖 {meal.bookmarks} saves this week</div>
                </div>
                <button onClick={() => toggleBookmark(meal.id)} style={{ width: 32, height: 32, borderRadius: "50%", background: bookmarked.has(meal.id) ? "#fde8d8" : "#f5f0e8", border: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: bookmarked.has(meal.id) ? "#e8470d" : "#d0c0b0", flexShrink: 0 }}>
                  {bookmarked.has(meal.id) ? "🔖" : "🏷️"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}