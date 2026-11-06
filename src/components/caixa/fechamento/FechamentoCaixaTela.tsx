import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, BadgeCheck, CheckCircle2, ClipboardCheck, Droplet, Gauge, LockKeyhole, Wallet, AlertTriangle } from "lucide-react";
import { formatBRL, formatDataHora, formatLitros, tipoInfo, TIPOS, type Lancamento } from "@/lib/caixa";
import { parseNumeroBR, turnoInfo, type SessaoCaixa } from "@/lib/abertura";
import {
  conferirCaixa, dinheiroEsperado, leiturasVazias, validarLeiturasFinais,
  type FechamentoCaixa, type LeiturasTexto,
} from "@/lib/fechamento";

interface Props {
  sessao: SessaoCaixa;
  onVoltar: () => void;
  onConfirmar: (fechamento: FechamentoCaixa) => boolean;
}

const campo = "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 font-display font-bold num outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30";
const painel = "rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6";
const formatDelta = (n: number, suffix = "") => (n > 0 ? "+" : "") + n.toLocaleString("pt-BR", { maximumFractionDigits: 3, minimumFractionDigits: suffix === " L" ? 3 : 2 }) + suffix;

export function FechamentoCaixaTela({ sessao, onVoltar, onConfirmar }: Props) {
  const [finaisTexto, setFinaisTexto] = useState<LeiturasTexto>(leiturasVazias);
  const [contadoTexto, setContadoTexto] = useState("");
  const [observacao, setObservacao] = useState("");
  const [confirmou, setConfirmou] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const leituras = validarLeiturasFinais(finaisTexto, sessao.abertura.leituras);
  const contado = parseNumeroBR(contadoTexto);
  const conferencia = useMemo(() => leituras.ok && contado !== null
    ? conferirCaixa(sessao, leituras.valores, contado) : null,
    [sessao, finaisTexto, contadoTexto]);
  const resumo = conferencia?.resumo;
  const sumario = useMemo(() => {
    const itens = new Map<string, { valor: number; qtd: number }>();
    for (const l of sessao.lancamentos) {
      const atual = itens.get(l.tipo) ?? { valor: 0, qtd: 0 };
      atual.valor += l.valor;
      atual.qtd++;
      itens.set(l.tipo, atual);
    }
    return TIPOS.filter(t => itens.has(t.id)).map(t => ({ ...t, ...itens.get(t.id)! }));
  }, [sessao.lancamentos]);

  const setLeitura = (combustivel: "gasolina" | "diesel", bomba: "bomba1" | "bomba2", valor: string) => {
    setFinaisTexto(old => ({
      ...old,
      [combustivel]: { ...old[combustivel], [bomba]: valor.replace(/[^\d.,]/g, "") },
    }));
    setConfirmou(false);
    setErros([]);
  };

  const submeter = (e: FormEvent) => {
    e.preventDefault();
    const problemas = !leituras.ok ? [...leituras.erros] : [];
    if (contado === null || !Number.isFinite(contado) || contado < 0) {
      problemas.push("Informe o dinheiro contado no caixa (pode ser R$ 0,00).");
    }
    if (!confirmou) problemas.push("Confirme que revisou todas as informações.");
    if (problemas.length || !leituras.ok || contado === null) {
      setErros(problemas);
      return;
    }
    const conferenciaFinal = conferirCaixa(sessao, leituras.valores, contado);
    setSalvando(true);
    const ok = onConfirmar({
      fechadoEm: new Date().toISOString(),
      leiturasFinais: leituras.valores,
      dinheiroContado: contado,
      observacao: observacao.trim(),
      conferencia: conferenciaFinal,
    });
    if (!ok) {
      setSalvando(false);
      setErros(["Não foi possível salvar o fechamento. O caixa permanece aberto; confira o armazenamento do navegador."]);
    }
  };

  const situacaoDinheiro = conferencia?.situacaoDinheiro;
  const situacaoBombas = conferencia?.situacaoBombas;

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onVoltar} aria-label="Voltar ao caixa"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border transition-colors hover:bg-secondary">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="eyebrow text-muted-foreground">Posto Almeida · Caixa da pista</p>
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Fechamento do caixa</h1>
            </div>
          </div>
          <span className="rounded-full bg-warning-soft px-3 py-1.5 text-xs font-bold text-warning-foreground">Conferência do turno</span>
        </div>
      </div>

      <form onSubmit={submeter} className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6">
        <div className="rounded-3xl bg-hero p-6 text-ink-foreground shadow-lift">
          <p className="eyebrow text-ink-muted">Resumo do turno</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold">{sessao.abertura.frentista}</h2>
          <p className="mt-1 text-sm text-ink-muted">{turnoInfo(sessao.abertura.turno).descricao} · {sessao.abertura.data}</p>
          <p className="mt-1 text-xs text-ink-muted">Aberto em {formatDataHora(sessao.abertura.abertoEm)}</p>
          <p className="mt-4 text-sm text-ink-muted">Confira as leituras e o dinheiro. Nenhum lançamento será perdido se voltar ao PDV antes de confirmar.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className={painel}>
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl font-bold">Leituras finais das bombas</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Digite os totalizadores finais de cada bomba, sem reduzir a leitura inicial.</p>
            {(["gasolina", "diesel"] as const).map(c => (
              <div key={c} className="mb-5 last:mb-0">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                  <Droplet fill="currentColor" className={"h-4 w-4 " + (c === "gasolina" ? "text-gasolina" : "text-diesel")} />
                  {c === "gasolina" ? "Gasolina" : "Diesel"}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {(["bomba1", "bomba2"] as const).map((b, i) => (
                    <label key={b} className="block rounded-2xl border border-border bg-secondary/30 p-3">
                      <span className="eyebrow text-muted-foreground">Bomba {i + 1}</span>
                      <span className="mb-2 mt-1 block text-xs text-muted-foreground num">
                        Inicial: {sessao.abertura.leituras[c][b].toLocaleString("pt-BR", { maximumFractionDigits: 3 })}
                      </span>
                      <input required inputMode="decimal" placeholder="Leitura final"
                        aria-label={"Leitura final " + c + " bomba " + (i + 1)}
                        value={finaisTexto[c][b]}
                        onChange={e => setLeitura(c, b, e.target.value)}
                        className={campo} />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className={painel}>
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl font-bold">Conferência do dinheiro</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Info label="Troco inicial" value={formatBRL(sessao.abertura.trocoInicial)} />
              <Info label="Dinheiro esperado (estimado)" value={formatBRL(dinheiroEsperado(sessao))} />
            </div>
            <p className="my-4 text-xs leading-relaxed text-muted-foreground">
              Estimativa = troco inicial + recebimentos em Dinheiro − sangrias − despesas monetárias identificadas.
              Pix, cartões e notas a prazo não entram na contagem física.
              Confira se as retiradas realmente saíram em dinheiro antes de concluir.
            </p>
            <label className="block">
              <span className="eyebrow text-muted-foreground">Dinheiro contado no fechamento</span>
              <div className="mt-1.5 flex items-center rounded-2xl border border-input bg-background px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
                <span className="font-display text-xl font-bold text-muted-foreground">R$</span>
                <input required inputMode="decimal" placeholder="0,00" value={contadoTexto}
                  onChange={e => { setContadoTexto(e.target.value.replace(/[^\d.,]/g, "")); setConfirmou(false); }}
                  className="w-full bg-transparent px-2 py-3 font-display text-3xl font-bold num outline-none" />
              </div>
            </label>
            {conferencia && (
              <div className={"mt-4 rounded-2xl border p-4 " +
                (situacaoDinheiro === "certo" ? "border-success/30 bg-success-soft text-success"
                  : "border-warning/30 bg-warning-soft text-warning-foreground")}>
                <p className="text-sm font-bold">Dinheiro: {situacaoDinheiro === "certo" ? "Tudo certo" : situacaoDinheiro === "faltando" ? "Faltando" : "Sobrando"}</p>
                <p className="mt-1 font-display text-2xl font-bold num">{formatBRL(Math.abs(conferencia.diferencaDinheiro))}</p>
              </div>
            )}
          </section>
        </div>

        <section className={painel}>
          <div className="mb-4 flex items-center gap-2">
            <Droplet className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold">Conferência dos combustíveis</h2>
          </div>
          {!leituras.ok ? (
            <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">Preencha as quatro leituras finais para visualizar a diferença entre os totalizadores e os abastecimentos registrados.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(["gasolina", "diesel"] as const).map(c => {
                const medido = (leituras.valores[c].bomba1 - sessao.abertura.leituras[c].bomba1) +
                  (leituras.valores[c].bomba2 - sessao.abertura.leituras[c].bomba2);
                const lancados = sessao.lancamentos.filter(l => l.combustivel === c &&
                  (tipoInfo(l.tipo).categoria === "venda" || l.tipo === "despesas"))
                  .reduce((s, l) => s + (typeof l.litros === "number" ? l.litros : l.valor / sessao.abertura.precos[c]), 0);
                const delta = Math.round((medido - lancados) * 1000) / 1000;
                return (
                  <div key={c} className="rounded-2xl border border-border bg-secondary/30 p-4">
                    <p className="font-display text-xl font-bold">{c === "gasolina" ? "Gasolina" : "Diesel"}</p>
                    <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                      <span>Medido nas bombas: <b className="num">{formatLitros(medido)}</b></span>
                      <span>Registrado: <b className="num">{formatLitros(lancados)}</b></span>
                    </div>
                    <p className={"mt-3 font-display text-lg font-bold " + (Math.abs(delta) < 0.001 ? "text-success" : "text-warning-foreground")}>
                      {Math.abs(delta) < 0.001 ? "Conferido · 0,000 L" :
                        (delta > 0 ? "Faltam lançamentos: " : "Lançamentos excedem bomba: ") + formatLitros(Math.abs(delta))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          {conferencia && (
            <p className={"mt-3 text-sm font-bold " + (situacaoBombas === "certo" ? "text-success" : "text-warning-foreground")}>
              {situacaoBombas === "certo" ? "Leituras e registros de combustível conferem." : "Há divergência nos litros. Verifique os lançamentos antes de confirmar."}
            </p>
          )}
        </section>

        <section className={painel}>
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold">Resumo financeiro completo</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Info label="Vendas e notas" value={formatBRL(sessao.lancamentos.filter(l => tipoInfo(l.tipo).categoria === "venda").reduce((s,l)=>s+l.valor,0))} />
            <Info label="Descontos" value={formatBRL(sessao.lancamentos.filter(l => l.tipo === "descontos").reduce((s,l)=>s+l.valor,0))} />
            <Info label="Saídas" value={formatBRL(sessao.lancamentos.filter(l => tipoInfo(l.tipo).categoria === "saida").reduce((s,l)=>s+l.valor,0))} />
            <Info label="Total do painel" value={formatBRL(resumo?.total ??
              sessao.lancamentos.filter(l => tipoInfo(l.tipo).categoria === "venda").reduce((s,l)=>s+l.valor,0) -
              sessao.lancamentos.filter(l => l.tipo === "descontos").reduce((s,l)=>s+l.valor,0))} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sumario.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.qtd} lançamento(s)</p>
                </div>
                <p className="font-display font-bold num">{formatBRL(item.valor)}</p>
              </div>
            ))}
            {sumario.length === 0 && <p className="text-sm text-muted-foreground">Nenhum lançamento registrado.</p>}
          </div>
        </section>

        <section className={painel}>
          <h2 className="font-display text-2xl font-bold">Todos os lançamentos do turno</h2>
          <p className="mt-1 text-sm text-muted-foreground">Confira cada registro antes de encerrar. Para corrigir, volte ao PDV.</p>
          <div className="mt-4 max-h-[440px] space-y-2 overflow-y-auto">
            {sessao.lancamentos.map((l: Lancamento) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-bold">{tipoInfo(l.tipo).label} {l.funcionario ? "· " + l.funcionario : ""}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDataHora(l.criadoEm)}
                    {l.combustivel ? " · " + (l.combustivel === "diesel" ? "Diesel" : "Gasolina") +
                      " · " + formatLitros(typeof l.litros === "number" ? l.litros : l.valor / sessao.abertura.precos[l.combustivel]) : ""}
                    {l.modalidade ? " · " + (l.modalidade === "prazo" ? "A prazo" : l.modalidade === "avista" ? "À vista" : l.modalidade) : ""}
                    {l.observacao ? " · " + l.observacao : ""}
                  </p>
                </div>
                <p className="font-display font-bold num">{formatBRL(l.valor)}</p>
              </div>
            ))}
            {sessao.lancamentos.length === 0 && <p className="py-8 text-center text-muted-foreground">Nenhum lançamento no turno.</p>}
          </div>
        </section>

        <section className={painel}>
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold">Confirmação do funcionário</h2>
          </div>
          <label className="mt-4 block">
            <span className="eyebrow text-muted-foreground">Observação do fechamento (opcional)</span>
            <textarea value={observacao} maxLength={500} rows={3} onChange={e => setObservacao(e.target.value)}
              placeholder="Explique qualquer diferença, falta, sobra ou ocorrência do turno…"
              className={campo + " mt-1.5 font-sans font-normal"} />
          </label>
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4">
            <input type="checkbox" checked={confirmou} onChange={e => setConfirmou(e.target.checked)}
              className="mt-1 h-4 w-4 accent-primary" />
            <span className="text-sm font-semibold">Revisei os lançamentos, os valores, o dinheiro contado e as quatro leituras finais. Confirmo o fechamento deste turno, inclusive eventuais divergências apresentadas.</span>
          </label>
          {conferencia && (situacaoDinheiro !== "certo" || situacaoBombas !== "certo") && (
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-warning-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Existem divergências. Elas serão registradas no relatório de fechamento.
            </p>
          )}
          {erros.length > 0 && (
            <div role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
              {erros.map((erro,i) => <p key={i}>{erro}</p>)}
            </div>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onVoltar}
              className="rounded-xl border border-border px-5 py-3 text-sm font-bold transition-colors hover:bg-secondary">
              Voltar e corrigir lançamentos
            </button>
            <button type="submit" disabled={salvando || !confirmou || !leituras.ok || contado === null || contado < 0}
              className="inline-flex items-center gap-2 rounded-xl bg-total px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
              <LockKeyhole className="h-4 w-4" />
              Confirmar e fechar caixa
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-secondary/30 px-4 py-3">
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-display text-xl font-bold num">{value}</p>
    </div>
  );
}
