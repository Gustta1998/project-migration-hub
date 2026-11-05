export type Combustivel = "gasolina" | "diesel";

export type TipoLancamento =
  | "pix_maquininha"
  | "pix_manual"
  | "cartoes"
  | "dinheiro"
  | "descontos"
  | "sangria"
  | "despesas"
  | "cartao_frota"
  | "fit_card"
  | "notas"
  | "cliente_outras_notas";

export type Categoria = "venda" | "desconto" | "saida";

export interface TipoInfo {
  id: TipoLancamento;
  label: string;
  categoria: Categoria;
  descricao: string;
}

export const TIPOS: TipoInfo[] = [
  { id: "pix_maquininha", label: "Pix maquininha", categoria: "venda", descricao: "Pix pela maquininha" },
  { id: "pix_manual", label: "Pix manual", categoria: "venda", descricao: "Enviado direto ao patrão" },
  { id: "cartoes", label: "Cartões", categoria: "venda", descricao: "Débito ou crédito" },
  { id: "dinheiro", label: "Dinheiro", categoria: "venda", descricao: "Pagamento em espécie" },
  { id: "cartao_frota", label: "Cartão Frota", categoria: "venda", descricao: "Frotas conveniadas" },
  { id: "fit_card", label: "Fit Card", categoria: "venda", descricao: "Cartão Fit" },
  { id: "notas", label: "Notas", categoria: "venda", descricao: "Notas autorizadas" },
  { id: "cliente_outras_notas", label: "Cliente outras notas", categoria: "venda", descricao: "Notas de terceiros" },
  { id: "descontos", label: "Descontos", categoria: "desconto", descricao: "Abate do total" },
  { id: "sangria", label: "Sangria", categoria: "saida", descricao: "Retirada do caixa" },
  { id: "despesas", label: "Despesas", categoria: "saida", descricao: "Gastos do turno" },
];

export const tipoInfo = (id: TipoLancamento) => TIPOS.find((t) => t.id === id)!;

export interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  valor: number;
  combustivel?: Combustivel | undefined;
  modalidade?: "debito" | "credito" | "avista" | "prazo" | undefined;
  litros?: number | undefined;
  precoLitro?: number | undefined;
  responsavel?: string | undefined;
  destinoNota?: string | undefined;
  criadoEm: string; // ISO
  observacao?: string | undefined;
}

export interface Precos {
  gasolina: number;
  diesel: number;
}

