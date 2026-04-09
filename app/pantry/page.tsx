"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ingredientsData from "@/data/ingredients.json";
import { getUserId } from "@/lib/user";


interface IngredientData {
  id: string;
  name: string;
  nameFr?: string;
  emoji?: string;
  category: string;
  unit: string;
  basePrice: number;
  defaultShelfDays: number;
}


interface PantryItem {
  ingredientId: string;
  expiryDays?: number;
  quantityLevel?: string;
}


interface MatchedItem { ingredient: IngredientData; matched: true; }
interface UnmatchedItem { name: string; matched: false; }
interface ReviewData { matched: MatchedItem[]; unmatched: UnmatchedItem[]; receiptTotal: number | null; }


const INGREDIENTS = ingredientsData as IngredientData[];


function getExpiryDays(quantityLevel: string): number | undefined {
  if (!quantityLevel) return undefined;
  const match = quantityLevel.match(/expiry:(\d+)/);
  if (match) return parseInt(match[1]);
  return undefined;
}


function getBudgetInfo() {
  try {
    const settings = JSON.parse(localStorage.getItem("prepplate-settings") ?? "{}");
    const monthly = settings.budget ?? 300;
    const spent = parseFloat(localStorage.getItem("prepplate-budget-spent") ?? "0");
    return { monthly, spent, remaining: Math.max(0, monthly - spent) };
  } catch { return { monthly: 300, spent: 0, remaining: 300 }; }
}


function getIngredientName(ing: IngredientData, lang: string) {
  const label = lang === "fr" && ing.nameFr ? ing.nameFr : ing.name;
  return `${ing.emoji ?? ""} ${label}`.trim();
}


