import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Queue — Tattoo Shop",
  description: "Digital kiosk & queue",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-black text-white">
      <body className="min-h-screen antialiased font-sans flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="py-3 text-center">
          <a
            href="/dashboard"
            className="text-xs text-white/40 hover:text-white/70"
          >
            Staff
          </a>
        </footer>
      </body>
    </html>
  );
}
