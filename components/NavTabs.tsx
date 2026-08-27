"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Autos" },
  { href: "/clientes", label: "Clientes" },
] as const;

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {TABS.map((tab) => {
        const activo = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide transition ${
              activo
                ? "bg-brand-primary text-brand-accent"
                : "text-stone-500 hover:bg-stone-200/70 hover:text-stone-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
