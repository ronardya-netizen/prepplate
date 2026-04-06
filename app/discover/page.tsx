"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import recipesData from "@/data/recipes.json";
import { getLang } from "@/lib/i18n";

interface Recipe { id: string; title: string; emoji: string; cuisine: string; }

const DEFAULT_FEED = [
  { id: "1", recipeId: "rec-007", title: "Rice and peas", emoji: "🍚", bg: "linear-gradient(135deg, #f59e0b, #d97706)", sharedBy: "Marie L.", avatar: "M", likes: 47, timeAgo: "2h ago" },
  { id: "2", recipeId: "rec-001", title: "Garlic butter pasta", emoji: "🍝", bg: "linear-gradient(135deg, #e8470d, #c84b0c)", sharedBy: "Jean P.", avatar: "J", likes: 38, timeAgo: "4h ago" },
  { id: "3", recipeId: "rec-004", title: "Spinach feta scramble", emoji: "🥚", bg: "linear-gradient(135deg, #2d6a3f, #1a3d2a)", sharedBy: "Sophie T.", avatar: "S", likes: 31, timeAgo: "6h ago" },
  { id: "4", recipeId: "rec-010", title: "Haitian rice and beans", emoji: "🍛", bg: "linear-gradient(135deg, #7c3aed, #5b21b6)", sharedBy: "Marc A.", avatar: "M", likes: 28, timeAgo: "1d ago" },
];

const BG_COLORS = [
  "linear-gradient(135deg, #e8470d, #c84b0c)",
  "linear-gradient(135deg, #2d6a3f, #1a3d2a)",
  "linear-gradient(135deg, #0891b2, #0e7490)",
  "linear-gradient(135deg, #7c3aed, #5b21b6)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
];

const T = {
  en: { title: "Discover", subtitle: "#letmecook — see what your community is making", share: "+ Share", shareTitle: "Share to #letmecook", whatCook: "What did you cook?", selectRecipe: "Select a recipe...", hashtagNote: "will be added automatically", cancel: "Cancel", post: "Post", posted: "Posted to #letmecook!", postedSub: "Your meal is now on the feed", savePlan: "Save to Plan", saved: "✓ Saved · Unsave", yourPost: "Your post" },
  fr: { title: "Découvrir", subtitle: "#letmecook — voyez ce que votre communauté cuisine", share: "+ Partager", shareTitle: "Partager sur #letmecook", whatCook: "Qu'avez-vous cuisiné?", selectRecipe: "Choisir une recette...", hashtagNote: "sera ajouté automatiquement", cancel: "Annuler", post: "Publier", posted: "Publié sur #letmecook!", postedSub: "Votre repas est maintenant sur le fil", savePlan: "Sauvegarder", saved: "✓ Sauvegardé · Retirer", yourPost: "Votre publication" },
};

