"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ingredientsData from "@/data/ingredients.json";
import promotionsData from "@/data/promotions.json";

const MOCK_USER_ID = typeof window !== "undefined" ?
  (localStorage.getItem("prepplate-user-id") || "user-001") : "user-001";
const QUANTITY_LEVELS = ["lots", "some", "low"] as const;
type QuantityLevel = typeof QUANTITY_LEVELS[number];

interface PantryItem {
  id: string;
  ingredientId: string;
  quantityLevel: QuantityLevel;
  ingredient: { id: string; name: string; category: string };
}

interface IngredientData {
  id: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number;
}

interface Promotion {
  ingredientId: string;
  discountPct: number;
  validFrom: string;
  validUntil: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  produce: "🥦",
  dairy: "🧀",
  protein: "🥩",
  pantry: "🧂",
  grain: "🌾",
};

const INGREDIENT_EMOJI: Record<string, string> = {
  "ing-001": "🍝", "ing-002": "🧄", "ing-003": "🧈",
  "ing-004": "🫒", "ing-005": "🧀", "ing-006": "🫘",
  "ing-007": "🫑", "ing-008": "🧅", "ing-009": "🌿",
  "ing-010": "🥫", "ing-011": "🍚", "ing-012": "🍵",
  "ing-013": "🍋", "ing-014": "🥚", "ing-015": "🥬",
  "ing-016": "🧀", "ing-017": "🫘", "ing-018": "🫓",
  "ing-019": "🍅", "ing-020": "🥑",
};

