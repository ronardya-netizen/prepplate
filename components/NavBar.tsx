"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLang } from "@/lib/i18n";

export default function NavBar() {
  const [lang, setLang] = useState<"en" | "fr">("en");

  useEffect(() => {
    setLang(getLang());
  }, []);

  const labels = {
    en: { home: "Home", pantry: "Pantry", plan: "Plan", profile: "Profile" },
    fr: { home: "Accueil", pantry: "Garde-manger", plan: "Planifier", profile: "Profil" },
  };

  const l = labels[lang];

  return (
    <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #f0e8de", display: "flex", zIndex: 100 }}>
      <Link href="/home" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0 10px", textDecoration: "none", color: "#c09878", fontSize: 9, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>{l.home}</span>
      </Link>
      <Link href="/pantry" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0 10px", textDecoration: "none", color: "#c09878", fontSize: 9, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        <span>{l.pantry}</span>
      </Link>
      <Link href="/plan" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0 10px", textDecoration: "none", color: "#c09878", fontSize: 9, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
        <span>{l.plan}</span>
      </Link>
      <Link href="/profile" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0 10px", textDecoration: "none", color: "#c09878", fontSize: 9, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>{l.profile}</span>
      </Link>
    </nav>
  );
}