export interface Resumo {
  valorGasolina: number;
  valorDiesel: number;
  litrosGasolina: number;
  litrosDiesel: number;
  totalVendas: number;
  totalNaoRecebido: number;
  totalDescontos: number;
  totalSaidas: number;
  total: number;
  porTipo: Record<string, { valor: number; quantidade: number }>;
  cartoes: { debito: number; credito: number; qtdDebito: number; qtdCredito: number };
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function calcularResumo(lancamentos: Lancamento[], precos: Precos): Resumo {
  const r: Resumo = {
    valorGasolina: 0,
    valorDiesel: 0,
    litrosGasolina: 0,
    litrosDiesel: 0,
    totalVendas: 0,
    totalNaoRecebido: 0,
    totalDescontos: 0,
    totalSaidas: 0,
    total: 0,
    porTipo: {},
    cartoes: { debito: 0, credito: 0, qtdDebito: 0, qtdCredito: 0 },
  };

  for (const l of lancamentos) {
    const info = tipoInfo(l.tipo);
    const slot = (r.porTipo[l.tipo] ??= { valor: 0, quantidade: 0 });
    slot.valor += l.valor;
    slot.quantidade += 1;

    if (info.categoria === "venda") {
      r.totalVendas += l.valor;
      if (l.tipo === "notas" || l.modalidade === "prazo") r.totalNaoRecebido += l.valor;
      if (l.combustivel === "diesel") r.valorDiesel += l.valor;
      else if (l.combustivel === "gasolina") r.valorGasolina += l.valor;
      if (l.tipo === "cartoes") {
        if (l.modalidade === "debito") {
          r.cartoes.debito += l.valor;
          r.cartoes.qtdDebito += 1;
        } else {
          r.cartoes.credito += l.valor;
          r.cartoes.qtdCredito += 1;
        }
      }
    } else if (info.categoria === "desconto") {
      r.totalDescontos += l.valor;
    } else {
      r.totalSaidas += l.valor;
    }
  }

  const litrosExatos = (l: Lancamento) =>
    typeof l.litros === "number" && Number.isFinite(l.litros)
      ? l.litros
      : l.combustivel && precos[l.combustivel] > 0
        ? l.valor / precos[l.combustivel]
        : 0;
  r.litrosGasolina = round(lancamentos
    .filter((l) => tipoInfo(l.tipo).categoria === "venda" && l.combustivel === "gasolina")
    .reduce((acc, l) => acc + litrosExatos(l), 0), 3);
  r.litrosDiesel = round(lancamentos
    .filter((l) => tipoInfo(l.tipo).categoria === "venda" && l.combustivel === "diesel")
    .reduce((acc, l) => acc + litrosExatos(l), 0), 3);
  r.total = round(r.totalVendas - r.totalDescontos);
  return r;
}

export const litrosDe = (l: Lancamento, precos: Precos) =>
  typeof l.litros === "number" && Number.isFinite(l.litros)
    ? round(l.litros, 3)
    : l.combustivel && precos[l.combustivel] > 0
      ? round(l.valor / precos[l.combustivel], 3)
      : 0;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (n: number) => brl.format(n);
export const formatLitros = (n: number) =>
  `${n.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} L`;
export const formatDataHora = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const TURNO = {
  posto: "Posto Almeida",
  frentista: "Gustavo",
  turno: "Manhã",
  data: "04/11/2026",
  trocoInicial: 200,
  precos: { gasolina: 7.29, diesel: 7.39 } as Precos,
};

export const LANCAMENTOS_INICIAIS: Lancamento[] = [
  { id: "1", tipo: "pix_maquininha", valor: 77, combustivel: "gasolina", modalidade: "avista", criadoEm: "2026-11-05T00:59:00" },
  { id: "2", tipo: "dinheiro", valor: 40, combustivel: "gasolina", modalidade: "avista", criadoEm: "2026-11-05T00:59:00" },
  { id: "3", tipo: "cartoes", valor: 80, combustivel: "gasolina", modalidade: "credito", criadoEm: "2026-11-05T00:58:00" },
  { id: "4", tipo: "pix_manual", valor: 21, combustivel: "gasolina", modalidade: "avista", criadoEm: "2026-11-05T00:58:00" },
  { id: "5", tipo: "dinheiro", valor: 250, combustivel: "gasolina", modalidade: "avista", criadoEm: "2026-11-05T00:58:00" },
  { id: "6", tipo: "pix_maquininha", valor: 15, combustivel: "gasolina", modalidade: "avista", criadoEm: "2026-11-05T00:57:00" },
];

export interface NotaAutorizada {
  id: string;
  cliente: string;
  turno: string;
  responsavel: string;
  combustivel: string;
  litros: number;
  status: "autorizada" | "pendente" | "abastecida";
  abastecidaPor?: string | undefined;
  abastecidaEm?: string | undefined; // ISO
}

/** Only authorized notes can be confirmed as fueled. */
export const podeConfirmarAbastecimento = (n: NotaAutorizada) => n.status === "autorizada";

/** Marks a note as fueled by the attendant; other notes are untouched. */
export function confirmarAbastecimento(
  notas: NotaAutorizada[],
  id: string,
  frentista: string,
  quando: string,
): NotaAutorizada[] {
  return notas.map((n) =>
    n.id === id && podeConfirmarAbastecimento(n)
      ? { ...n, status: "abastecida", abastecidaPor: frentista, abastecidaEm: quando }
      : n,
  );
}

/** Undo: returns a fueled note to the authorized list. */
export function desfazerAbastecimento(notas: NotaAutorizada[], id: string): NotaAutorizada[] {
  return notas.map((n) =>
    n.id === id && n.status === "abastecida"
      ? { ...n, status: "autorizada", abastecidaPor: undefined, abastecidaEm: undefined }
      : n,
  );
}

/** Notes still open — what the next shift will see. Fueled notes never carry over. */
export const notasEmAberto = (notas: NotaAutorizada[]) =>
  notas.filter((n) => n.status !== "abastecida");

export const NOTAS: NotaAutorizada[] = [
  { id: "n1", cliente: "Secretaria de Saúde", turno: "Plantão da manhã", responsavel: "Marcos Silva", combustivel: "Diesel", litros: 80, status: "autorizada" },
  { id: "n2", cliente: "Transportes Lima", turno: "Plantão da manhã", responsavel: "Ana Lima", combustivel: "Gasolina", litros: 45, status: "autorizada" },
  { id: "n3", cliente: "Prefeitura Municipal", turno: "Plantão da tarde", responsavel: "João Pedro", combustivel: "Diesel", litros: 120, status: "pendente" },
];

/** Filtros do histórico de lançamentos. */
export type FiltroHistorico = "todos" | "vendas" | "descontos" | "sangrias" | "notas";

export const FILTROS_HISTORICO: { id: FiltroHistorico; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "vendas", label: "Vendas" },
  { id: "descontos", label: "Descontos" },
  { id: "sangrias", label: "Sangrias" },
  { id: "notas", label: "Notas" },
];

export function filtrarHistorico(lancamentos: Lancamento[], filtro: FiltroHistorico): Lancamento[] {
  switch (filtro) {
    case "todos":
      return lancamentos;
    case "vendas":
      return lancamentos.filter((l) => tipoInfo(l.tipo).categoria === "venda");
    case "descontos":
      return lancamentos.filter((l) => l.tipo === "descontos");
    case "sangrias":
      return lancamentos.filter((l) => l.tipo === "sangria");
    case "notas":
      return lancamentos.filter((l) => l.tipo === "notas" || l.tipo === "cliente_outras_notas");
  }
}
