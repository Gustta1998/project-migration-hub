import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/caixa/AppHeader";
import { TurnoCard } from "@/components/caixa/TurnoCard";
import { ActionGrid } from "@/components/caixa/ActionGrid";
import { NotasAutorizadas } from "@/components/caixa/NotasAutorizadas";
import { ResumoPanel } from "@/components/caixa/ResumoPanel";
import { LancamentoDialog } from "@/components/caixa/LancamentoDialog";
import {
  calcularResumo,
  confirmarAbastecimento,
  desfazerAbastecimento,
  LANCAMENTOS_INICIAIS,
  NOTAS,
  TURNO,
  type Lancamento,
  type NotaAutorizada,
  type TipoLancamento,
} from "@/lib/caixa";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caixa da pista · Posto Almeida" },
      {
        name: "description",
        content: "Painel do turno do frentista: vendas, litros, formas de pagamento e notas.",
      },
      { property: "og:title", content: "Caixa da pista · Posto Almeida" },
      {
        property: "og:description",
        content: "Painel do turno do frentista: vendas, litros, formas de pagamento e notas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Caixa,
});

function Caixa() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(LANCAMENTOS_INICIAIS);
  const [notas, setNotas] = useState<NotaAutorizada[]>(NOTAS);
  const [tipoAberto, setTipoAberto] = useState<TipoLancamento | null>(null);
  const resumo = useMemo(() => calcularResumo(lancamentos, TURNO.precos), [lancamentos]);

  return (
    <div className="min-h-screen">
      <AppHeader posto={TURNO.posto} />

      <main className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <TurnoCard
            posto={TURNO.posto}
            frentista={TURNO.frentista}
            turno={TURNO.turno}
            data={TURNO.data}
            trocoInicial={TURNO.trocoInicial}
            precos={TURNO.precos}
          />
          <ActionGrid onSelect={setTipoAberto} />
          <NotasAutorizadas
            notas={notas}
            onConfirmar={(id) =>
              setNotas((ns) =>
                confirmarAbastecimento(ns, id, TURNO.frentista, new Date().toISOString()),
              )
            }
            onDesfazer={(id) => setNotas((ns) => desfazerAbastecimento(ns, id))}
          />
        </div>

        <div className="min-w-0 lg:sticky lg:top-[84px] lg:self-start">
          <ResumoPanel
            resumo={resumo}
            lancamentos={lancamentos}
            precos={TURNO.precos}
            trocoInicial={TURNO.trocoInicial}
            onRemove={(id) => setLancamentos((ls) => ls.filter((l) => l.id !== id))}
          />
        </div>
      </main>

      <LancamentoDialog
        tipo={tipoAberto}
        precos={TURNO.precos}
        onClose={() => setTipoAberto(null)}
        onSave={(l) => {
          setLancamentos((ls) => [
            { ...l, id: crypto.randomUUID(), criadoEm: new Date().toISOString() },
            ...ls,
          ]);
          setTipoAberto(null);
        }}
      />
    </div>
  );
}
