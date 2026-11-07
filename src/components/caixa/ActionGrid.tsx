import { Plus } from "lucide-react";
import { TIPOS, type Categoria, type TipoLancamento } from "@/lib/caixa";
import { CATEGORIA_TILE, TIPO_ICON } from "./icons";

const GRUPOS: { categorias: Categoria[]; titulo: string }[] = [
  { categorias: ["venda"], titulo: "Recebimentos" },
  { categorias: ["desconto", "saida"], titulo: "Ajustes e saídas" },
];

export function ActionGrid({ onSelect }: { onSelect: (tipo: TipoLancamento) => void }) {
  return (
    <section className="animate-rise rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6 [animation-delay:60ms]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-muted-foreground">Ações do caixa</p>
          <h2 className="font-display text-2xl font-bold tracking-tight">Novo lançamento</h2>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Toque em uma forma de pagamento para registrar
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {GRUPOS.map((g) => {
          const tipos = TIPOS.filter((t) => g.categorias.includes(t.categoria) && t.id !== "dinheiro");
          return (
            <div key={g.titulo}>
              <p className="eyebrow mb-2.5 text-muted-foreground/80">{g.titulo}</p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
                {tipos.map((t) => {
                  const Icon = TIPO_ICON[t.id];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelect(t.id)}
                      className="group relative flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0"
                    >
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${CATEGORIA_TILE[t.categoria]}`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold leading-tight">{t.label}</span>
                        <span className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">
                          {t.descricao}
                        </span>
                      </span>
                      <Plus className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
