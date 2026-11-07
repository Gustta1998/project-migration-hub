import { useMemo, useState } from "react";
import {
  ArrowLeft, CheckCircle2, ClipboardCheck, Fuel, LockKeyhole,
  MinusCircle, Plus, ShoppingBasket, Wallet, AlertTriangle,
} from "lucide-react";
import {
  calcularResumo, formatBRL, formatLitros,
  type Lancamento, type TipoLancamento,
} from "@/lib/caixa";
import { parseNumeroBR, turnoInfo, type SessaoCaixa } from "@/lib/abertura";
import {
  conferirCaixa, dinheiroEsperado, giroMedido, leiturasVazias, validarLeiturasFinais,
  type FechamentoCaixa, type LeiturasTexto,
} from "@/lib/fechamento";

interface Props {
  sessao: SessaoCaixa;
  onVoltar: () => void;
  onConfirmar: (fechamento: FechamentoCaixa) => boolean;
  onAdicionarSangria: (valor: number, descricao: string) => void;
}

const normal = "rounded-xl border border-input bg-background px-3 py-2 font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30";
const real = (valor: number) => formatBRL(Math.round(valor * 100) / 100);
const faixaTitulo = "flex items-center gap-2 rounded-t-2xl bg-hero px-4 py-3 text-ink-foreground";
const categorias: { tipo: TipoLancamento; titulo: string }[] = [
  { tipo: "sangria", titulo: "Sangrias" },
  { tipo: "pix_maquininha", titulo: "Pix maquininha" },
  { tipo: "pix_manual", titulo: "Pix manual" },
  { tipo: "cartoes", titulo: "Cartões" },
  { tipo: "descontos", titulo: "Descontos" },
  { tipo: "notas", titulo: "Notas" },
];

const nomeLancamento = (l: Lancamento) => {
  if (l.tipo === "cartoes") return l.modalidade === "debito" ? "Débito" : "Crédito";
  if (l.tipo === "notas" || l.tipo === "cliente_outras_notas")
    return [l.responsavel, l.destinoNota].filter(Boolean).join(" · ") || "Nota";
  return l.observacao || (l.combustivel ? l.combustivel : "");
};

