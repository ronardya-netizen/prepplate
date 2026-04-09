"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface StorePrice { storeId: string; storeName: string; price: number; salePrice: number | null; effectivePrice: number; unit: string; inStock: boolean; buyUrl: string; }
interface IngredientComparison { ingredientId: string; name: string; cheapestStore: StorePrice; allStores: StorePrice[]; maxSavings: number; }

const EMOJI: Record<string, string> = { "ing-001": "🍝", "ing-002": "🧄", "ing-003": "🧈", "ing-004": "🫒", "ing-005": "🧀", "ing-006": "🫘", "ing-007": "🫑", "ing-008": "🧅", "ing-014": "🥚", "ing-017": "🫘" };
const IDS = ["ing-001","ing-002","ing-003","ing-004","ing-005","ing-006","ing-007","ing-008","ing-014","ing-017"];

export default function PricesPage() {
  const [comparisons, setComparisons] = useState<IngredientComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/prices?ingredients=${IDS.join(",")}`)
      .then((r) => r.json())
      .then((data) => { setComparisons(data.results ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalCheapest = comparisons.reduce((s, c) => s + c.cheapestStore.effectivePrice, 0);
  const totalExpensive = comparisons.reduce((s, c) => s + Math.max(...c.allStores.map((x) => x.effectivePrice)), 0);
  const totalSavings = totalExpensive - totalCheapest;

  const H = { background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 40%, #a0724a 70%, #7a4a28 100%)", paddingBottom: 20 };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fff", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={H}>
        <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width={36} height={36} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="13" cy="13" r="9" fill="white"/><circle cx="27" cy="13" r="9" fill="white"/>
              <circle cx="13" cy="27" r="9" fill="white"/><circle cx="27" cy="27" r="9" fill="white"/>
            </svg>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>PrepPlate</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>Eat smart. Save more. Share more.</div>
            </div>
          </div>
          <Link href="/home" style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.8)", textDecoration: "none" }}>Back</Link>
        </div>
        <div style={{ padding: "0 20px 4px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px", textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>Price comparison</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>Best price across 6 stores</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>
        {loading ? (
          <p style={{ padding: "30px 20px", color: "#c09878", fontWeight: 700 }}>Comparing prices...</p>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 16px" }}>
              <div style={{ background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 6 }}>Best total</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#e8470d" }}>${totalCheapest.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 4 }}>buying smart</div>
              </div>
              <div style={{ background: "#f0faf3", border: "1px solid #b8ddc4", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#7ab88a", marginBottom: 6 }}>You save</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#2d6a3f" }}>${totalSavings.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: "#7ab88a", fontWeight: 600, marginTop: 4 }}>vs most expensive</div>
              </div>
            </div>

            <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>Best price per ingredient</div>

            <div style={{ padding: "0 16px" }}>
              {comparisons.map((item) => (
                <div key={item.ingredientId} style={{ marginBottom: 8 }}>
                  <div onClick={() => setExpanded(expanded === item.ingredientId ? null : item.ingredientId)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fff", border: expanded === item.ingredientId ? "1px solid #e8470d" : "1px solid #f0e8de", borderRadius: expanded === item.ingredientId ? "12px 12px 0 0" : 12, cursor: "pointer" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff8f4", border: "1px solid #fad8c8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{EMOJI[item.ingredientId] ?? "🍴"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "#2d6a3f", fontWeight: 700, marginTop: 1 }}>Best: {item.cheapestStore.storeName} · ${item.cheapestStore.effectivePrice.toFixed(2)}/{item.cheapestStore.unit}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {item.maxSavings > 0 && <div style={{ fontSize: 10, fontWeight: 800, color: "#2d6a3f", background: "#e8f5ec", padding: "2px 7px", borderRadius: 6, marginBottom: 4 }}>Save ${item.maxSavings.toFixed(2)}</div>}
                      <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>{expanded === item.ingredientId ? "less" : "all stores"}</div>
                    </div>
                  </div>
                  {expanded === item.ingredientId && (
                    <div style={{ border: "1px solid #e8470d", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                      {item.allStores.map((store, idx) => (
                        <div key={store.storeId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: idx === 0 ? "#fff8f4" : "#fff", borderTop: idx > 0 ? "0.5px solid #f0e8de" : "none" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{store.storeName}</span>
                              {idx === 0 && <span style={{ fontSize: 9, fontWeight: 800, background: "#e8470d", color: "#fff", padding: "2px 6px", borderRadius: 4 }}>BEST</span>}
                              {store.salePrice && <span style={{ fontSize: 9, fontWeight: 800, background: "#e8f5ec", color: "#2d6a3f", padding: "2px 6px", borderRadius: 4 }}>SALE</span>}
                            </div>
                            <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>{store.unit}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginRight: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: idx === 0 ? "#e8470d" : "#3a1f0d" }}>${store.effectivePrice.toFixed(2)}</div>
                            {store.salePrice && <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, textDecoration: "line-through" }}>${store.price.toFixed(2)}</div>}
                          </div>
                          <a href={store.buyUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ padding: "6px 12px", borderRadius: 8, background: idx === 0 ? "#e8470d" : "#f5f0e8", color: idx === 0 ? "#fff" : "#a08060", fontSize: 11, fontWeight: 800, textDecoration: "none", flexShrink: 0 }}>Buy</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}