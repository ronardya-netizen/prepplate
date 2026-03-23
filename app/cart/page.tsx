"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const MOCK_USER_ID = "user-001";

interface CartIngredient {
  ingredientId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  basePrice: number;
  effectivePrice: number;
  discountPct: number;
  lineTotal: number;
  totalCalories: number;
  fromRecipes: string[];
  inPantry: boolean;
}

interface CartSummary {
  ingredients: CartIngredient[];
  totalCost: number;
  totalSavings: number;
  totalCalories: number;
  costPerCalorie: number;
  mealCount: number;
}

const CATEGORY_EMOJI: Record<string, string> = {
  produce: "🥦",
  dairy: "🧀",
  protein: "🥩",
  pantry: "🧂",
  grain: "🌾",
};

const CATEGORY_ORDER = ["protein", "grain", "produce", "dairy", "pantry"];

export default function CartPage() {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/cart?userId=${MOCK_USER_ID}`)
      .then((r) => r.json())
      .then((data) => { setCart(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function toggleItem(id: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const grouped = cart?.ingredients.reduce<Record<string, CartIngredient[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {}) ?? {};

  const remainingCost = cart?.ingredients
    .filter((i) => !checkedItems.has(i.ingredientId))
    .reduce((sum, i) => sum + i.lineTotal, 0) ?? 0;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 }}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="P'tit Chef" width={44} height={44} style={{ borderRadius: 12, objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Nunito', sans-serif" }}>P&apos;tit Chef</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>Eat Smarter. Save more. Share more.</div>
            </div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fde8d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#e8470d" }}>M</div>
        </div>
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)", fontFamily: "'Nunito', sans-serif" }}>
            Your cart 🛒
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0, fontFamily: "'Nunito', sans-serif" }}>
            {loading ? "Loading…" : `${cart?.ingredients.length ?? 0} items · ${cart?.mealCount ?? 0} meals covered`}
          </p>
        </div>
      </div>

      {/* White surface */}
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        {loading ? (
          <p style={{ padding: "30px 20px", color: "#c09878", fontWeight: 700, fontSize: 14 }}>Building your smart cart…</p>
        ) : !cart ? (
          <p style={{ padding: "30px 20px", color: "#c09878", fontWeight: 700, fontSize: 14 }}>Could not load cart. Try again.</p>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 14px" }}>
              <div style={{ background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 6 }}>Total cost</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#e8470d" }}>${cart.totalCost.toFixed(2)}</div>
                {checkedItems.size > 0 && (
                  <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 4 }}>
                    ${remainingCost.toFixed(2)} remaining
                  </div>
                )}
              </div>
              <div style={{ background: "#f0faf3", border: "1px solid #b8ddc4", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#7ab88a", marginBottom: 6 }}>You save</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#2d6a3f" }}>${cart.totalSavings.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: "#7ab88a", fontWeight: 600, marginTop: 4 }}>
                  with today&apos;s sales
                </div>
              </div>
            </div>

            {/* Shopping list */}
            {CATEGORY_ORDER.filter((cat) => grouped[cat]).map((category) => (
              <div key={category} style={{ marginBottom: 12 }}>
                <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
                  {CATEGORY_EMOJI[category] ?? "🍴"} {category}
                </div>
                <div style={{ padding: "0 16px" }}>
                  {grouped[category].map((item) => (
                    <div
                      key={item.ingredientId}
                      onClick={() => toggleItem(item.ingredientId)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px",
                        background: checkedItems.has(item.ingredientId) ? "#f5f0e8" : "#fff",
                        border: "1px solid #f0e8de",
                        borderRadius: 12,
                        marginBottom: 6,
                        cursor: "pointer",
                        opacity: checkedItems.has(item.ingredientId) ? 0.5 : 1,
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: checkedItems.has(item.ingredientId) ? "#e8470d" : "#fff",
                        border: `2px solid ${checkedItems.has(item.ingredientId) ? "#e8470d" : "#e8d8c8"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 12, fontWeight: 800,
                      }}>
                        {checkedItems.has(item.ingredientId) ? "✓" : ""}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d", textDecoration: checkedItems.has(item.ingredientId) ? "line-through" : "none" }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>
                          {item.quantity} {item.unit}
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>
                          ${item.lineTotal.toFixed(2)}
                        </div>
                        {item.discountPct > 0 && (
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#2d6a3f", background: "#e8f5ec", padding: "2px 6px", borderRadius: 4, marginTop: 2 }}>
                            -{item.discountPct}% off
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pantry note */}
            <div style={{ margin: "0 16px 16px", background: "#f0faf3", border: "1px solid #b8ddc4", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#2d6a3f", marginBottom: 4 }}>✓ Already in your pantry</div>
              <div style={{ fontSize: 11, color: "#5a9e6f", fontWeight: 600 }}>
                Items you already own are excluded from this cart.
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
