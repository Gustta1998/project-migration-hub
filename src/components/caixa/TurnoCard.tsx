import { UserRound, Wallet } from "lucide-react";
import { formatBRL, type Precos } from "@/lib/caixa";

interface Props {
  posto: string;
  frentista: string;
  turno: string;
  data: string;
  trocoInicial: number;
  precos: Precos;
}

export function TurnoCard({ posto, frentista, turno, data, trocoInicial, precos }: Props) {
  return (
    <section className="animate-rise overflow-hidden rounded-3xl bg-hero text-ink-foreground shadow-lift">
      <div className="relative px-6 pb-6 pt-6 sm:px-7">
        {/* decorative stripes, like pump signage */}
        <div className="pointer-events-none absolute -right-10 top-0 flex h-full rotate-12 gap-3 opacity-[0.07]">
          <span className="h-full w-6 bg-ink-foreground" />
          <span className="h-full w-3 bg-ink-foreground" />
          <span className="h-full w-1.5 bg-ink-foreground" />
        </div>

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow text-ink-muted">{posto} · Caixa da pista</p>
            <h2 className="mt-1 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Caixa aberto
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {turno} · {data}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3.5 py-1.5 text-xs font-bold text-success">
            <span className="pulse-dot h-2 w-2 rounded-full bg-success" />
            Em operação
          </span>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <InfoTile icon={<UserRound className="h-4 w-4" />} label="Frentista" value={frentista} />
          <InfoTile
            icon={<Wallet className="h-4 w-4" />}
            label="Troco inicial"
            value={formatBRL(trocoInicial)}
          />
          <PriceTile label="Gasolina" price={precos.gasolina} tone="gasolina" />
          <PriceTile label="Diesel" price={precos.diesel} tone="diesel" />
        </div>
      </div>
    </section>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-ink-border bg-ink-foreground/[0.06] p-3.5">
      <div className="flex items-center gap-1.5 text-ink-muted">
        {icon}
        <span className="eyebrow">{label}</span>
      </div>
      <p className="mt-1.5 truncate font-display text-xl font-bold num">{value}</p>
    </div>
  );
}

function PriceTile({
  label,
  price,
  tone,
}: {
  label: string;
  price: number;
  tone: "gasolina" | "diesel";
}) {
  const [int, dec] = price.toFixed(2).split(".");
  const toneCls = tone === "gasolina" ? "bg-gasolina" : "bg-diesel";
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-ink-border bg-ink-foreground/[0.06]">
      <div className="flex items-center justify-between px-3.5 pt-3">
        <span className="eyebrow text-ink-muted">{label}</span>
        <span className={`h-2 w-2 rounded-full ${toneCls}`} />
      </div>
      <p className="px-3.5 pb-3 pt-1 font-display font-extrabold num">
        <span className="text-sm text-ink-muted">R$ </span>
        <span className="text-2xl">{int},</span>
        <span className="text-2xl">{dec}</span>
        <span className="text-sm text-ink-muted">/L</span>
      </p>
      <div className={`h-1 w-full ${toneCls}`} />
    </div>
  );
}
