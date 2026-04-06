import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "PrepPlate", description: "Cook smarter, waste less, and help fight hunger" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="PrepPlate" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#e8470d" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#fff8f4", fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", background: "#fff", minHeight: "100vh" }}>{children}</div>
        <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #f0e8de", display: "flex", zIndex: 100 }}>
          <NavItem href="/home" label="Home" />
          <NavItem href="/pantry" label="Pantry" />
          <NavItem href="/discover" label="Discover" />
          <NavItem href="/plan" label="Plan" />
          <NavItem href="/profile" label="Profile" />
        </nav>
      </body>
    </html>
  );
}
function NavItem({ href, label }: { href: string; label: string }) {
  const icons: Record<string, string> = { "/home": "house", "/pantry": "basket", "/plan": "cart", "/discover": "search", "/profile": "person" };
  const svgs: Record<string, string> = {
    house: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
    basket: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0",
    cart: "M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z M8 6h8 M8 10h8 M8 14h4",
    search: "M21 21l-4.35-4.35 M11 19A8 8 0 1011 3a8 8 0 000 16z",
    person: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  };
  const key = icons[href] ?? "house";
  return (
    <Link href={href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0 10px", textDecoration: "none", color: "#c09878", fontSize: 9, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{svgs[key].split(" M").map((d, i) => <path key={i} d={i === 0 ? d : "M" + d} />)}</svg>
      <span>{label}</span>
    </Link>
  );
}