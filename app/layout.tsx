import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import { clientConfig } from "@/config/client";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: `${clientConfig.businessName} — Dashboard`,
  description: `Panel de control de flota para ${clientConfig.businessName}.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body
        className="min-h-screen bg-[#F5F2EA] font-sans text-stone-900 antialiased"
        style={
          {
            "--color-primary": clientConfig.primaryColor,
            "--color-secondary": clientConfig.secondaryColor,
            "--color-accent": clientConfig.accentColor,
            "--color-forest": clientConfig.forestColor,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
