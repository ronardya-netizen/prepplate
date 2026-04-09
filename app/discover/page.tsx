"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import recipesData from "@/data/recipes.json";
import { getUserId } from "@/lib/user";




interface Recipe { id: string; title: string; description: string; prepTimeMin: number; calories: number; cuisine: string; emoji: string; mealType: string; mode: string[]; dietTags: string[]; ingredients: { ingredientId: string }[]; }
interface MealPost { id: string; recipeId: string; recipeTitle: string; recipeEmoji: string; caption: string; imageUrl: string; userId: string; timestamp: number; likes: number; }




const RECIPES = recipesData as Recipe[];




const CUISINE_FILTERS = [
  { id: "all", label: "All" },
  { id: "italian", label: "🍕 Italian" },
  { id: "haitian", label: "🇭🇹 Haitian" },
  { id: "french", label: "🥐 French" },
  { id: "asian", label: "🥢 Asian" },
  { id: "african", label: "🌍 African" },
  { id: "mexican", label: "🌮 Mexican" },
  { id: "indian", label: "🍛 Indian" },
  { id: "middle-eastern", label: "🧆 Middle Eastern" },
  { id: "american", label: "🍔 American" },
];




const MODE_FILTERS = [
  { id: "all", label: "All" },
  { id: "quick", label: "⚡ Quick" },
  { id: "low-cal", label: "🥗 Low cal" },
  { id: "high-protein", label: "💪 Protein" },
  { id: "healthy", label: "🌿 Healthy" },
  { id: "comfort", label: "🍝 Comfort" },
];




function timeAgo(ts: number, fr: boolean): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return fr ? "à l'instant" : "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}${fr ? "j" : "d"}`;
}




