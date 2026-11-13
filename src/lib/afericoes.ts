import type { Combustivel, Lancamento, Precos } from "./caixa";

const arred = (n: number, casas = 3) => Math.round((n + Number.EPSILON) * 10 ** casas) / 10 ** casas;

/** Aferições com devolução integral: movimentam o totalizador, mas não são vendas
 * nem saídas do estoque do tanque. Exibir separadamente para auditoria.
 */
export function apurarAfericoes(lancamentos: Lancamento[], precos: Precos) {
  const totais = {
    gasolina: { litros: 0, valorBomba: 0, quantidade: 0 },
    diesel: { litros: 0, valorBomba: 0, quantidade: 0 },
  };
  for (const l of lancamentos) {
    if (l.tipo !== "despesas" || !l.afericaoDevolvida || !l.combustivel) continue;
    const tipo: Combustivel = l.combustivel;
    const litros = typeof l.litros === "number" && Number.isFinite(l.litros)
      ? l.litros
      : precos[tipo] > 0 ? l.valor / precos[tipo] : 0;
    const total = totais[tipo];
    total.litros += litros;
    total.valorBomba += l.valor;
    total.quantidade += 1;
  }
  for (const t of ["gasolina", "diesel"] as const) {
    totais[t].litros = arred(totais[t].litros);
    totais[t].valorBomba = arred(totais[t].valorBomba, 2);
  }
  return totais;
}
