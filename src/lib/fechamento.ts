import { parseNumeroBR } from "./abertura";
import { calcularResumo, litrosDe, type Resumo } from "./caixa";
import type { LeiturasBombas, SessaoCaixa } from "./abertura";

export interface FechamentoCaixa {
  fechadoEm: string;
  leiturasFinais: LeiturasBombas;
  dinheiroContado: number;
  /** Valor preenchido pelo cálculo automático, sem contagem física do numerário. */
  contagemAutomatica?: boolean;
  trocoRetirado: boolean;
  observacao: string;
  conferencia: ConferenciaCaixa;
}

export interface TurnoFechado {
  id: string;
  sessao: SessaoCaixa;
  fechamento: FechamentoCaixa;
}

export interface ConferenciaBomba {
  combustivel: "gasolina" | "diesel";
  bomba: "bomba1" | "bomba2";
  inicial: number;
  final: number;
  litrosMedidos: number;
}

export interface ConferenciaCaixa {
  bombas: ConferenciaBomba[];
  litrosMedidos: { gasolina: number; diesel: number };
  litrosLancados: { gasolina: number; diesel: number };
  diferencaLitros: { gasolina: number; diesel: number };
  resumo: Resumo;
  dinheiroEsperado: number;
  trocoRetirado: boolean;
  dinheiroContado: number;
  diferencaDinheiro: number;
  situacaoDinheiro: "certo" | "faltando" | "sobrando";
  situacaoBombas: "certo" | "divergente";
  prestacaoCombustivel?: ReturnType<typeof apurarFechamento>;
}

/** Classificação por valor monetário já apurado. */
export function avaliarSaldoCaixa(saldoEmReais: number): {
  saldo: number;
  status: "bom" | "regular" | "divergente";
} {
  const saldo = Math.round((saldoEmReais + Number.EPSILON) * 100) / 100;
  const absoluto = Math.abs(saldo);
  return {
    saldo,
    status: absoluto <= 5 ? "bom" : absoluto <= 10 ? "regular" : "divergente",
  };
}

/** Total de todas as formas de prestação de contas do combustível.
 * Sangria representa dinheiro de combustível depositado. A linha "Dinheiro"
 * legada é omitida para não somar novamente o que já foi sangrado.
 * Produtos do Posto são conferidos separadamente.
 */
export function totalPrestacaoCombustivel(sessao: SessaoCaixa): {
  total: number;
  categorias: Record<string, number>;
} {
  const tipos = [
    "sangria", "pix_maquininha", "pix_manual", "cartoes",
    "descontos", "notas", "cliente_outras_notas", "despesas",
    "cartao_frota", "fit_card",
  ] as const;
  const categorias: Record<string, number> = {};
  for (const tipo of tipos) {
    categorias[tipo] = arred(sessao.lancamentos
      .filter(l => l.tipo === tipo)
      .reduce((s, l) => s + l.valor, 0));
  }
  return {
    // Sangria e despesas compõem a prestação do combustível; desconto reduz o valor final.
    total: arred(Object.entries(categorias).reduce((s, [tipo, valor]) => s + (tipo === "descontos" ? -valor : valor), 0)),
    categorias,
  };
}

export function totalBombasCombustivel(sessao: SessaoCaixa, finais: LeiturasBombas): {
  gasolina: number; diesel: number; total: number;
} {
  const giro = giroMedido(sessao.abertura.leituras, finais);
  const gasolina = arred(giro.gasolina * sessao.abertura.precos.gasolina);
  const diesel = arred(giro.diesel * sessao.abertura.precos.diesel);
  return { gasolina, diesel, total: arred(gasolina + diesel) };
}

/** Saldo positivo indica que a prestação supera o faturamento medido;
 * saldo negativo indica que a prestação é inferior ao valor das bombas.
 * Troco não retirado é exibido nos dois lados e não distorce a diferença.
 */
export function apurarFechamento(sessao: SessaoCaixa, finais: LeiturasBombas, trocoRetirado: boolean) {
  const prestacao = totalPrestacaoCombustivel(sessao);
  const bombas = totalBombasCombustivel(sessao, finais);
  const troco = trocoRetirado ? 0 : sessao.abertura.trocoInicial;
  const totalPrestado = arred(prestacao.total + troco);
  const totalEsperado = arred(bombas.total + troco);
  return {
    ...prestacao, bombas,
    trocoIncluido: troco,
    totalPrestado, totalEsperado,
    saldo: arred(totalPrestado - totalEsperado),
  };
}

export type LeiturasTexto = {
  diesel: { bomba1: string; bomba2: string };
  gasolina: { bomba1: string; bomba2: string };
};

export const leiturasVazias = (): LeiturasTexto => ({
  diesel: { bomba1: "", bomba2: "" },
  gasolina: { bomba1: "", bomba2: "" },
});

const arred = (n: number, casas = 2) => Math.round((n + Number.EPSILON) * 10 ** casas) / 10 ** casas;

