"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";

interface IngredientData { id: string; name: string; category: string; }
interface PantryItem { ingredientId: string; expiryDays?: number; }

const INGREDIENTS = ingredientsData as IngredientData[];
const EXPIRY_OPTIONS = [
  { label: "Today", days: 0, color: "#ef4444" },
  { label: "2 days", days: 2, color: "#ef4444" },
  { label: "This week", days: 7, color: "#f59e0b" },
  { label: "2 weeks", days: 14, color: "#22c55e" },
  { label: "Staple", days: 999, color: "#22c55e" },
];

export default function PantryPage() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientData | null>(null);
  const [expiryDays, setExpiryDays] = useState(999);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const id = getUserId();
    setUserId(id);
    fetch(`/api/pantry?userId=${id}`)
      .then((r) => r.json())
      .then((data) => { setPantryItems(data.items ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function addIngredient() {
    if (!selectedIngredient) return;
    const res = await fetch("/api/pantry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, ingredientId: selectedIngredient.id, quantityLevel: "some", expiryDays }) });
    if (res.ok) {
      setPantryItems((prev) => [...prev, { ingredientId: selectedIngredient.id, expiryDays }]);
      setSelectedIngredient(null);
      setSearch("");
      setShowAdd(false);
      setExpiryDays(999);
    }
  }

  async function removeIngredient(ingredientId: string) {
    await fetch(`/api/pantry?userId=${userId}&ingredientId=${ingredientId}`, { method: "DELETE" });
    setPantryItems((prev) => prev.filter((i) => i.ingredientId !== ingredientId));
  }

  const pantryIds = new Set(pantryItems.map((i) => i.ingredientId));
  const redItems = pantryItems.filter((i) => i.expiryDays !== undefined && i.expiryDays <= 2);
  const yellowItems = pantryItems.filter((i) => i.expiryDays !== undefined && i.expiryDays > 2 && i.expiryDays <= 7);
  const greenItems = pantryItems.filter((i) => !i.expiryDays || i.expiryDays > 7);
  const filteredIngredients = INGREDIENTS.filter((i) => !pantryIds.has(i.id) && i.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6);

  function getName(id: string) { return INGREDIENTS.find((i) => i.id === id)?.name ?? id; }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 10 }}>
        <div style={{ padding: "8px 20px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Image src="/logo-icon.png" alt="PrepPlate" width={120} height={120} style={{ objectFit: "contain" }} />
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>
        <div style={{ padding: "0 20px 4px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>My Pantry</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>{pantryItems.length} ingredient{pantryItems.length !== 1 ? "s" : ""} · {redItems.length > 0 ? `${redItems.length} expiring soon` : "all fresh"}</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        {/* Action buttons */}
        <div style={{ padding: "0 16px 12px", display: "flex", gap: 8 }}>
          <button style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e8d8c8", background: "#fff8f4", color: "#c09878", fontSize: 12, fontWeight: 800, cursor: "not-allowed", fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            Scan (v2)
          </button>
          <button onClick={() => { setShowAdd(!showAdd); setSelectedIngredient(null); setSearch(""); }} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e8470d", background: showAdd ? "#e8470d" : "#fff", color: showAdd ? "#fff" : "#e8470d", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            + Add item
          </button>
        </div>

        {/* Add ingredient flow */}
        {showAdd && (
          <div style={{ margin: "0 16px 16px", padding: 14, background: "#fff8f4", borderRadius: 12, border: "1px solid #fad8c8" }}>
            {!selectedIngredient ? (
              <>
                <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ingredients..." style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8d8c8", fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #f0e8de" }}>
                  {filteredIngredients.map((ing) => (
                    <div key={ing.id} onClick={() => setSelectedIngredient(ing)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "0.5px solid #f0e8de", fontSize: 13, fontWeight: 700, color: "#3a1f0d", background: "#fff" }}>
                      {ing.name} <span style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>({ing.category})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#3a1f0d", marginBottom: 12 }}>When does {selectedIngredient.name} expire?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button key={opt.days} onClick={() => setExpiryDays(opt.days)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1.5px solid", borderColor: expiryDays === opt.days ? opt.color : "#e8d8c8", background: expiryDays === opt.days ? opt.color : "#fff", color: expiryDays === opt.days ? "#fff" : "#a08060", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setSelectedIngredient(null)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e8d8c8", background: "#fff", color: "#a08060", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Back</button>
                  <button onClick={addIngredient} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: "#e8470d", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Add to pantry</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Pantry items */}
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
            {redItems.length > 0 && <ExpirySection dot="#ef4444" label="Expiring soon" items={redItems} getName={getName} onRemove={removeIngredient} />}
            {yellowItems.length > 0 && <ExpirySection dot="#f59e0b" label="Use this week" items={yellowItems} getName={getName} onRemove={removeIngredient} />}
            {greenItems.length > 0 && <ExpirySection dot="#22c55e" label="Staples" items={greenItems} getName={getName} onRemove={removeIngredient} />}
          </>
        )}
      </div>
    </main>
  );
}

function ExpirySection({ dot, label, items, getName, onRemove }: { dot: string; label: string; items: PantryItem[]; getName: (id: string) => string; onRemove: (id: string) => void; }) {
  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: dot, flexShrink: 0 }} />
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>{label}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => (
          <div key={item.ingredientId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d" }}>{getName(item.ingredientId)}</div>
              {item.expiryDays !== undefined && item.expiryDays < 999 && <div style={{ fontSize: 11, color: dot === "#ef4444" ? "#ef4444" : "#c09878", fontWeight: 600, marginTop: 2 }}>{item.expiryDays === 0 ? "Expires today" : `${item.expiryDays} days left`}</div>}
            </div>
            <button onClick={() => onRemove(item.ingredientId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c09878", fontSize: 18, padding: 0 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

