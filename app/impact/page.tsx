"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ImpactData {
  totalMealsFunded: number;
  mealsThisMonth: number;
  partners: string[];
  recentMetrics: { month: string; mealsFunded: number; partnerOrg: string; region: string }[];
}

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

export default function ImpactPage() {
  const [data, setData] = useState<ImpactData | null>(null);

  useEffect(() => {
    fetch("/api/impact")
      .then((r) => r.json())
      .then(setData);
  }, []);

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
            Your impact 🌱
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, margin: 0, fontFamily: "'Nunito', sans-serif" }}>
            Every $4.99 subscription helps fund meals for people facing food insecurity.
          </p>
        </div>
      </div>

      {/* White surface */}
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", marginTop: -8, paddingTop: 20 }}>

        {/* Hero stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 16px" }}>
          <div style={{ background: "#f0faf3", border: "1px solid #b8ddc4", borderRadius: 14, padding: "16px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#7ab88a", marginBottom: 6 }}>This month</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#2d6a3f", lineHeight: 1 }}>{data?.mealsThisMonth ?? "—"}</div>
            <div style={{ fontSize: 11, color: "#5a9e6f", fontWeight: 600, marginTop: 4 }}>meals funded</div>
          </div>
          <div style={{background: "#fff8f4", border: "1px solid #fad8c8", borderRadius: 14, padding: "16px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878", marginBottom: 6 }}>All time</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#e8470d", lineHeight: 1 }}>{data?.totalMealsFunded ?? "—"}</div>
            <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 4 }}>meals funded</div>
          </div>
        </div>

        {/* How it works */}
        <div style={{ margin: "0 16px 16px", background: "#f5f0e8", borderRadius: 14, padding: "16px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d", marginBottom: 8 }}>How your subscription helps</div>
          <p style={{ fontSize: 12, color: "#a08060", fontWeight: 600, margin: 0, lineHeight: 1.7 }}>
            A portion of every P&apos;tit Chef subscription goes directly to trusted food partners, including food banks, school meal programs, and community kitchens. We share clear monthly numbers so you can see the real impact of your membership.
          </p>
        </div>

        {/* Partner organizations */}
        {data?.partners && data.partners.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
              Partner organizations
            </div>
            <div style={{ padding: "0 16px" }}>
              {data.partners.map((org) => (
                <div key={org} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>🤝</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{org}</div>
                    <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 1 }}>Verified food partner</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent impact */}
        {data?.recentMetrics && data.recentMetrics.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#c09878" }}>
              Recent impact
            </div>
            <div style={{ padding: "0 16px" }}>
              {data.recentMetrics.map((m) => (
                <div key={`${m.month}-${m.partnerOrg}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#fff", border: "1px solid #f0e8de", borderRadius: 12, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#3a1f0d" }}>{m.partnerOrg}</div>
                    <div style={{ fontSize: 11, color: "#c09878", fontWeight: 600, marginTop: 2 }}>
                      {m.region} · {formatMonth(m.month)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#2d6a3f" }}>{m.mealsFunded}</div>
                    <div style={{ fontSize: 10, color: "#7ab88a", fontWeight: 700 }}>meals funded</div>
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
