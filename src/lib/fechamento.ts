import { parseNumeroBR } from "./abertura";
import { calcularResumo, litrosDe, type Lancamento, type Precos, type Resumo } from "./caixa";
import type { LeiturasBombas, SessaoCaixa } from "./abertura";

export interface FechamentoCaixa {
  fechadoEm: string;
  leiturasFinais: LeiturasBombas;
  dinheiroContado: number;
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
  dinheiroContado: number;
  diferencaDinheiro: number;
  situacaoDinheiro: "certo" | "faltando" | "sobrando";
  situacaoBombas: "certo" | "divergente";
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

const tipoDinheiroRetirado = (l: Lancamento) =>
  l.tipo === "sangria" ||
  (l.tipo === "despesas" &&
    !l.combustivel &&
    (l.tipoDespesaGeral === "outros" || l.tipoDespesaFuncionario === "vale" ||
      l.tipoDespesaFuncionario === "dinheiro"));

/**
 * Conferência de numerário estimado:
 * troco inicial + recebimentos marcados como Dinheiro - sangrias - saídas
 * monetárias identificadas. Descontos não reduzem o numerário uma segunda vez;
 * despesas de combustível não representam retirada de notas e moedas.
 */
export function dinheiroEsperado(sessao: SessaoCaixa): number {
  const recebimentos = sessao.lancamentos
    .filter((l) => l.tipo === "dinheiro")
    .reduce((sum, l) => sum + l.valor, 0);
  const retiradas = sessao.lancamentos
    .filter(tipoDinheiroRetirado)
    .reduce((sum, l) => sum + l.valor, 0);
  return arred(sessao.abertura.trocoInicial + recebimentos - retiradas);
}

/** Compara a soma das quatro bombas com o combustível lançado em vendas e despesas. */
export function conferirCaixa(sessao: SessaoCaixa, finais: LeiturasBombas, contado: number): ConferenciaCaixa {
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
      l.tipo === "dinheiro" || l.tipo === "cartao_frota" || l.tipo === "fit_card")) {
      litrosLancados[l.combustivel] += litrosDe(l, sessao.abertura.precos);
    }
  }
  litrosLancados.gasolina = arred(litrosLancados.gasolina, 3);
  litrosLancados.diesel = arred(litrosLancados.diesel, 3);
  const diferencaLitros = {
    gasolina: arred(litrosMedidos.gasolina - litrosLancados.gasolina, 3),
    diesel: arred(litrosMedidos.diesel - litrosLancados.diesel, 3),
  };

  const esperado = dinheiroEsperado(sessao);
  const diferencaDinheiro = arred(contado - esperado);
  const situacaoDinheiro = Math.abs(diferencaDinheiro) < 0.01
    ? "certo" : diferencaDinheiro < 0 ? "faltando" : "sobrando";
  return {
    bombas, litrosMedidos, litrosLancados, diferencaLitros,
    resumo: calcularResumo(sessao.lancamentos, sessao.abertura.precos),
    dinheiroEsperado: esperado, dinheiroContado: contado,
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
