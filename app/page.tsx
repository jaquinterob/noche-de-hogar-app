import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bienvenido
        </h1>
        <p className="mt-3 text-muted leading-relaxed">
          Planifica la Noche de Hogar en un asistente guiado, elige himnos con
          enlace al sitio oficial y, el día de la reunión, sigue el checklist
          en familia.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {[
          { href: "/planificar", t: "Planificar", d: "Asistente de 11 pasos" },
          { href: "/agendas", t: "Agendas", d: "Planes e histórico" },
          { href: "/familia", t: "Familia", d: "Miembros de la familia" },
        ].map((x) => (
          <li key={x.href}>
            <Link
              href={x.href}
              className="block rounded-xl border border-border bg-card p-4 transition hover:border-neutral-400 dark:hover:border-neutral-500"
            >
              <span className="font-semibold text-foreground">{x.t}</span>
              <p className="mt-1 text-sm text-muted">{x.d}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
