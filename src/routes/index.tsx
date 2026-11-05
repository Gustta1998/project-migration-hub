import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/caixa/AppHeader";
import { TurnoCard } from "@/components/caixa/TurnoCard";
import { ActionGrid } from "@/components/caixa/ActionGrid";
import { NotasAutorizadas } from "@/components/caixa/NotasAutorizadas";
import { ResumoPanel } from "@/components/caixa/ResumoPanel";
import { LancamentoDialog } from "@/components/caixa/LancamentoDialog";
import { AberturaCaixa } from "@/components/caixa/abertura/AberturaCaixa";
import {
  calcularResumo,
  confirmarAbastecimento,
  desfazerAbastecimento,
  NOTAS,
  TURNO,
  type Lancamento,
  type NotaAutorizada,
  type TipoLancamento,
} from "@/lib/caixa";
import {
  carregarSessao,
  salvarSessao,
  turnoInfo,
  type AberturaCaixa as Abertura,
  type SessaoCaixa,
} from "@/lib/abertura";

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
  const [carregado, setCarregado] = useState(false);
  const [sessao, setSessao] = useState<SessaoCaixa | null>(null);

  useEffect(() => {
    setSessao(carregarSessao());
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (carregado && sessao) salvarSessao(sessao);
  }, [carregado, sessao]);

  const abrir = useCallback((abertura: Abertura) => {
    setSessao({ versao: 1, abertura, lancamentos: [], notas: NOTAS });
  }, []);

  if (!carregado) return <div className="min-h-screen" />;
  if (!sessao) return <AberturaCaixa posto={TURNO.posto} onAberto={abrir} />;
  return <Pdv sessao={sessao} setSessao={setSessao} />;
}

function Pdv({
  sessao,
  setSessao,
}: {
  sessao: SessaoCaixa;
  setSessao: React.Dispatch<React.SetStateAction<SessaoCaixa | null>>;
}) {
  const { abertura, lancamentos, notas } = sessao;
  const precos = abertura.precos;
  const [tipoAberto, setTipoAberto] = useState<TipoLancamento | null>(null);
  const [notaRegistrada, setNotaRegistrada] = useState(false);
  useEffect(() => {
    if (!notaRegistrada) return;
    const timer = window.setTimeout(() => setNotaRegistrada(false), 1450);
    return () => window.clearTimeout(timer);
  }, [notaRegistrada]);
  const resumo = useMemo(() => calcularResumo(lancamentos, precos), [lancamentos, precos]);

  const setLancamentos = (fn: (ls: Lancamento[]) => Lancamento[]) =>
    setSessao((s) => (s ? { ...s, lancamentos: fn(s.lancamentos) } : s));
  const setNotas = (fn: (ns: NotaAutorizada[]) => NotaAutorizada[]) =>
    setSessao((s) => (s ? { ...s, notas: fn(s.notas) } : s));

  return (
    <div className="min-h-screen">
      <AppHeader posto={TURNO.posto} />

      <main className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <TurnoCard
            posto={TURNO.posto}
            frentista={abertura.frentista}
            turno={turnoInfo(abertura.turno).descricao}
            data={abertura.data}
            trocoInicial={abertura.trocoInicial}
            precos={precos}
          />
          <ActionGrid onSelect={setTipoAberto} />
          <NotasAutorizadas
            notas={notas}
            onConfirmar={(id) =>
              setNotas((ns) =>
                confirmarAbastecimento(ns, id, abertura.frentista, new Date().toISOString()),
              )
            }
            onDesfazer={(id) => setNotas((ns) => desfazerAbastecimento(ns, id))}
          />
        </div>

        <div className="min-w-0 lg:sticky lg:top-[84px] lg:self-start">
          <ResumoPanel
            resumo={resumo}
            lancamentos={lancamentos}
            precos={precos}
            trocoInicial={abertura.trocoInicial}
            onRemove={(id) => setLancamentos((ls) => ls.filter((l) => l.id !== id))}
          />
        </div>
      </main>

      <LancamentoDialog
        tipo={tipoAberto}
        precos={precos}
        onClose={() => setTipoAberto(null)}
        onSave={(l) => {
          setLancamentos((ls) => [
            { ...l, id: crypto.randomUUID(), criadoEm: new Date().toISOString() },
            ...ls,
          ]);
          setTipoAberto(null);
          if (l.tipo === "notas" || l.tipo === "cliente_outras_notas") {
            setNotaRegistrada(true);
          }
        }}
      />
      {notaRegistrada && (
        <div className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-foreground/25 px-4">
          <div role="status" className="animate-rise flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-10 py-8 text-center shadow-lift">
            <CheckCircle2 className="h-14 w-14 text-success" />
            <p className="font-display text-2xl font-bold">Registrado com sucesso!</p>
          </div>
        </div>
      )}
    </div>
  );
}
