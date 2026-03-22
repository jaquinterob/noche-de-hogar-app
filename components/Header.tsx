import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/planificar", label: "Planificar" },
  { href: "/familia", label: "Familia" },
  { href: "/agendas", label: "Agendas" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Noche de Hogar
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-2 py-1 text-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