export default function PantryPage() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [lang, setLang] = useState("en");
  const [scanning, setScanning] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [selectedForAdd, setSelectedForAdd] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [budget, setBudget] = useState({ monthly: 300, spent: 0, remaining: 300 });
  const fileRef = useRef<HTMLInputElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    const id = getUserId();
    setUserId(id);
    const savedLang = localStorage.getItem("prepplate-lang") ?? "en";
    setLang(savedLang);
    setBudget(getBudgetInfo());
    fetch(`/api/pantry?userId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        const items = (data.items ?? []).map((item: PantryItem & { quantityLevel: string }) => ({
          ...item,
          expiryDays: getExpiryDays(item.quantityLevel ?? ""),
        }));
        setPantryItems(items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);


  function getItemName(ingredientId: string) {
    const ing = INGREDIENTS.find((i) => i.id === ingredientId);
    if (!ing) return ingredientId;
    return getIngredientName(ing, lang);
  }


  async function handleReceiptScan(file: File) {
    setScanning(true);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = () => rej(new Error("Read failed"));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = await response.json();
      const pantryIds = new Set(pantryItems.map((i) => i.ingredientId));
      setReviewData({
        matched: (data.matched ?? []).filter((m: MatchedItem) => !pantryIds.has(m.ingredient.id)),
        unmatched: data.unmatched ?? [],
        receiptTotal: data.receiptTotal ?? null,
      });
      setSelectedForAdd(new Set(
        (data.matched ?? [])
          .filter((m: MatchedItem) => !pantryIds.has(m.ingredient.id))
          .map((m: MatchedItem) => m.ingredient.id)
      ));
    } catch (err) {
      console.error(err);
      alert(lang === "fr" ? "Impossible de scanner le reçu. Réessayez." : "Could not scan receipt. Please try again.");
    } finally { setScanning(false); }
  }


  async function confirmAddFromReceipt() {
    if (!reviewData) return;
    setAdding(true);
    if (reviewData.receiptTotal !== null) {
      const current = parseFloat(localStorage.getItem("prepplate-budget-spent") ?? "0");
      localStorage.setItem("prepplate-budget-spent", (current + reviewData.receiptTotal).toFixed(2));
      setBudget(getBudgetInfo());
    }
    await fetch("/api/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ingredientId: "ing-001", quantityLevel: "some" }),
    }).catch(() => {});
    for (const item of reviewData.matched.filter((m) => selectedForAdd.has(m.ingredient.id))) {
      const shelf = item.ingredient.defaultShelfDays;
      await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ingredientId: item.ingredient.id, quantityLevel: "some", expiryDays: shelf }),
      });
      setPantryItems((prev) => [
        ...prev.filter((p) => p.ingredientId !== item.ingredient.id),
        { ingredientId: item.ingredient.id, expiryDays: shelf },
      ]);
    }
    setReviewData(null);
    setAdding(false);
  }


  async function removeIngredient(ingredientId: string) {
    await fetch(`/api/pantry?userId=${userId}&ingredientId=${ingredientId}`, { method: "DELETE" });
    setPantryItems((prev) => prev.filter((i) => i.ingredientId !== ingredientId));
  }


  function getShelfLabel(item: PantryItem) {
    const days = item.expiryDays;
    if (days === undefined || days >= 999) return null;
    if (days === 0) return lang === "fr" ? "Expire aujourd'hui" : "Expires today";
    if (days === 1) return lang === "fr" ? "1 jour restant" : "1 day left";
    return lang === "fr" ? `${days} jours restants` : `${days} days left`;
  }


  const redItems = pantryItems.filter((i) => i.expiryDays !== undefined && i.expiryDays <= 2 && i.expiryDays < 999);
  const yellowItems = pantryItems.filter((i) => i.expiryDays !== undefined && i.expiryDays > 2 && i.expiryDays <= 7);
  const greenItems = pantryItems.filter((i) => !i.expiryDays || i.expiryDays >= 999 || i.expiryDays > 7);
  const budgetPct = Math.min(100, (budget.spent / budget.monthly) * 100);


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
            {lang === "fr" ? "Mon Garde-manger" : "My Pantry"}
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0 }}>
            {pantryItems.length} {lang === "fr" ? "ingrédient" : "ingredient"}{pantryItems.length !== 1 ? "s" : ""} · {redItems.length > 0 ? `${redItems.length} ${lang === "fr" ? "expirent bientôt" : "expiring soon"}` : (lang === "fr" ? "tout est frais" : "all fresh")}
          </p>
        </div>
      </div>


      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 16 }}>


        {/* Budget bar */}
        <div style={{ margin: "0 16px 14px", padding: "12px 14px", background: "#fff8f4", borderRadius: 12, border: "1px solid #fad8c8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#3a1f0d" }}>
              {lang === "fr" ? "Budget mensuel" : "Monthly budget"}
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: budget.remaining < 50 ? "#ef4444" : "#e8470d" }}>
              ${budget.remaining.toFixed(2)} {lang === "fr" ? "restant" : "left"}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "#f0e8de", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${budgetPct}%`, borderRadius: 3, background: budgetPct > 85 ? "#ef4444" : budgetPct > 60 ? "#f59e0b" : "#22c55e", transition: "width .4s" }} />
          </div>
          <div style={{ fontSize: 10, color: "#c09878", fontWeight: 600, marginTop: 4 }}>
            ${budget.spent.toFixed(2)} {lang === "fr" ? "dépensé sur" : "spent of"} ${budget.monthly}/{lang === "fr" ? "mois" : "month"}
          </div>
        </div>


        {/* Action buttons */}
        <div style={{ padding: "0 16px 16px" }}>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReceiptScan(f); e.target.value = ""; }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button onClick={() => fileRef.current?.click()} disabled={scanning} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "2px dashed #e8470d", background: "#fff8f4", color: "#e8470d", fontSize: 13, fontWeight: 800, cursor: scanning ? "not-allowed" : "pointer", fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              {scanning ? "…" : (lang === "fr" ? "Scanner reçu" : "Scan receipt")}
            </button>
            <button onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); }} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${showSearch ? "#e8470d" : "#e8d8c8"}`, background: showSearch ? "#e8470d" : "#fff", color: showSearch ? "#fff" : "#e8470d", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              {lang === "fr" ? "Rechercher" : "Search"}
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "#c09878", fontWeight: 600, margin: 0 }}>
            {lang === "fr" ? "Scannez un reçu ou recherchez un ingrédient" : "Scan a receipt or search for an ingredient"}
          </p>
        </div>


        {/* Manual search */}
        {showSearch && !reviewData && (
          <div style={{ margin: "0 16px 16px", padding: 14, background: "#fff8f4", borderRadius: 12, border: "1px solid #fad8c8" }}>
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "fr" ? "Rechercher un ingrédient…" : "Search ingredient…"}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8d8c8", fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
            />
            <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #f0e8de" }}>
              {INGREDIENTS
                .filter((i) => !new Set(pantryItems.map((p) => p.ingredientId)).has(i.id) && (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.nameFr ?? "").toLowerCase().includes(searchQuery.toLowerCase())))
                .slice(0, 8)
                .map((ing) => (
                  <div key={ing.id} onClick={async () => {
                    await fetch("/api/pantry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, ingredientId: ing.id, quantityLevel: "some", expiryDays: ing.defaultShelfDays }) });
                    setPantryItems((prev) => [...prev, { ingredientId: ing.id, expiryDays: ing.defaultShelfDays }]);
                    setSearchQuery("");
                    setShowSearch(false);
                  }} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "0.5px solid #f0e8de", fontSize: 13, fontWeight: 700, color: "#3a1f0d", background: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{ing.emoji}</span>
                    <div>
                      <div>{lang === "fr" && ing.nameFr ? ing.nameFr : ing.name}</div>
                      <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>
                        {ing.defaultShelfDays >= 999 ? (lang === "fr" ? "Article de base" : "Staple") : `~${ing.defaultShelfDays} ${lang === "fr" ? "jours" : "days"}`}
                      </div>
                    </div>
                  </div>
                ))}
              {searchQuery.length > 0 && INGREDIENTS.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div style={{ padding: "12px 14px", fontSize: 13, color: "#c09878", fontWeight: 600 }}>
                  {lang === "fr" ? "Aucun ingrédient trouvé" : "No ingredient found"}
                </div>
              )}
            </div>
          </div>
        )}


        {/* Review screen */}
        {reviewData && (
          <div style={{ margin: "0 16px 16px", padding: 16, background: "#fff8f4", borderRadius: 16, border: "1.5px solid #fad8c8" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#3a1f0d", marginBottom: 2 }}>
              {lang === "fr" ? "Vérifier les articles détectés" : "Review detected items"}
            </div>
            <div style={{ fontSize: 12, color: "#c09878", fontWeight: 600, marginBottom: 12 }}>
              {lang === "fr" ? "Appuyez pour désélectionner les articles non désirés" : "Tap to deselect items you don't want to add"}
            </div>
            {reviewData.receiptTotal !== null && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", marginBottom: 14, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{lang === "fr" ? "Total du reçu" : "Receipt total"}</div>
                  <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>{lang === "fr" ? "Sera déduit de votre budget" : "Will be deducted from your budget"}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e" }}>${reviewData.receiptTotal.toFixed(2)}</div>
              </div>
            )}
            {reviewData.matched.length === 0 && reviewData.unmatched.length === 0 && (
              <p style={{ color: "#c09878", fontSize: 13, fontWeight: 700 }}>
                {lang === "fr" ? "Aucun aliment détecté. Essayez une photo plus nette." : "No food items detected. Try a clearer photo."}
              </p>
            )}
            {reviewData.matched.map((m) => {
              const selected = selectedForAdd.has(m.ingredient.id);
              return (
                <div key={m.ingredient.id} onClick={() => {
                  const next = new Set(selectedForAdd);
                  selected ? next.delete(m.ingredient.id) : next.add(m.ingredient.id);
                  setSelectedForAdd(next);
                }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", marginBottom: 6, background: selected ? "#fff" : "#f5f0ec", border: `1.5px solid ${selected ? "#e8470d" : "#e8d8c8"}`, borderRadius: 10, cursor: "pointer", opacity: selected ? 1 : 0.5 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d" }}>{getIngredientName(m.ingredient, lang)}</div>
                    <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600 }}>
                      {m.ingredient.defaultShelfDays >= 999 ? (lang === "fr" ? "Article de base" : "Staple") : `~${m.ingredient.defaultShelfDays} ${lang === "fr" ? "jours" : "days shelf life"}`}
                    </div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: selected ? "#e8470d" : "#e8d8c8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}
                  </div>
                </div>
              );
            })}
            {reviewData.unmatched.map((u) => (
              <div key={u.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", marginBottom: 6, background: "#f5f5f5", border: "1.5px solid #e8e8e8", borderRadius: 10, opacity: 0.5 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#888" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>{lang === "fr" ? "Pas encore dans notre liste" : "Not in our ingredient list yet"}</div>
                </div>
                <div style={{ fontSize: 11, color: "#aaa", fontWeight: 700, background: "#eee", padding: "2px 8px", borderRadius: 20 }}>Soon</div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setReviewData(null)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e8d8c8", background: "#fff", color: "#a08060", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {lang === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button onClick={confirmAddFromReceipt} disabled={adding || selectedForAdd.size === 0} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: selectedForAdd.size === 0 ? "#ccc" : "#e8470d", color: "#fff", fontSize: 13, fontWeight: 800, cursor: adding || selectedForAdd.size === 0 ? "not-allowed" : "pointer", fontFamily: "'Nunito', sans-serif" }}>
                {adding ? (lang === "fr" ? "Ajout en cours…" : "Adding…") : `${lang === "fr" ? "Ajouter" : "Add"} ${selectedForAdd.size} ${lang === "fr" ? "article" : "item"}${selectedForAdd.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}


        {/* Pantry list */}
        {loading ? (
          <p style={{ padding: "20px", color: "#c09878", fontWeight: 700 }}>{lang === "fr" ? "Chargement…" : "Loading pantry…"}</p>
        ) : pantryItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧺</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#3a1f0d", marginBottom: 6 }}>{lang === "fr" ? "Votre garde-manger est vide" : "Your pantry is empty"}</div>
            <div style={{ fontSize: 13, color: "#c09878", fontWeight: 600 }}>{lang === "fr" ? "Scannez un reçu ou recherchez un ingrédient" : "Scan a receipt or search for an ingredient"}</div>
          </div>
        ) : (
          <>
            {redItems.length > 0 && <Section dot="#ef4444" label={lang === "fr" ? "Expire bientôt" : "Expiring soon"} items={redItems} getItemName={getItemName} getShelfLabel={getShelfLabel} onRemove={removeIngredient} />}
            {yellowItems.length > 0 && <Section dot="#f59e0b" label={lang === "fr" ? "À utiliser cette semaine" : "Use this week"} items={yellowItems} getItemName={getItemName} getShelfLabel={getShelfLabel} onRemove={removeIngredient} />}
            {greenItems.length > 0 && <Section dot="#22c55e" label={lang === "fr" ? "Articles de base & frais" : "Staples & fresh"} items={greenItems} getItemName={getItemName} getShelfLabel={getShelfLabel} onRemove={removeIngredient} />}
          </>
        )}
      </div>
    </main>
  );
}


function Section({ dot, label, items, getItemName, getShelfLabel, onRemove }: {
  dot: string; label: string; items: PantryItem[];
  getItemName: (id: string) => string;
  getShelfLabel: (item: PantryItem) => string | null;
  onRemove: (id: string) => void;
}) {
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
              <div style={{ fontSize: 14, fontWeight: 700, color: "#3a1f0d" }}>{getItemName(item.ingredientId)}</div>
              {getShelfLabel(item) && <div style={{ fontSize: 11, color: dot === "#ef4444" ? "#ef4444" : "#c09878", fontWeight: 600, marginTop: 2 }}>{getShelfLabel(item)}</div>}
            </div>
            <button onClick={() => onRemove(item.ingredientId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c09878", fontSize: 20, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
