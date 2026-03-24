import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "P'tit Chef",
  description: "Eat smart. Save money. End hunger.",
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

        {/* Bottom navigation */}
        <nav style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderTop: "1px solid #f0e8de",
          display: "flex",
          zIndex: 100,
        }}>
        <NavItem href="/home"     icon="ðŸ " label="Home" />
        <NavItem href="/pantry"   icon="ðŸ¥¦" label="Pantry" />
        <NavItem href="/meals"    icon="ðŸ”–" label="My Meals" />
        <NavItem href="/trending" icon="ðŸ”¥" label="Trending" />
        <NavItem href="/settings" icon="âš™ï¸" label="Settings" />
        </nav>
      </body>
    </html>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: "8px 0 10px",
        textDecoration: "none",
        color: "#c09878",
        fontSize: 9,
        fontWeight: 700,
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}