const quantityDots: Record<QuantityLevel, number> = { lots: 3, some: 2, low: 1 };

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const now = new Date();
  const activePromos = new Map<string, number>();
  (promotionsData as Promotion[]).forEach((p) => {
    if (new Date(p.validFrom) <= now && new Date(p.validUntil) >= now) {
      activePromos.set(p.ingredientId, p.discountPct);
    }
  });

  async function loadPantry() {
    const res = await fetch(`/api/pantry?userId=${MOCK_USER_ID}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => { loadPantry(); }, []);

  async function updateQuantity(ingredientId: string, level: QuantityLevel) {
    await fetch("/api/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: MOCK_USER_ID, ingredientId, quantityLevel: level }),
    });
    loadPantry();
  }

  async function removeItem(ingredientId: string) {
    await fetch("/api/pantry", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: MOCK_USER_ID, ingredientId }),
    });
    loadPantry();
  }

  async function addIngredient(ingredientId: string) {
    await fetch("/api/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: MOCK_USER_ID, ingredientId, quantityLevel: "some" }),
    });
    setSearch("");
    setAdding(false);
    loadPantry();
  }

  const pantryIds = new Set(items.map((i) => i.ingredientId));
  const allIngredients = ingredientsData as IngredientData[];
  const filtered = allIngredients
    .filter((i) => !pantryIds.has(i.id) && i.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  const saleItems = items.filter((i) => activePromos.has(i.ingredientId));
  const regularItems = items.filter((i) => !activePromos.has(i.ingredientId));
  const totalSaleCount = saleItems.length;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", fontFamily: "'Nunito', sans-serif", paddingBottom: 80 }}>

      {/* Kitchen background header */}
      <div style={{
        background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)",
        paddingBottom: 16,
      }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="P'tit Chef" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>P&apos;tit Chef</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>Eat Smarter. Save More. Share More.</div>
            </div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>

        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 2px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>
            Your pantry 🧺
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>
            {items.length} ingredient{items.length !== 1 ? "s" : ""}{totalSaleCount > 0 ? ` · ${totalSaleCount} on sale today` : ""}
          </p>
        </div>
      </div>

      {/* White counter surface */}
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        {/* Add ingredient button */}
        <div style={{ padding: "0 16px 12px" }}>
          {!adding ? (
            <button onClick={() => setAdding(true)} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px dashed #e8d8c8", background: "transparent", color: "#c09878", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", fontFamily: "'Nunito', sans-serif" }}>
              + Add an ingredient
            </button>
          ) : (
            <div style={{ background: "#fff8f4", borderRadius: 12, padding: "12px 14px", border: "1px solid #fad8c8" }}>
              <input autoFocus type="text" placeholder="Search ingredients…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", marginBottom: 8, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600 }} />
              {search.length > 0 && (
                <div>
                  {filtered.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#c09878", fontWeight: 600 }}>No ingredients found</p>
                  ) : (
                    filtered.map((ing) => (
                      <button key={ing.id} onClick={() => addIngredient(ing.id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 0", background: "none", border: "none", borderBottom: "0.5px solid #f0e8de", cursor: "pointer", fontSize: 13, color: "#3a1f0d", textAlign: "left", fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>
                        <span style={{ fontSize: 18 }}>{INGREDIENT_EMOJI[ing.id] ?? CATEGORY_EMOJI[ing.category] ?? "🍴"}</span>
                        {ing.name}
                        <span style={{ fontSize: 10, color: "#c09878", marginLeft: "auto", fontWeight: 700 }}>{ing.category}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              <button onClick={() => { setAdding(false); setSearch(""); }} style={{ marginTop: 8, fontSize: 12, color: "#c09878", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p style={{ padding: "20px", color: "#c09878", fontSize: 14, fontWeight: 700 }}>Loading your pantry…</p>
        ) : (
          <>
            {/* Sale items section */}
            {saleItems.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", display: "flex", alignItems: "center", gap: 6 }}>
                  🔥 On sale today
                  <span style={{ background: "#e8470d", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10 }}>
                    Save up to {Math.max(...saleItems.map(i => activePromos.get(i.ingredientId) ?? 0))}%
                  </span>
                </div>
                <div style={{ padding: "0 16px" }}>
                  {saleItems.map((item) => (
                    <PantryItemCard
                      key={item.id}
                      item={item}
                      discountPct={activePromos.get(item.ingredientId)}
                      allIngredients={allIngredients}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                      variant="sale"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular pantry items */}
            {regularItems.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
                  🧺 In your pantry
                </div>
                <div style={{ padding: "0 16px" }}>
                  {regularItems.map((item) => (
                    <PantryItemCard
                      key={item.id}
                      item={item}
                      allIngredients={allIngredients}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                      variant="regular"
                    />
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🧺</div>
                <p style={{ color: "#c09878", fontSize: 14, fontWeight: 700, margin: 0 }}>Your pantry is empty</p>
                <p style={{ color: "#d0c0b0", fontSize: 12, fontWeight: 600, marginTop: 4 }}>Add ingredients to get started</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function PantryItemCard({
  item, discountPct, allIngredients, onUpdateQuantity, onRemove, variant,
}: {
  item: PantryItem;
  discountPct?: number;
  allIngredients: IngredientData[];
  onUpdateQuantity: (id: string, level: QuantityLevel) => void;
  onRemove: (id: string) => void;
  variant: "sale" | "regular";
}) {
  const ing = allIngredients.find((i) => i.id === item.ingredientId);
  const dots = quantityDots[item.quantityLevel];
  const effectivePrice = ing ? ing.basePrice * (1 - (discountPct ?? 0) / 100) : 0;

  const INGREDIENT_EMOJI: Record<string, string> = {
    "ing-001": "🍝", "ing-002": "🧄", "ing-003": "🧈",
    "ing-004": "🫒", "ing-005": "🧀", "ing-006": "🫘",
    "ing-007": "🫑", "ing-008": "🧅", "ing-009": "🌿",
    "ing-010": "🥫", "ing-011": "🍚", "ing-012": "🍵",
    "ing-013": "🍋", "ing-014": "🥚", "ing-015": "🥬",
    "ing-016": "🧀", "ing-017": "🫘", "ing-018": "🫓",
    "ing-019": "🍅", "ing-020": "🥑",
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px",
      background: variant === "sale" ? "#fff" : "#f5f8ff",
      border: `1px solid ${variant === "sale" ? "#fad8c8" : "#dde8f5"}`,
      borderRadius: 12,
      marginBottom: 6,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: variant === "sale" ? "#fff8f4" : "#eef4ff", border: `1px solid ${variant === "sale" ? "#fad8c8" : "#c8daf5"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {INGREDIENT_EMOJI[item.ingredientId] ?? "🍴"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{item.ingredient.name}</div>
        <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>{item.ingredient.category}</div>
        <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ width: 7, height: 7, borderRadius: "50%", background: n <= dots ? "#e8470d" : "#e8d8c8" }} />
          ))}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0, marginRight: 6 }}>
        {ing && (
          <div style={{ fontSize: 12, fontWeight: 800, color: "#3a1f0d" }}>
            ${effectivePrice.toFixed(3)}/{ing.unit}
          </div>
        )}
        {discountPct && (
          <div style={{ fontSize: 9, fontWeight: 800, color: "#2d6a3f", background: "#e8f5ec", padding: "2px 6px", borderRadius: 4, marginTop: 2 }}>
            -{discountPct}% off
          </div>
        )}
        <div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "flex-end" }}>
          {QUANTITY_LEVELS.map((level) => (
            <button key={level} onClick={() => onUpdateQuantity(item.ingredientId, level)} style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, border: "0.5px solid", borderColor: item.quantityLevel === level ? "#e8470d" : "#e8d8c8", background: item.quantityLevel === level ? "#fff0ec" : "transparent", color: item.quantityLevel === level ? "#e8470d" : "#c09878", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
              {level}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => onRemove(item.ingredientId)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#d0c0b0", padding: "0 2px", flexShrink: 0 }}>×</button>
    </div>
  );
}
