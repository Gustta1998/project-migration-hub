import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, LockKeyholeOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/caixa/AppHeader";
import { modoTesteAtivo } from "@/lib/modo-teste";
import { TurnoCard } from "@/components/caixa/TurnoCard";
import { ActionGrid } from "@/components/caixa/ActionGrid";
import { NotasAutorizadas } from "@/components/caixa/NotasAutorizadas";
import { ResumoPanel } from "@/components/caixa/ResumoPanel";
import { LancamentoDialog } from "@/components/caixa/LancamentoDialog";
import { AberturaCaixa } from "@/components/caixa/abertura/AberturaCaixa";
import { FechamentoCaixaTela } from "@/components/caixa/fechamento/FechamentoCaixaTela";
import { arquivarFechamento, carregarFechamentos, type FechamentoCaixa, type TurnoFechado } from "@/lib/fechamento";
import {
  calcularResumo,
  confirmarAbastecimento,
  notasEmAberto,
  desfazerAbastecimento,
  NOTAS,
  TURNO,
  type Lancamento,
  type NotaAutorizada,
  type TipoLancamento,
} from "@/lib/caixa";
import {
  carregarSessao,
  CHAVE_SESSAO,
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
  const [ultimoFechamento, setUltimoFechamento] = useState<TurnoFechado | null>(null);

  useEffect(() => {
    setSessao(carregarSessao());
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (carregado && sessao) salvarSessao(sessao);
  }, [carregado, sessao]);

  const abrir = useCallback((abertura: Abertura) => {
    const anterior = carregarFechamentos()[0];
    const notas = anterior ? notasEmAberto(anterior.sessao.notas) : NOTAS;
    setUltimoFechamento(null);
    setSessao({ versao: 1, abertura, lancamentos: [], notas });
  }, []);

  const reiniciarTeste = useCallback(() => {
    // Disponível apenas no servidor de desenvolvimento; nunca em build de produção.
    if (!modoTesteAtivo()) return;
    try {
      window.localStorage.removeItem(CHAVE_SESSAO);
    } catch {
      // Sem persistência, o estado em memória também precisa ser limpo.
    }
    setUltimoFechamento(null);
    setSessao(null);
  }, []);

  const confirmarFechamento = useCallback((s: SessaoCaixa, fechamento: FechamentoCaixa) => {
    const registro: TurnoFechado = { id: crypto.randomUUID(), sessao: s, fechamento };
    if (!arquivarFechamento(registro)) return false;
    try { window.localStorage.removeItem(CHAVE_SESSAO); } catch { /* Arquivo de fechamento já salvo */ }
    setUltimoFechamento(registro);
    setSessao(null);
    return true;
  }, []);

  if (!carregado) return <div className="min-h-screen" />;
  if (ultimoFechamento) {
    const conferencia = ultimoFechamento.fechamento.conferencia;
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-lift">
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
          <h1 className="mt-4 font-display text-3xl font-extrabold">Caixa fechado com sucesso!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {ultimoFechamento.sessao.abertura.frentista} · {ultimoFechamento.sessao.abertura.data}
          </p>
          <div className="mt-5 space-y-2 rounded-2xl border border-border bg-secondary/40 p-4 text-left text-sm">
            <p>Dinheiro: <strong>{conferencia.situacaoDinheiro === "certo" ? "Tudo certo" :
              conferencia.situacaoDinheiro === "faltando" ? "Faltando" : "Sobrando"}</strong></p>
            <p>Bombas: <strong>{conferencia.situacaoBombas === "certo" ? "Conferidas" : "Divergência registrada"}</strong></p>
            <p className="text-xs text-muted-foreground">Fechamento armazenado no histórico local deste navegador.</p>
          </div>
          <button type="button" onClick={() => setUltimoFechamento(null)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-total px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:brightness-110">
            <LockKeyholeOpen className="h-4 w-4" />
            Voltar à abertura do próximo caixa
          </button>
        </div>
      </div>
    );
  }
  if (!sessao) return <AberturaCaixa posto={TURNO.posto} onAberto={abrir} />;
  return <Pdv sessao={sessao} setSessao={setSessao}
    onFechar={(f) => confirmarFechamento(sessao, f)}
    onReiniciarTeste={reiniciarTeste} />;
}

function Pdv({
  sessao,
  setSessao,
  onFechar,
  onReiniciarTeste,
}: {
  sessao: SessaoCaixa;
  setSessao: React.Dispatch<React.SetStateAction<SessaoCaixa | null>>;
  onFechar: (fechamento: FechamentoCaixa) => boolean;
  onReiniciarTeste: () => void;
}) {
  const { abertura, lancamentos, notas } = sessao;
  const precos = abertura.precos;
  const [tipoAberto, setTipoAberto] = useState<TipoLancamento | null>(null);
  const [emFechamento, setEmFechamento] = useState(false);
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

  if (emFechamento) return (
    <FechamentoCaixaTela
      sessao={sessao}
      onVoltar={() => setEmFechamento(false)}
      onConfirmar={onFechar}
    />
  );

  return (
    <div className="min-h-screen">
      <AppHeader posto={TURNO.posto} onReiniciarTeste={onReiniciarTeste} />

      <main className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <TurnoCard
            posto={TURNO.posto}
            frentista={abertura.frentista}
            turno={turnoInfo(abertura.turno).descricao}
            data={abertura.data}
            trocoInicial={abertura.trocoInicial}
            precos={precos}
            onFecharCaixa={() => setEmFechamento(true)}
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