export function FechamentoCaixaTela({ sessao, onVoltar, onConfirmar, onAdicionarSangria }: Props) {
  const [textoLeituras, setTextoLeituras] = useState<LeiturasTexto>(leiturasVazias);
  const [contadoTexto, setContadoTexto] = useState("");
  const [sangriaTexto, setSangriaTexto] = useState("");
  const [descricaoSangria, setDescricaoSangria] = useState("Depósito");
  const [observacao, setObservacao] = useState("");
  const [revisado, setRevisado] = useState(false);
  const [erro, setErro] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const leituras = validarLeiturasFinais(textoLeituras, sessao.abertura.leituras);
  const contado = parseNumeroBR(contadoTexto);
  const giro = leituras.ok ? giroMedido(sessao.abertura.leituras, leituras.valores) : null;
  const esperado = leituras.ok ? dinheiroEsperado(sessao, leituras.valores) : null;
  const conferencia = useMemo(
    () => leituras.ok && contado !== null && contado >= 0
      ? conferirCaixa(sessao, leituras.valores, contado) : null,
    [sessao, textoLeituras, contadoTexto],
  );
  const resumo = useMemo(
    () => calcularResumo(sessao.lancamentos, sessao.abertura.precos),
    [sessao.lancamentos, sessao.abertura.precos],
  );

  const produtos = useMemo(() => {
    const mapa = new Map<string, { nome: string; qtd: number; valor: number }>();
    for (const l of sessao.lancamentos.filter(l => l.tipo === "produto_posto")) {
      const chave = l.produtoId || l.produtoNome || l.id;
      const anterior = mapa.get(chave) || { nome: l.produtoNome || "Produto", qtd: 0, valor: 0 };
      anterior.qtd += l.quantidadeProduto || 1;
      anterior.valor += l.valor;
      mapa.set(chave, anterior);
    }
    return [...mapa.values()];
  }, [sessao.lancamentos]);

  const listaTipo = (tipo: TipoLancamento) =>
    sessao.lancamentos.filter(l => tipo === "notas"
      ? l.tipo === "notas" || l.tipo === "cliente_outras_notas"
      : l.tipo === tipo);

  const registrarSangria = () => {
    const valor = parseNumeroBR(sangriaTexto);
    if (valor === null || valor <= 0 || !Number.isFinite(valor)) {
      setErro(["Informe um valor de sangria maior que zero."]);
      return;
    }
    if (valor > 999999999) {
      setErro(["Informe uma sangria dentro do limite permitido."]);
      return;
    }
    onAdicionarSangria(Math.round(valor * 100) / 100, descricaoSangria.trim() || "Última sangria");
    setSangriaTexto("");
    setDescricaoSangria("Depósito");
    setRevisado(false);
    setErro([]);
  };

  const atualizarLeitura = (c: "gasolina" | "diesel", b: "bomba1" | "bomba2", texto: string) => {
    setTextoLeituras(prev => ({
      ...prev, [c]: { ...prev[c], [b]: texto.replace(/[^\d.,]/g, "") },
    }));
    setRevisado(false);
    setErro([]);
  };

  const finalizar = () => {
    const problemas = leituras.ok ? [] : [...leituras.erros];
    if (contado === null || contado < 0 || !Number.isFinite(contado))
      problemas.push("Informe o valor contado no Caixa.");
    if (!revisado) problemas.push("Confirme que revisou o fechamento.");
    if (problemas.length || !leituras.ok || contado === null) {
      setErro(problemas);
      return;
    }
    setSalvando(true);
    const ok = onConfirmar({
      fechadoEm: new Date().toISOString(),
      leiturasFinais: leituras.valores,
      dinheiroContado: contado,
      observacao: observacao.trim(),
      conferencia: conferirCaixa(sessao, leituras.valores, contado),
    });
    if (!ok) {
      setSalvando(false);
      setErro(["Falha ao salvar. O caixa continua aberto e seus lançamentos foram mantidos."]);
    }
  };

  const soma = (tipo: TipoLancamento) => listaTipo(tipo).reduce((v, l) => v + l.valor, 0);
  const vendidoGasolina = resumo.valorGasolina;
  const vendidoDiesel = resumo.valorDiesel;

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-total text-primary-foreground"><Fuel className="h-6 w-6" /></span>
            <div>
              <p className="eyebrow text-muted-foreground">Posto Almeida</p>
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Fechamento do Caixa</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <span className="rounded-full bg-secondary px-4 py-2">Data: {sessao.abertura.data}</span>
            <span className="rounded-full bg-secondary px-4 py-2">{turnoInfo(sessao.abertura.turno).descricao}</span>
            <span className="rounded-full bg-secondary px-4 py-2">Frentista: {sessao.abertura.frentista}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-6">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] table-fixed border-collapse text-sm">
              <thead>
                <tr className="bg-hero text-ink-foreground">
                  {categorias.map(c => <th key={c.tipo} className="border-r border-ink-border px-3 py-3 text-center font-bold last:border-r-0">{c.titulo}</th>)}
                  <th className="px-3 py-3 text-center font-bold">Total por categoria</th>
                </tr>
              </thead>
              <tbody>
                <tr className="align-top">
                  {categorias.map(c => (
                    <td key={c.tipo} className="h-40 border-r border-b border-border p-2 align-top last:border-r-0">
                      <div className="max-h-44 space-y-1 overflow-y-auto">
                        {listaTipo(c.tipo).length === 0 && <p className="py-2 text-center text-muted-foreground">—</p>}
                        {listaTipo(c.tipo).map(l => (
                          <div key={l.id} className="border-b border-border/60 py-1.5 text-center last:border-0">
                            <p className="font-bold num">{real(l.valor)}</p>
                            <p className="break-words text-xs text-muted-foreground">{nomeLancamento(l)}</p>
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                  <td className="border-b border-border bg-primary-soft p-3 text-center align-middle">
                    <p className="eyebrow text-muted-foreground">Vendas e notas</p>
                    <p className="mt-1 font-display text-2xl font-bold num">{real(resumo.totalVendas - soma("produto_posto"))}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Produtos separados abaixo</p>
                  </td>
                </tr>
                <tr className="bg-hero text-ink-foreground">
                  {categorias.map(c => (
                    <td key={c.tipo} className="border-r border-ink-border px-2 py-2.5 text-center font-display font-bold num">
                      {real(soma(c.tipo))}
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-center font-bold">Resumo do turno</td>
                </tr>
                <tr className="text-xs text-muted-foreground">
                  {categorias.map(c => <td key={c.tipo} className="border-r border-border px-2 py-2 text-center">
                    {listaTipo(c.tipo).length} lançamento(s)
                    {c.tipo === "cartoes" && (
                      <p className="mt-1">
                        {listaTipo("cartoes").filter(l => l.modalidade === "debito").length} débito ·{" "}
                        {listaTipo("cartoes").filter(l => l.modalidade === "credito").length} crédito
                      </p>
                    )}
                  </td>)}
                  <td className="px-2 py-2 text-center">Valores atualizados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Painel titulo="Adicionar última sangria" icon={<MinusCircle className="h-5 w-5" />}>
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[130px] flex-1">
                <span className="mb-1 block text-xs font-bold text-muted-foreground">Valor da sangria (R$)</span>
                <input inputMode="decimal" value={sangriaTexto}
                  onChange={e => setSangriaTexto(e.target.value.replace(/[^\d.,]/g, ""))}
                  placeholder="0,00" className={normal + " w-full font-display num"} />
              </label>
              <label className="min-w-[160px] flex-1">
                <span className="mb-1 block text-xs font-bold text-muted-foreground">Destino / observação</span>
                <input value={descricaoSangria} maxLength={120}
                  onChange={e => setDescricaoSangria(e.target.value)}
                  className={normal + " w-full"} />
              </label>
              <button type="button" onClick={registrarSangria}
                className="inline-flex items-center gap-2 rounded-xl bg-total px-5 py-2.5 font-bold text-primary-foreground transition-all hover:brightness-110">
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              A sangria será registrada no histórico e descontada da conferência do Caixa.
            </p>
          </Painel>
          <Painel titulo="Litros Vendidos (Giro de Bombas)" icon={<Fuel className="h-5 w-5" />}>
            <Linha label="Gasolina" valor={giro ? formatLitros(giro.gasolina) : "Preencha as leituras finais"} destaque="text-gasolina" />
            <Linha label="Diesel" valor={giro ? formatLitros(giro.diesel) : "Preencha as leituras finais"} destaque="text-diesel" />
            <p className="mt-2 text-xs text-muted-foreground">Giro = leitura final menos leitura inicial, somando as bombas de cada combustível.</p>
          </Painel>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <Painel titulo="Leituras Finais das Bombas" icon={<Fuel className="h-5 w-5" />}>
            {(["gasolina", "diesel"] as const).map(c => (["bomba1", "bomba2"] as const).map((b, indice) => (
              <label key={c + b} className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-b-0">
                <span className="text-sm font-semibold">{c === "gasolina" ? "Gasolina" : "Diesel"} · Bomba {indice + 1}</span>
                <input aria-label={"Leitura final " + c + " bomba " + (indice + 1)}
                  required inputMode="decimal" placeholder="Leitura final"
                  value={textoLeituras[c][b]}
                  onChange={e => atualizarLeitura(c, b, e.target.value)}
                  className={normal + " w-36 text-right num"} />
              </label>
            )))}
            <p className="mt-2 text-xs text-muted-foreground">A leitura final deve ser igual ou superior à inicial.</p>
          </Painel>

          <Painel titulo="Produtos do Posto" icon={<ShoppingBasket className="h-5 w-5" />}>
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary text-left text-xs">
                <tr><th className="p-2">Produto</th><th className="p-2 text-center">Quantidade</th><th className="p-2 text-right">Total</th></tr>
              </thead>
              <tbody>
                {produtos.map((p, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-2 py-2">{p.nome}</td>
                    <td className="px-2 py-2 text-center num">{p.qtd}</td>
                    <td className="px-2 py-2 text-right num">{real(p.valor)}</td>
                  </tr>
                ))}
                {produtos.length === 0 && <tr><td colSpan={3} className="py-5 text-center text-muted-foreground">Nenhum produto vendido</td></tr>}
              </tbody>
              <tfoot className="bg-hero font-bold text-ink-foreground">
                <tr><td colSpan={2} className="p-2">Total Produtos do Posto</td>
                  <td className="p-2 text-right num">{real(soma("produto_posto"))}</td></tr>
              </tfoot>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">Valor exibido separadamente. Não entra na diferença do Caixa.</p>
          </Painel>

          <Painel titulo="Totais (para conferência)" icon={<Wallet className="h-5 w-5" />}>
            <Linha label="Gasolina apurada nas bombas" valor={giro ? real(giro.gasolina * sessao.abertura.precos.gasolina) : "Aguardando leituras finais"} />
            {vendidoDiesel > 0 && <Linha label="Vendas de diesel (fora do Caixa)" valor={real(vendidoDiesel)} />}
            <Linha label="Notas (incluídas nas vendas)" valor={real(soma("notas"))} />
            <Linha label="Cartões (débito e crédito)" valor={real(soma("cartoes"))} />
            <Linha label="Pix (maquininha e manual)" valor={real(soma("pix_maquininha") + soma("pix_manual"))} />
            <Linha label="Descontos" valor={"− " + real(soma("descontos"))} />
            <Linha label="Sangrias" valor={"− " + real(soma("sangria"))} />
            <Linha label="Troco inicial" valor={real(sessao.abertura.trocoInicial)} />
            <div className="mt-2 rounded-xl bg-primary-soft px-3 py-3">
              <Linha label="Valor esperado no Caixa" valor={esperado === null ? "Aguardando leituras finais" : real(esperado)} forte />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Conferência: troco + (litros medidos de gasolina × preço) − pagamentos não recebidos em espécie − despesas de gasolina − descontos − sangrias.
            </p>
          </Painel>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Painel titulo="Caixa (Apenas Vendas de Gasolina)" icon={<ClipboardCheck className="h-5 w-5" />}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-secondary p-3 text-center">
                <p className="text-sm font-bold">Valor esperado</p>
                <p className="mt-2 font-display text-xl font-bold num">{esperado === null ? "—" : real(esperado)}</p>
              </div>
              <label className="rounded-xl bg-secondary p-3 text-center">
                <span className="text-sm font-bold">Valor contado</span>
                <input inputMode="decimal" required value={contadoTexto} placeholder="0,00"
                  onChange={e => { setContadoTexto(e.target.value.replace(/[^\d.,]/g, "")); setRevisado(false); setErro([]); }}
                  className={normal + " mt-2 w-full text-center font-display text-lg num"} />
              </label>
              <div className={"rounded-xl p-3 text-center " +
                (conferencia?.situacaoDinheiro === "certo" ? "bg-success-soft text-success" : "bg-warning-soft text-warning-foreground")}>
                <p className="text-sm font-bold">Diferença</p>
                <p className="mt-2 font-display text-xl font-bold num">
                  {conferencia ? real(Math.abs(conferencia.diferencaDinheiro)) : "—"}
                </p>
                <p className="text-xs font-bold">
                  {!conferencia ? "Aguardando" :
                    conferencia.situacaoDinheiro === "certo" ? "Tudo certo" :
                    conferencia.situacaoDinheiro === "faltando" ? "Faltando" : "Sobrando"}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Produtos do Posto e vendas de diesel não entram nesta diferença.</p>
          </Painel>

          <div className={"flex flex-col items-center justify-center rounded-2xl border p-5 text-center shadow-card " +
            (!conferencia ? "border-border bg-card" :
              conferencia.situacaoDinheiro === "certo" && conferencia.situacaoBombas === "certo"
                ? "border-success/40 bg-success-soft" : "border-warning/40 bg-warning-soft")}>
            {conferencia?.situacaoDinheiro === "certo" && conferencia.situacaoBombas === "certo" ?
              <CheckCircle2 className="h-12 w-12 text-success" /> :
              <AlertTriangle className="h-12 w-12 text-muted-foreground" />}
            <h2 className="mt-2 font-display text-xl font-bold">Resultado do Caixa</h2>
            <p className="mt-2 text-2xl font-extrabold">
              {!conferencia ? "Aguardando conferência" :
                conferencia.situacaoDinheiro === "certo" && conferencia.situacaoBombas === "certo"
                  ? "TUDO CERTO!" : "Verificar divergências"}
            </p>
            {conferencia && conferencia.situacaoBombas === "divergente" &&
              <p className="mt-2 text-xs">Bombas: diferenças de {formatLitros(conferencia.diferencaLitros.gasolina)} em gasolina e {formatLitros(conferencia.diferencaLitros.diesel)} em diesel.</p>}
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
          <label className="block text-sm font-bold">Observações do fechamento (opcional)</label>
          <textarea rows={2} maxLength={500} value={observacao}
            onChange={e => setObservacao(e.target.value)}
            placeholder="Anote qualquer ocorrência do turno..."
            className={normal + " mt-2 w-full font-normal"} />
          <label className="mt-3 flex items-start gap-2 text-sm font-semibold">
            <input type="checkbox" checked={revisado} onChange={e => setRevisado(e.target.checked)}
              className="mt-1 h-4 w-4 accent-primary" />
            Conferi os lançamentos, o dinheiro contado e as leituras finais e confirmo eventuais diferenças.
          </label>
          {erro.length > 0 && (
            <div role="alert" className="mt-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">
              {erro.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
        </section>

        <div className="flex flex-wrap justify-center gap-3 pb-3">
          <button type="button" onClick={onVoltar}
            className="inline-flex min-w-[230px] items-center justify-center gap-2 rounded-xl border-2 border-primary px-6 py-3 font-bold text-primary hover:bg-primary-soft">
            <ArrowLeft className="h-5 w-5" /> Voltar e corrigir
          </button>
          <button type="button" onClick={finalizar}
            disabled={salvando || !revisado || !leituras.ok || contado === null || contado < 0}
            className="inline-flex min-w-[230px] items-center justify-center gap-2 rounded-xl bg-success px-6 py-3 font-bold text-white shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
            <LockKeyhole className="h-5 w-5" /> Finalizar Caixa
          </button>
        </div>
      </main>
    </div>
  );
}

function Painel({ titulo, icon, children }: { titulo: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className={faixaTitulo}>
        {icon}<h2 className="font-display text-lg font-bold">{titulo}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Linha({ label, valor, forte, destaque }: { label: string; valor: string; forte?: boolean; destaque?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-b-0">
      <span className={"text-sm " + (forte ? "font-bold" : "font-semibold")}>{label}</span>
      <span className={"shrink-0 font-display font-bold num " + (destaque || "")}>{valor}</span>
    </div>
  );
}
