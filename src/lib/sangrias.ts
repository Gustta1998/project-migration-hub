import type { Lancamento } from "./caixa";

const centavos = (n: number) => Math.round((n + Number.EPSILON) * 100);

/**
 * Regra do Posto Almeida:
 * toda sangria é dinheiro de combustível depositado;
 * o diesel é identificado pelo lançamento "Venda Diesel Dinheiro";
 * o restante das sangrias corresponde a gasolina.
 *
 * A divisão é CUMULATIVA, não individual por depósito. Quando um diesel em
 * dinheiro é lançado depois de uma sangria, o painel recalcula a separação.
 * Nunca soma a venda diesel novamente na prestação (o valor já está na sangria).
 */
export function totaisSangriaCombustivel(lancamentos: Lancamento[]) {
  const sangriasCentavos = lancamentos
    .filter(l => l.tipo === "sangria")
    .reduce((sum, l) => sum + centavos(l.valor), 0);
  const dieselVendidoCentavos = lancamentos
    .filter(l => l.tipo === "venda_diesel_dinheiro")
    .reduce((sum, l) => sum + centavos(l.valor), 0);
  const dieselCentavos = Math.min(sangriasCentavos, dieselVendidoCentavos);
  return {
    gasolina: (sangriasCentavos - dieselCentavos) / 100,
    diesel: dieselCentavos / 100,
    semDetalhe: 0,
    totalSangrias: sangriasCentavos / 100,
    dieselVendido: dieselVendidoCentavos / 100,
    dieselNaoDepositado: Math.max(0, dieselVendidoCentavos - sangriasCentavos) / 100,
  };
}

export function dieselPendenteDeposito(lancamentos: Lancamento[]) {
  return totaisSangriaCombustivel(lancamentos).dieselNaoDepositado;
}

/** Divide a litragem da gasolina depositada; diesel já é lançado na venda. */
export function litrosGasolinaSangrias(lancamentos: Lancamento[], precoGasolina: number): number {
  if (!Number.isFinite(precoGasolina) || precoGasolina <= 0) return 0;
  return Math.round((totaisSangriaCombustivel(lancamentos).gasolina / precoGasolina) * 1000) / 1000;
}
