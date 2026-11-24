import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export const SITE_NAME = "Eletrogestão";

const links = [
  { to: "/", label: "O tema" },
  { to: "/formulas", label: "Fórmulas" },
  { to: "/simulador", label: "Simulador" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-sm bg-ink text-electric">
            <Zap className="size-4" fill="currentColor" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">{SITE_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: true }}
              className="rounded-sm px-3 py-2 text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:font-semibold data-[status=active]:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm md:flex-row md:items-center md:justify-between">
        <p className="font-display text-base font-bold">{SITE_NAME}</p>
        <p className="text-ink-foreground/70">
          A importância do eletromagnetismo na administração de empresas.
        </p>
        <p className="tabular text-xs text-electric">E = (P × t) / 1000</p>
      </div>
    </footer>
  );
}