export default function DiscoverPage() {
  const [pantryIds, setPantryIds] = useState<Set<string>>(new Set());
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [cuisine, setCuisine] = useState("all");
  const [mode, setMode] = useState("all");
  const [lang, setLang] = useState("en");
  const [tab, setTab] = useState<"discover" | "friends">("discover");
  const router = useRouter();


  // Friends state
  const [posts, setPosts] = useState<MealPost[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);




  useEffect(() => {
    const id = getUserId();
    setLang(localStorage.getItem("prepplate-lang") ?? "en");
    setPinned(new Set(JSON.parse(localStorage.getItem("prepplate-pinned") ?? "[]")));
    setPosts(JSON.parse(localStorage.getItem("prepplate-posts") ?? "[]"));
    setLikedPosts(new Set(JSON.parse(localStorage.getItem("prepplate-liked") ?? "[]")));
    fetch(`/api/pantry?userId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPantryIds(new Set((data.items ?? []).map((i: { ingredientId: string }) => i.ingredientId)));
      });
  }, []);




  function togglePin(id: string) {
    const next = new Set(pinned);
    next.has(id) ? next.delete(id) : next.add(id);
    setPinned(next);
    localStorage.setItem("prepplate-pinned", JSON.stringify([...next]));
  }




  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }




  function submitPost() {
    if (!selectedRecipe || !photoPreview) return;
    setPosting(true);
    const recipe = RECIPES.find((r) => r.id === selectedRecipe);
    if (!recipe) { setPosting(false); return; }


    const newPost: MealPost = {
      id: "post-" + Date.now(),
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      recipeEmoji: recipe.emoji,
      caption,
      imageUrl: photoPreview,
      userId: getUserId(),
      timestamp: Date.now(),
      likes: 0,
    };


    const updated = [newPost, ...posts];
    setPosts(updated);
    localStorage.setItem("prepplate-posts", JSON.stringify(updated));


    // Reset
    setShowCompose(false);
    setSelectedRecipe("");
    setCaption("");
    setPhotoPreview(null);
    setPhotoFile(null);
    setPosting(false);
  }




  function toggleLike(postId: string) {
    const nextLiked = new Set(likedPosts);
    const nextPosts = posts.map((p) => {
      if (p.id === postId) {
        if (nextLiked.has(postId)) {
          nextLiked.delete(postId);
          return { ...p, likes: Math.max(0, p.likes - 1) };
        } else {
          nextLiked.add(postId);
          return { ...p, likes: p.likes + 1 };
        }
      }
      return p;
    });
    setLikedPosts(nextLiked);
    setPosts(nextPosts);
    localStorage.setItem("prepplate-posts", JSON.stringify(nextPosts));
    localStorage.setItem("prepplate-liked", JSON.stringify([...nextLiked]));
  }




  async function sharePost(post: MealPost) {
    const shareData = {
      title: `I made ${post.recipeEmoji} ${post.recipeTitle} with PrepPlate!`,
      text: post.caption || `Check out this ${post.recipeTitle} I made with PrepPlate!`,
      url: "https://prepplate.vercel.app",
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert(L ? "Lien copié!" : "Link copied!");
    }
  }




  const discoverRecipes = RECIPES.filter((r) => {
    const missing = (r.ingredients ?? []).filter((i) => !pantryIds.has(i.ingredientId)).length;
    if (missing < 1 || missing > 3) return false;
    if (cuisine !== "all" && r.cuisine !== cuisine) return false;
    if (mode !== "all" && !r.mode.includes(mode)) return false;
    return true;
  });


  const L = lang === "fr";
  const cookedRecipeIds = new Set(posts.map((p) => p.recipeId));
  const cookableRecipes = RECIPES.filter((r) => pinned.has(r.id) || cookedRecipeIds.has(r.id)).slice(0, 10);




  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>


      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Image src="/logo-icon.png" alt="PrepPlate" width={36} height={36} style={{ borderRadius: 10, objectFit: "cover" }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>PrepPlate</span>
          </div>
          <a href="/profile" style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, textDecoration: "none", cursor: "pointer" }}>👤</a>
        </div>
        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
            {tab === "discover" ? (L ? "Découvrir" : "Discover") : (L ? "Amis" : "Friends")}
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>
            {tab === "discover"
              ? (L ? `${discoverRecipes.length} recettes à 1–3 ingrédients près` : `${discoverRecipes.length} recipes within 1–3 ingredients`)
              : (L ? "Partagez vos créations culinaires" : "Share your cooking creations")}
          </p>
        </div>
      </div>


      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 0 }}>


        {/* Tab switcher */}
        <div style={{ display: "flex", borderBottom: "1px solid #f0e8de" }}>
          <button onClick={() => setTab("discover")} style={{ flex: 1, padding: "14px 0", background: "none", border: "none", borderBottom: tab === "discover" ? "3px solid #e8470d" : "3px solid transparent", fontSize: 14, fontWeight: 800, color: tab === "discover" ? "#e8470d" : "#c09878", cursor: "pointer", fontFamily: "'Nunito', sans-serif", transition: "all 0.2s ease" }}>
            {L ? "🍽️ Découvrir" : "🍽️ Discover"}
          </button>
          <button onClick={() => setTab("friends")} style={{ flex: 1, padding: "14px 0", background: "none", border: "none", borderBottom: tab === "friends" ? "3px solid #e8470d" : "3px solid transparent", fontSize: 14, fontWeight: 800, color: tab === "friends" ? "#e8470d" : "#c09878", cursor: "pointer", fontFamily: "'Nunito', sans-serif", transition: "all 0.2s ease" }}>
            {L ? "👥 Amis" : "👥 Friends"}
          </button>
        </div>


        {/* ── DISCOVER TAB ── */}
        {tab === "discover" && (
          <div style={{ paddingTop: 14 }}>
            <div style={{ padding: "0 16px 6px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
              {L ? "Cuisine" : "Cuisine"}
            </div>
            <div style={{ display: "flex", gap: 6, padding: "0 16px 10px", overflowX: "auto", scrollbarWidth: "none" as const }}>
              {CUISINE_FILTERS.map((c) => (
                <button key={c.id} onClick={() => setCuisine(c.id)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: cuisine === c.id ? "#e8470d" : "#e8d8c8", background: cuisine === c.id ? "#e8470d" : "#fff", color: cuisine === c.id ? "#fff" : "#a08060", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif" }}>
                  {c.label}
                </button>
              ))}
            </div>


            <div style={{ padding: "0 16px 6px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
              {L ? "Mode" : "Mode"}
            </div>
            <div style={{ display: "flex", gap: 6, padding: "0 16px 14px", overflowX: "auto", scrollbarWidth: "none" as const }}>
              {MODE_FILTERS.map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: mode === m.id ? "#e8470d" : "#e8d8c8", background: mode === m.id ? "#e8470d" : "#fff", color: mode === m.id ? "#fff" : "#a08060", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif" }}>
                  {m.label}
                </button>
              ))}
            </div>


            {pinned.size > 0 && (
              <div style={{ padding: "0 16px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 8 }}>
                  📌 {L ? "Épinglées" : "Pinned"}
                </div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" as const }}>
                  {RECIPES.filter((r) => pinned.has(r.id)).map((r) => (
                    <div key={r.id} onClick={() => router.push(`/meal/${r.id}`)} className="animate-item" style={{ flexShrink: 0, width: 110, padding: "10px 12px", background: "#fff8f4", border: "1.5px solid #e8470d", borderRadius: 12, cursor: "pointer" }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{r.emoji}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#3a1f0d", lineHeight: 1.2 }}>{r.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {discoverRecipes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#3a1f0d", marginBottom: 4 }}>
                    {L ? "Votre garde-manger est bien rempli!" : "Your pantry is well stocked!"}
                  </div>
                  <div style={{ fontSize: 12, color: "#c09878", fontWeight: 600 }}>
                    {L ? "Allez sur Accueil pour vos recettes disponibles." : "Head to Home to see what you can cook now."}
                  </div>
                </div>
              ) : discoverRecipes.map((recipe) => {
                const isPinned = pinned.has(recipe.id);
                const missing = (recipe.ingredients ?? []).filter((i) => !pantryIds.has(i.ingredientId)).length;
                return (
                  <div key={recipe.id} className="animate-item" style={{ background: "#fff", border: `1.5px solid ${isPinned ? "#e8470d" : "#f0e8de"}`, borderRadius: 14, overflow: "hidden" }}>
                    <div onClick={() => router.push(`/meal/${recipe.id}`)} style={{ padding: "14px 14px 10px", cursor: "pointer" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fff8f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                          {recipe.emoji}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#3a1f0d", marginBottom: 2 }}>{recipe.title}</div>
                          <div style={{ fontSize: 12, color: "#a08060", fontWeight: 600, marginBottom: 6 }}>{recipe.description}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "#c09878", background: "#f5ede6", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>⏱ {recipe.prepTimeMin} min</span>
                            <span style={{ fontSize: 11, color: "#c09878", background: "#f5ede6", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>🔥 {recipe.calories} kcal</span>
                            <span style={{ fontSize: 11, color: "#e8470d", background: "#fff0ec", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                              🛒 {missing} {L ? `manquant${missing > 1 ? "s" : ""}` : "missing"}
                            </span>
                            {recipe.dietTags.includes("vegan") && (
                              <span style={{ fontSize: 11, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>🌱 Vegan</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", borderTop: "1px solid #f0e8de" }}>
                      <button onClick={() => router.push(`/meal/${recipe.id}`)} style={{ flex: 1, padding: "10px", background: "none", border: "none", fontSize: 12, fontWeight: 800, color: "#e8470d", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                        {L ? "Voir la recette →" : "View recipe →"}
                      </button>
                      <button onClick={() => togglePin(recipe.id)} style={{ padding: "10px 16px", background: isPinned ? "#fff0ec" : "none", border: "none", borderLeft: "1px solid #f0e8de", fontSize: 12, fontWeight: 800, color: isPinned ? "#e8470d" : "#c09878", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                        {isPinned ? (L ? "📌 Épinglé" : "📌 Pinned") : (L ? "📌 Épingler" : "📌 Pin")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* ── FRIENDS TAB ── */}
        {tab === "friends" && (
          <div style={{ paddingTop: 14 }}>


            {/* New post button */}
            {!showCompose && (
              <div style={{ padding: "0 16px 16px" }}>
                <button onClick={() => setShowCompose(true)} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "2px dashed #fad8c8", background: "#fff8f4", color: "#e8470d", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  📸 {L ? "Partager ce que j'ai cuisiné" : "Share what I cooked"}
                </button>
              </div>
            )}


            {/* Compose form */}
            {showCompose && (
              <div style={{ margin: "0 16px 16px", padding: "16px", background: "#fff8f4", borderRadius: 14, border: "1.5px solid #fad8c8" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d", marginBottom: 12 }}>
                  {L ? "📸 Nouveau post" : "📸 New post"}
                </div>


                {/* Photo upload */}
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display: "none" }} />
                {!photoPreview ? (
                  <div onClick={() => fileInputRef.current?.click()} style={{ width: "100%", height: 180, borderRadius: 12, border: "2px dashed #e8d8c8", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 12 }}>
                    <span style={{ fontSize: 36, marginBottom: 6 }}>📷</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#c09878" }}>{L ? "Appuyez pour prendre ou choisir une photo" : "Tap to take or choose a photo"}</span>
                  </div>
                ) : (
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    <img src={photoPreview} alt="Preview" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 12 }} />
                    <button onClick={() => { setPhotoPreview(null); setPhotoFile(null); }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                )}


                {/* Recipe selector */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#c09878", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    {L ? "Quelle recette?" : "Which recipe?"}
                  </div>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" as const, paddingBottom: 4 }}>
                    {RECIPES.slice(0, 15).map((r) => (
                      <button key={r.id} onClick={() => setSelectedRecipe(r.id)} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1.5px solid", borderColor: selectedRecipe === r.id ? "#e8470d" : "#e8d8c8", background: selectedRecipe === r.id ? "#e8470d" : "#fff", color: selectedRecipe === r.id ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap" }}>
                        {r.emoji} {r.title}
                      </button>
                    ))}
                  </div>
                </div>


                {/* Caption */}
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={L ? "Ajoutez une légende... (optionnel)" : "Add a caption... (optional)"}
                  maxLength={200}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8d8c8", fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none", resize: "none", height: 60, fontWeight: 600 }}
                />


                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => { setShowCompose(false); setPhotoPreview(null); setSelectedRecipe(""); setCaption(""); }} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e8d8c8", background: "#fff", fontSize: 13, fontWeight: 800, color: "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                    {L ? "Annuler" : "Cancel"}
                  </button>
                  <button onClick={submitPost} disabled={!selectedRecipe || !photoPreview || posting} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: (!selectedRecipe || !photoPreview) ? "#e8d8c8" : "#e8470d", fontSize: 13, fontWeight: 800, color: "#fff", cursor: (!selectedRecipe || !photoPreview) ? "not-allowed" : "pointer", fontFamily: "'Nunito', sans-serif" }}>
                    {posting ? "..." : (L ? "Publier" : "Post")}
                  </button>
                </div>
              </div>
            )}


            {/* Feed */}
            <div style={{ padding: "0 16px" }}>
              {posts.length === 0 && !showCompose ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🍳</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#3a1f0d", marginBottom: 4 }}>
                    {L ? "Aucun post encore" : "No posts yet"}
                  </div>
                  <div style={{ fontSize: 12, color: "#c09878", fontWeight: 600 }}>
                    {L ? "Soyez le premier à partager votre création!" : "Be the first to share your creation!"}
                  </div>
                </div>
              ) : posts.map((post) => (
                <div key={post.id} className="animate-item" style={{ background: "#fff", border: "1.5px solid #f0e8de", borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
                  {/* Post header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 8px" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#3a1f0d" }}>{post.userId.slice(0, 12)}</div>
                      <div style={{ fontSize: 10, color: "#c09878", fontWeight: 600 }}>{timeAgo(post.timestamp, L)}</div>
                    </div>
                    <span style={{ fontSize: 10, background: "#fff8f4", padding: "3px 8px", borderRadius: 20, fontWeight: 700, color: "#e8470d" }}>{post.recipeEmoji} {post.recipeTitle}</span>
                  </div>


                  {/* Photo */}
                  <img src={post.imageUrl} alt={post.recipeTitle} style={{ width: "100%", height: 260, objectFit: "cover" }} />


                  {/* Caption */}
                  {post.caption && (
                    <div style={{ padding: "10px 14px 4px", fontSize: 13, fontWeight: 600, color: "#3a1f0d", lineHeight: 1.4 }}>
                      {post.caption}
                    </div>
                  )}


                  {/* Actions */}
                  <div style={{ display: "flex", padding: "8px 14px 12px", gap: 16 }}>
                    <button onClick={() => toggleLike(post.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 800, color: likedPosts.has(post.id) ? "#e8470d" : "#c09878", fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                      {likedPosts.has(post.id) ? "❤️" : "🤍"} {post.likes}
                    </button>
                    <button onClick={() => sharePost(post)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 800, color: "#c09878", fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                      📤 {L ? "Partager" : "Share"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
