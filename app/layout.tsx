import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "P'tit Chef",
  description: "Eat smart. Save more. Share more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#fff8f4", fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", background: "#fff", minHeight: "100vh" }}>
          {children}
        </div>
        <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #f0e8de", display: "flex", zIndex: 100 }}>
          <NavItem href="/home" label="Home" />
          <NavItem href="/pantry" label="Pantry" />
          <NavItem href="/meals" label="My Meals" />
          <NavItem href="/trending" label="Trending" />
          <NavItem href="/settings" label="Settings" />
        </nav>
      </body>
    </html>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  const icons: Record<string, string> = {
    "/home": "H",
    "/pantry": "P",
    "/meals": "M",
    "/trending": "T",
    "/settings": "S",
  };
  return (
    <Link
      href={href}
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0 10px", textDecoration: "none", color: "#c09878", fontSize: 9, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}
    >
      <span style={{ fontSize: 14, fontWeight: 800 }}>{icons[href]}</span>
      <span>{label}</span>
    </Link>
  );
}
