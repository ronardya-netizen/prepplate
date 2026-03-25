"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";

interface IngredientData { id: string; name: string; category: string; unit: string; basePrice: number; }
interface PantryItem { ingredientId: string; expiryDays?: number; }

const INGREDIENTS = ingredientsData as IngredientData[];

export default function PantryPage() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const id = getUserId();
    setUserId(id);
    fetch(`/api/pantry?userId=${id}`)
      .then((r) => r.json())
      .then((data) => { setPantryItems(data.items ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function addIngredient(ingredientId: string) {
    const res = await fetch("/api/pantry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, ingredientId, quantityLevel: 1 }) });
    if (res.ok) { setPantryItems((prev) => [...prev, { ingredientId }]); setSearch(""); setShowAdd(false); }
  }

  async function removeIngredient(ingredientId: string) {
    await fetch(`/api/pantry?userId=${userId}&ingredientId=${ingredientId}`, { method: "DELETE" });
    setPantryItems((prev) => prev.filter((i) => i.ingredientId !== ingredientId));
  }

  const pantryIds = new Set(pantryItems.map((i) => i.ingredientId));
  const redItems = pantryItems.filter((i) => i.expiryDays !== undefined && i.expiryDays <= 2);
  const yellowItems = pantryItems.filter((i) => i.expiryDays !== undefined && i.expiryDays > 2 && i.expiryDays <= 7);
  const greenItems = pantryItems.filter((i) => !i.expiryDays || i.expiryDays > 7);
  const filteredIngredients = INGREDIENTS.filter((i) => !pantryIds.has(i.id) && i.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8);

  function getName(id: string) { return INGREDIENTS.find((i) => i.id === id)?.name ?? id; }

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
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>My Pantry</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>{pantryItems.length} ingredient{pantryItems.length !== 1 ? "s" : ""} tracked</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        {/* Camera scan button */}
        <div style={{ padding: "0 16px 12px", display: "flex", gap: 8 }}>
          <button style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e8d8c8", background: "#fff8f4", color: "#c09878", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            Scan groceries (v2)
          </button>
          <button onClick={() => setShowAdd(!showAdd)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e8470d", background: showAdd ? "#e8470d" : "#fff", color: showAdd ? "#fff" : "#e8470d", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            + Add item
          </button>
        </div>

        {/* Search dropdown */}
        {showAdd && (
          <div style={{ padding: "0 16px 16px", position: "relative", zIndex: 50 }}>
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ingredients..." style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8470d", fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box" }} />
            {filteredIngredients.length > 0 && (
              <div style={{ position: "absolute", left: 16, right: 16, background: "#fff", borderRadius: 10, border: "1px solid #f0e8de", boxShadow: "0 4px 20px rgba(0,0,0,.1)", zIndex: 100, overflow: "hidden" }}>
                {filteredIngredients.map((ing) => (
                  <div key={ing.id} onMouseDown={() => addIngredient(ing.id)} style={{ padding: "12px 14px", cursor: "pointer", borderBottom: "0.5px solid #f0e8de", fontSize: 13, fontWeight: 700, color: "#3a1f0d", background: "#fff" }}>
                    {ing.name} <span style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>({ing.category})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p style={{ padding: "20px", color: "#c09878", fontWeight: 700 }}>Loading pantry...</p>
        ) : pantryItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧺</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#3a1f0d", marginBottom: 6 }}>Your pantry is empty</div>
            <div style={{ fontSize: 13, color: "#c09878", fontWeight: 600 }}>Add ingredients to get meal suggestions</div>
          </div>
        ) : (
          <>
            {redItems.length > 0 && <ExpirySection label="Expiring soon" dot="#ef4444" items={redItems} getName={getName} onRemove={removeIngredient} />}
            {yellowItems.length > 0 && <ExpirySection label="Use this week" dot="#f59e0b" items={yellowItems} getName={getName} onRemove={removeIngredient} />}
            {greenItems.length > 0 && <ExpirySection label="Staples" dot="#22c55e" items={greenItems} getName={getName} onRemove={removeIngredient} />}
          </>
        )}
      </div>
    </main>
  );
}

function ExpirySection({ label, dot, items, getName, onRemove }: { label: string; dot: string; items: { ingredientId: string }[]; getName: (id: string) => string; onRemove: (id: string) => void; }) {
  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: dot, flexShrink: 0 }} />
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>{label}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => (
          <div key={item.ingredientId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d" }}>{getName(item.ingredientId)}</span>
            <button onClick={() => onRemove(item.ingredientId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c09878", fontSize: 18, padding: 0, lineHeight: 1 }}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
}

