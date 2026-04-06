"use client";
import { useState, useEffect } from "react";
import ingredientsData from "@/data/ingredients.json";

interface IngredientData { id: string; name: string; }
interface StorePrice { storeId: string; storeName: string; price: number; salePrice: number | null; unit: string; inStock: boolean; }
interface IngredientPrices { ingredientId: string; name: string; stores: StorePrice[]; }

const STORES = [
  { id: "maxi", name: "Maxi" },
  { id: "iga", name: "IGA" },
  { id: "metro", name: "Metro" },
  { id: "superc", name: "Super C" },
  { id: "provigo", name: "Provigo" },
  { id: "walmart", name: "Walmart" },
  { id: "costco", name: "Costco" },
  { id: "pa", name: "PA Supermarché" },
  { id: "adonis", name: "Marché Adonis" },
  { id: "avril", name: "Avril" },
  { id: "rachelle", name: "Rachelle-Béry" },
  { id: "instacart", name: "Instacart" },
];

const INGREDIENTS = ingredientsData as IngredientData[];

export default function AdminPage() {
  const [prices, setPrices] = useState<IngredientPrices[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [storeInputs, setStoreInputs] = useState<Record<string, { price: string; salePrice: string; unit: string; inStock: boolean }>>({});
  const [saved, setSaved] = useState(false);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"update" | "view">("update");

  useEffect(() => {
    const stored = localStorage.getItem("admin-prices");
    if (stored) setPrices(JSON.parse(stored));
    // Initialize store inputs
    const inputs: typeof storeInputs = {};
    STORES.forEach((s) => { inputs[s.id] = { price: "", salePrice: "", unit: "", inStock: true }; });
    setStoreInputs(inputs);
  }, []);

  useEffect(() => {
    if (selectedIngredient) {
      const existing = prices.find((p) => p.ingredientId === selectedIngredient);
      const inputs: typeof storeInputs = {};
      STORES.forEach((s) => {
        const storeData = existing?.stores.find((st) => st.storeId === s.id);
        inputs[s.id] = {
          price: storeData?.price?.toString() ?? "",
          salePrice: storeData?.salePrice?.toString() ?? "",
          unit: storeData?.unit ?? "",
          inStock: storeData?.inStock ?? true,
        };
      });
      setStoreInputs(inputs);
    }
  }, [selectedIngredient]);

  function updateStoreInput(storeId: string, field: string, value: string | boolean) {
    setStoreInputs((prev) => ({ ...prev, [storeId]: { ...prev[storeId], [field]: value } }));
  }

  function saveIngredientPrices() {
    const ing = INGREDIENTS.find((i) => i.id === selectedIngredient);
    if (!ing) return;

    const stores: StorePrice[] = STORES.map((s) => ({
      storeId: s.id,
      storeName: s.name,
      price: parseFloat(storeInputs[s.id]?.price) || 0,
      salePrice: storeInputs[s.id]?.salePrice ? parseFloat(storeInputs[s.id].salePrice) : null,
      unit: storeInputs[s.id]?.unit || "",
      inStock: storeInputs[s.id]?.inStock ?? true,
    })).filter((s) => s.price > 0);

    const updated = prices.filter((p) => p.ingredientId !== selectedIngredient);
    const newPrices = [...updated, { ingredientId: selectedIngredient, name: ing.name, stores }];
    setPrices(newPrices);
    localStorage.setItem("admin-prices", JSON.stringify(newPrices));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(prices, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "store-prices.json";
    a.click();
  }

  if (!authenticated) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px", background: "#fdf7f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#3a1f0d", margin: "0 0 8px" }}>Admin Access</h1>
          <p style={{ fontSize: 13, color: "#c09878", fontWeight: 600 }}>PrepPlate price management</p>
        </div>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e8d8c8", fontSize: 14, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        <button onClick={() => { if (password === "prepplate2026") setAuthenticated(true); else alert("Wrong password"); }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#e8470d", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
          Sign in
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px", background: "#fdf7f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: "linear-gradient(180deg, #6b3a1f 0%, #8B5E3C 100%)", padding: "20px 20px 24px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>🛒 Price Admin</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>Update weekly store prices</p>
      </div>

      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>

        {/* Tabs */}
        <div style={{ display: "flex", margin: "0 16px 16px", border: "1.5px solid #e8d8c8", borderRadius: 12, overflow: "hidden" }}>
          <button onClick={() => setActiveTab("update")} style={{ flex: 1, padding: "10px", border: "none", background: activeTab === "update" ? "#e8470d" : "#fff", color: activeTab === "update" ? "#fff" : "#a08060", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Update prices</button>
          <button onClick={() => setActiveTab("view")} style={{ flex: 1, padding: "10px", border: "none", background: activeTab === "view" ? "#e8470d" : "#fff", color: activeTab === "view" ? "#fff" : "#a08060", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>View all</button>
        </div>

        {activeTab === "update" && (
          <div style={{ padding: "0 16px" }}>
            {/* Ingredient selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 8 }}>Select ingredient</div>
              <select value={selectedIngredient} onChange={(e) => setSelectedIngredient(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e8d8c8", fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none", background: "#fff" }}>
                <option value="">Choose an ingredient...</option>
                {INGREDIENTS.map((ing) => (
                  <option key={ing.id} value={ing.id}>{ing.name}</option>
                ))}
              </select>
            </div>

            {/* Store prices */}
            {selectedIngredient && (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 8 }}>Store prices</div>
                {STORES.map((store) => (
                  <div key={store.id} style={{ marginBottom: 10, padding: "12px", background: "#fff8f4", borderRadius: 12, border: "1px solid #fad8c8" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d", marginBottom: 8 }}>{store.name}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#c09878", fontWeight: 700, marginBottom: 3 }}>Regular $</div>
                        <input type="number" step="0.01" value={storeInputs[store.id]?.price ?? ""} onChange={(e) => updateStoreInput(store.id, "price", e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1.5px solid #e8d8c8", fontSize: 12, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#2d6a3f", fontWeight: 700, marginBottom: 3 }}>Sale $ 🏷️</div>
                        <input type="number" step="0.01" value={storeInputs[store.id]?.salePrice ?? ""} onChange={(e) => updateStoreInput(store.id, "salePrice", e.target.value)} placeholder="empty = no sale" style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1.5px solid #b8ddc4", fontSize: 12, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#c09878", fontWeight: 700, marginBottom: 3 }}>Unit</div>
                        <input type="text" value={storeInputs[store.id]?.unit ?? ""} onChange={(e) => updateStoreInput(store.id, "unit", e.target.value)} placeholder="e.g. 500g" style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1.5px solid #e8d8c8", fontSize: 12, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={storeInputs[store.id]?.inStock ?? true} onChange={(e) => updateStoreInput(store.id, "inStock", e.target.checked)} id={`stock-${store.id}`} />
                      <label htmlFor={`stock-${store.id}`} style={{ fontSize: 12, fontWeight: 700, color: "#3a1f0d", cursor: "pointer" }}>In stock</label>
                    </div>
                  </div>
                ))}

                <button onClick={saveIngredientPrices} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: saved ? "#2d6a3f" : "#e8470d", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", marginTop: 8, marginBottom: 16 }}>
                  {saved ? "✓ Saved!" : "Save prices"}
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === "view" && (
          <div style={{ padding: "0 16px" }}>
            <div style={{ fontSize: 12, color: "#c09878", fontWeight: 600, marginBottom: 16 }}>
              {prices.length} ingredient{prices.length !== 1 ? "s" : ""} with price data
            </div>
            {prices.map((item) => {
              const cheapest = item.stores.filter((s) => s.inStock).sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))[0];
              return (
                <div key={item.ingredientId} style={{ padding: "10px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#3a1f0d" }}>{item.name}</div>
                    {cheapest && <div style={{ fontSize: 12, fontWeight: 700, color: "#2d6a3f" }}>${(cheapest.salePrice ?? cheapest.price).toFixed(2)} @ {cheapest.storeName}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 4 }}>{item.stores.length} stores · {item.stores.filter((s) => s.salePrice).length} on sale</div>
                </div>
              );
            })}

            {prices.length > 0 && (
              <button onClick={exportJSON} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid #e8470d", background: "#fff", color: "#e8470d", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", marginTop: 8 }}>
                ⬇️ Export store-prices.json
              </button>
            )}

            {prices.length > 0 && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff8f4", borderRadius: 10, border: "1px solid #fad8c8" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#3a1f0d", marginBottom: 4 }}>How to publish updates:</div>
                <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, lineHeight: 1.6 }}>
                  1. Click Export to download store-prices.json{"\n"}
                  2. Copy to data/store-prices.json in your project{"\n"}
                  3. Push to GitHub — Vercel deploys automatically
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
