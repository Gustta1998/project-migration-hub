import type { Lancamento } from "./caixa";

const centavos = (v: number) => Math.round((v + Number.EPSILON) * 100);

/** Diesel vendido em dinheiro ainda não atribuído a uma sangria detalhada.
 * Sangrias legadas sem discriminação não podem ser divididas com segurança.
 */
export function dieselPendenteDeposito(lancamentos: Lancamento[]): number {
  const vendido = lancamentos
    .filter(l => l.tipo === "venda_diesel_dinheiro")
    .reduce((v, l) => v + centavos(l.valor), 0);
  const depositado = lancamentos
    .filter(l => l.tipo === "sangria" && typeof l.sangriaDiesel === "number")
    .reduce((v, l) => v + centavos(l.sangriaDiesel ?? 0), 0);
  return Math.max(0, (vendido - depositado) / 100);
}

export function separarSangria(total: number, diesel: number) {
  if (!Number.isFinite(total) || !Number.isFinite(diesel)) return null;
  const t = centavos(total), d = centavos(diesel);
  if (t <= 0 || d < 0 || d > t) return null;
  return { gasolina: (t - d) / 100, diesel: d / 100, total: t / 100 };
}

export function totaisSangriaCombustivel(lancamentos: Lancamento[]) {
  let gasolina = 0, diesel = 0, semDetalhe = 0;
  for (const l of lancamentos.filter(x => x.tipo === "sangria")) {
    if (typeof l.sangriaDiesel === "number" && typeof l.sangriaGasolina === "number" &&
        Math.abs(l.sangriaDiesel + l.sangriaGasolina - l.valor) < 0.011) {
      gasolina += centavos(l.sangriaGasolina);
      diesel += centavos(l.sangriaDiesel);
    } else semDetalhe += centavos(l.valor);
  }
  return { gasolina: gasolina / 100, diesel: diesel / 100, semDetalhe: semDetalhe / 100 };
}