/** Leitura final nunca pode ser menor que a inicial nem conter números inválidos. */
export function validarLeiturasFinais(
  texto: LeiturasTexto,
  iniciais: LeiturasBombas,
): { ok: true; valores: LeiturasBombas } | { ok: false; erros: string[] } {
  const erros: string[] = [];
  const valores: LeiturasBombas = {
    diesel: { bomba1: 0, bomba2: 0 },
    gasolina: { bomba1: 0, bomba2: 0 },
  };
  for (const combustivel of ["gasolina", "diesel"] as const) {
    for (const bomba of ["bomba1", "bomba2"] as const) {
      const valor = parseNumeroBR(texto[combustivel][bomba]);
      if (valor === null || !Number.isFinite(valor) || valor < iniciais[combustivel][bomba]) {
        erros.push(combustivel + " · " + (bomba === "bomba1" ? "Bomba 1" : "Bomba 2") +
          ": informe um número válido igual ou maior que a leitura inicial.");
      } else valores[combustivel][bomba] = valor;
    }
  }
  return erros.length ? { ok: false, erros } : { ok: true, valores };
}

/**
 * Giro medido pelos totalizadores. Preserva a precisão em milésimos de litro.
 */
export function giroMedido(iniciais: LeiturasBombas, finais: LeiturasBombas) {
  return {
    gasolina: arred(
      finais.gasolina.bomba1 - iniciais.gasolina.bomba1 +
      finais.gasolina.bomba2 - iniciais.gasolina.bomba2, 3),
    diesel: arred(
      finais.diesel.bomba1 - iniciais.diesel.bomba1 +
      finais.diesel.bomba2 - iniciais.diesel.bomba2, 3),
  };
}

/** Valor esperado apurado diretamente pelas bombas de gasolina e diesel.
 * A prestação de contas é calculada separadamente, em apurarFechamento.
 */
export function dinheiroEsperado(sessao: SessaoCaixa, finais?: LeiturasBombas, trocoRetirado = false): number {
  if (!finais) return 0;
  const apuracao = apurarFechamento(sessao, finais, trocoRetirado);
  return apuracao.totalEsperado;
}

/** Compara a soma das quatro bombas com o combustível lançado em vendas e despesas. */
export function conferirCaixa(sessao: SessaoCaixa, finais: LeiturasBombas, contado: number, trocoRetirado = false): ConferenciaCaixa {
  const bombas: ConferenciaBomba[] = [];
  const litrosMedidos = { gasolina: 0, diesel: 0 };
  for (const combustivel of ["gasolina", "diesel"] as const) {
    for (const bomba of ["bomba1", "bomba2"] as const) {
      const inicial = sessao.abertura.leituras[combustivel][bomba];
      const final = finais[combustivel][bomba];
      const litrosMedidosBomba = arred(final - inicial, 3);
      litrosMedidos[combustivel] += litrosMedidosBomba;
      bombas.push({ combustivel, bomba, inicial, final, litrosMedidos: litrosMedidosBomba });
    }
    litrosMedidos[combustivel] = arred(litrosMedidos[combustivel], 3);
  }

  const litrosLancados = { gasolina: 0, diesel: 0 };
  for (const l of sessao.lancamentos) {
    if (l.combustivel && (l.tipo === "despesas" || l.tipo === "notas" ||
      l.tipo === "cliente_outras_notas" ||
      l.tipo === "pix_maquininha" || l.tipo === "pix_manual" || l.tipo === "cartoes" ||
      l.tipo === "dinheiro" || l.tipo === "venda_diesel_dinheiro" || l.tipo === "cartao_frota" || l.tipo === "fit_card")) {
      litrosLancados[l.combustivel] += litrosDe(l, sessao.abertura.precos);
    }
  }
  litrosLancados.gasolina = arred(litrosLancados.gasolina, 3);
  litrosLancados.diesel = arred(litrosLancados.diesel, 3);
  const diferencaLitros = {
    gasolina: arred(litrosMedidos.gasolina - litrosLancados.gasolina, 3),
    diesel: arred(litrosMedidos.diesel - litrosLancados.diesel, 3),
  };

  const apuracao = apurarFechamento(sessao, finais, trocoRetirado);
  const esperado = apuracao.totalEsperado;
  const diferencaDinheiro = apuracao.saldo;
  const situacaoDinheiro = Math.abs(diferencaDinheiro) < 0.01
    ? "certo" : diferencaDinheiro < 0 ? "faltando" : "sobrando";
  return {
    bombas, litrosMedidos, litrosLancados, diferencaLitros,
    resumo: calcularResumo(sessao.lancamentos, sessao.abertura.precos),
    dinheiroEsperado: esperado, trocoRetirado, dinheiroContado: apuracao.totalPrestado,
    prestacaoCombustivel: apuracao,
    diferencaDinheiro, situacaoDinheiro,
    situacaoBombas: Math.abs(diferencaLitros.gasolina) < 0.001 &&
      Math.abs(diferencaLitros.diesel) < 0.001 ? "certo" : "divergente",
  };
}

export const CHAVE_FECHAMENTOS = "posto-almeida:fechamentos";

export function carregarFechamentos(): TurnoFechado[] {
  try {
    const raw = window.localStorage.getItem(CHAVE_FECHAMENTOS);
    const data: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data as TurnoFechado[] : [];
  } catch { return []; }
}

/** Arquiva o turno antes de removê-lo do caixa aberto; retorna false se não conseguir salvar. */
export function arquivarFechamento(registro: TurnoFechado): boolean {
  try {
    window.localStorage.setItem(CHAVE_FECHAMENTOS, JSON.stringify([registro, ...carregarFechamentos()]));
    return true;
  } catch { return false; }
}