export default function DiscoverPage() {
  const [feed, setFeed] = useState(DEFAULT_FEED);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [showShare, setShowShare] = useState(false);
  const [shareRecipeId, setShareRecipeId] = useState("");
  const [shared, setShared] = useState(false);
  const [lang, setLang] = useState<"en" | "fr">("en");

  const recipes = recipesData as Recipe[];
  const tx = T[lang];

  useEffect(() => {
    setLang(getLang());
    const savedFeed = localStorage.getItem("discover-feed");
    if (savedFeed) setFeed([...JSON.parse(savedFeed), ...DEFAULT_FEED]);
    const savedPlan = localStorage.getItem("plan-meals");
    if (savedPlan) {
      const planMeals = JSON.parse(savedPlan);
      const savedIds = new Set<string>(DEFAULT_FEED.filter(p => planMeals.includes(p.recipeId)).map(p => p.id));
      setSaved(savedIds);
    }
  }, []);

  function toggleLike(id: string) {
    const next = new Set(liked);
    next.has(id) ? next.delete(id) : next.add(id);
    setLiked(next);
  }

  function saveToPlan(recipeId: string, postId: string) {
    const next = new Set(saved);
    const existing = JSON.parse(localStorage.getItem("plan-meals") ?? "[]");
    if (next.has(postId)) {
      next.delete(postId);
      localStorage.setItem("plan-meals", JSON.stringify(existing.filter((id: string) => id !== recipeId)));
    } else {
      next.add(postId);
      if (!existing.includes(recipeId)) localStorage.setItem("plan-meals", JSON.stringify([...existing, recipeId]));
    }
    setSaved(next);
  }

  function submitShare() {
    if (!shareRecipeId) return;
    const recipe = recipes.find((r) => r.id === shareRecipeId);
    if (!recipe) return;
    const newPost = { id: `user-${Date.now()}`, recipeId: recipe.id, title: recipe.title, emoji: recipe.emoji, bg: BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)], sharedBy: "You", avatar: "Y", likes: 0, timeAgo: "Just now" };
    const updatedFeed = [newPost, ...feed];
    setFeed(updatedFeed);
    localStorage.setItem("discover-feed", JSON.stringify(updatedFeed.filter(p => p.sharedBy === "You")));
    setShared(true);
    setTimeout(() => { setShowShare(false); setShared(false); setShareRecipeId(""); }, 2000);
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Image src="/logo-icon.png" alt="PrepPlate" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>PrepPlate</div>
          </div>
          <button onClick={() => setShowShare(true)} style={{ padding: "7px 14px", borderRadius: 20, border: "1.5px solid rgba(255,255,255,.6)", background: "transparent", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            {tx.share}
          </button>
        </div>
        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>{tx.title}</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>{tx.subtitle}</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        {showShare && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 480 }}>
              {shared ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#2d6a3f" }}>{tx.posted}</div>
                  <div style={{ fontSize: 13, color: "#7ab88a", fontWeight: 600, marginTop: 6 }}>{tx.postedSub}</div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#3a1f0d" }}>{tx.shareTitle}</div>
                    <button onClick={() => setShowShare(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#c09878" }}>×</button>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#c09878", marginBottom: 6 }}>{tx.whatCook}</div>
                    <select value={shareRecipeId} onChange={(e) => setShareRecipeId(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e8d8c8", fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none", background: "#fff" }}>
                      <option value="">{tx.selectRecipe}</option>
                      {recipes.map((r) => (<option key={r.id} value={r.id}>{r.emoji} {r.title}</option>))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 14, padding: "10px 12px", background: "#fff8f4", borderRadius: 10, border: "1px solid #fad8c8" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#e8470d" }}>#letmecook</span>
                    <span style={{ fontSize: 12, color: "#c09878", fontWeight: 600 }}> {tx.hashtagNote}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowShare(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #e8d8c8", background: "#fff", color: "#a08060", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>{tx.cancel}</button>
                    <button onClick={submitShare} disabled={!shareRecipeId} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: shareRecipeId ? "#e8470d" : "#e8d8c8", color: "#fff", fontSize: 13, fontWeight: 800, cursor: shareRecipeId ? "pointer" : "not-allowed", fontFamily: "'Nunito', sans-serif" }}>{tx.post}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div style={{ padding: "0 16px" }}>
          {feed.map((post) => (
            <div key={post.id} style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden", border: "1px solid #f0e8de" }}>
              <div style={{ height: 200, background: post.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span style={{ fontSize: 80 }}>{post.emoji}</span>
                <div style={{ position: "absolute", bottom: 10, left: 12, background: "rgba(0,0,0,.4)", borderRadius: 20, padding: "3px 10px" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>#letmecook</span>
                </div>
                {post.sharedBy === "You" && (
                  <div style={{ position: "absolute", top: 10, right: 12, background: "#e8470d", borderRadius: 20, padding: "3px 10px" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{tx.yourPost}</span>
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d", flexShrink: 0 }}>{post.avatar}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{post.sharedBy}</div>
                    <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>{post.timeAgo}</div>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#3a1f0d", marginBottom: 10 }}>{post.title}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button onClick={() => toggleLike(post.id)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: liked.has(post.id) ? "#e8470d" : "#c09878", fontFamily: "'Nunito', sans-serif" }}>
                    {liked.has(post.id) ? "❤️" : "🤍"} {post.likes + (liked.has(post.id) ? 1 : 0)}
                  </button>
                  <button onClick={() => saveToPlan(post.recipeId, post.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: saved.has(post.id) ? "#2d6a3f" : "#e8470d", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                    {saved.has(post.id) ? tx.saved : tx.savePlan}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

