"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";

interface IngredientData { id: string; name: string; category: string; unit: string; basePrice: number; }
interface PantryItem { ingredientId: string; expiryDays?: number; }

const INGREDIENTS = ingredientsData as IngredientData[];

function getExpiryStatus(days?: number): "red" | "yellow" | "green" {
  if (!days) return "green";
  if (days <= 2) return "red";
  if (days <= 7) return "yellow";
  return "green";
}

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
    if (res.ok) {
      setPantryItems((prev) => [...prev, { ingredientId }]);
      setSearch("");
      setShowAdd(false);
    }
  }

  async function removeIngredient(ingredientId: string) {
    await fetch(`/api/pantry?userId=${userId}&ingredientId=${ingredientId}`, { method: "DELETE" });
    setPantryItems((prev) => prev.filter((i) => i.ingredientId !== ingredientId));
  }

  const pantryIds = new Set(pantryItems.map((i) => i.ingredientId));
  const redItems = pantryItems.filter((i) => getExpiryStatus(i.expiryDays) === "red");
  const yellowItems = pantryItems.filter((i) => getExpiryStatus(i.expiryDays) === "yellow");
  const greenItems = pantryItems.filter((i) => getExpiryStatus(i.expiryDays) === "green");

  const filteredIngredients = INGREDIENTS.filter((i) => !pantryIds.has(i.id) && i.name.toLowerCase().includes(search.toLowerCase()));

  function getIngredientName(id: string) { return INGREDIENTS.find((i) => i.id === id)?.name ?? id; }

  const H = { background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={H}>
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

        <div style={{ padding: "0 16px 12px" }}>
          <button onClick={() => setShowAdd(!showAdd)} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1.5px dashed #e8d8c8", background: "#fff", color: "#e8470d", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            + Add an ingredient
          </button>
        </div>

        {showAdd && (
          <div style={{ padding: "0 16px 16px" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ingredients..." style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8d8c8", fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box" }} />
            <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 8, borderRadius: 10, border: "1px solid #f0e8de" }}>
              {filteredIngredients.slice(0, 10).map((ing) => (
                <div key={ing.id} onClick={() => addIngredient(ing.id)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "0.5px solid #f0e8de", fontSize: 13, fontWeight: 700, color: "#3a1f0d" }}>
                  {ing.name} <span style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>({ing.category})</span>
                </div>
              ))}
            </div>
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
            {redItems.length > 0 && (
              <PantrySection label="Expiring soon" color="#e8470d" bg="#fff0ec" items={redItems} getIngredientName={getIngredientName} onRemove={removeIngredient} />
            )}
            {yellowItems.length > 0 && (
              <PantrySection label="Use this week" color="#d97706" bg="#fffbeb" items={yellowItems} getIngredientName={getIngredientName} onRemove={removeIngredient} />
            )}
            {greenItems.length > 0 && (
              <PantrySection label="Staples" color="#2d6a3f" bg="#f0faf3" items={greenItems} getIngredientName={getIngredientName} onRemove={removeIngredient} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function PantrySection({ label, color, bg, items, getIngredientName, onRemove }: { label: string; color: string; bg: string; items: PantryItem[]; getIngredientName: (id: string) => string; onRemove: (id: string) => void; }) {
  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((item) => (
          <div key={item.ingredientId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: bg, borderRadius: 20, border: `1px solid ${color}22` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#3a1f0d" }}>{getIngredientName(item.ingredientId)}</span>
            <button onClick={() => onRemove(item.ingredientId)} style={{ background: "none", border: "none", cursor: "pointer", color, fontSize: 14, padding: 0, lineHeight: 1 }}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
}

