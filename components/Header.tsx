import { clientConfig } from "@/config/client";
import MountainDivider from "./MountainDivider";
import NavTabs from "./NavTabs";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-stone-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={clientConfig.logoUrl}
          alt={clientConfig.logoAlt}
          className="h-12 w-auto max-w-[12rem] shrink-0 object-contain sm:h-14"
        />
        <div className="min-w-0 border-l border-stone-300 pl-3">
          <h1 className="truncate font-display text-xl font-bold uppercase tracking-wide text-brand-accent sm:text-2xl">
            {clientConfig.businessName}
          </h1>
          <p className="text-sm text-stone-500">Panel de control de flota</p>
        </div>
        <div className="ml-auto">
          <NavTabs />
        </div>
      </div>
      <MountainDivider />
    </header>
  );
}
