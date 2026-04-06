import type { Metadata } from "next";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = { title: "PrepPlate", description: "Cook smarter, waste less, and help fight hunger" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#fff8f4", fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", background: "#fff", minHeight: "100vh" }}>{children}</div>
        <NavBar />
      </body>
    </html>
  );
}
