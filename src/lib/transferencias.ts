import { parseNumeroBR } from "./abertura";
import type { Combustivel, Lancamento, Precos } from "./caixa";

const arred = (n: number, casas: number) => Math.round((n + Number.EPSILON) * 10 ** casas) / 10 ** casas;

/** A transferência é retirada pelas bombas e sai definitivamente do estoque
 * do posto de origem, mas não gera dinheiro recebido nem faturamento.
 */
export function calcularTransferencia(litrosTexto: string, precoLitro: number) {
  const litros = parseNumeroBR(litrosTexto);
  if (litros === null || !Number.isFinite(litros) || litros <= 0 ||
    !Number.isFinite(precoLitro) || precoLitro <= 0) return null;
  const litrosRegistrados = arred(litros, 3);
  if (litrosRegistrados <= 0) return null;
  return { litros: litrosRegistrados, valorEquivalente: arred(litrosRegistrados * precoLitro, 2) };
}

export function apurarTransferencias(lancamentos: Lancamento[], precos: Precos) {
  const totais = {
    gasolina: { litros: 0, valorEquivalente: 0, quantidade: 0 },
    diesel: { litros: 0, valorEquivalente: 0, quantidade: 0 },
  };
  for (const l of lancamentos) {
    if (l.tipo !== "transferencia_combustivel" || !l.combustivel) continue;
    const combustivel: Combustivel = l.combustivel;
    const litros = typeof l.litros === "number" && Number.isFinite(l.litros)
      ? l.litros : precos[combustivel] > 0 ? l.valor / precos[combustivel] : 0;
    totais[combustivel].litros += litros;
    totais[combustivel].valorEquivalente += l.valor;
    totais[combustivel].quantidade += 1;
  }
  for (const combustivel of ["gasolina", "diesel"] as const) {
    totais[combustivel].litros = arred(totais[combustivel].litros, 3);
    totais[combustivel].valorEquivalente = arred(totais[combustivel].valorEquivalente, 2);
  }
  return totais;
}
