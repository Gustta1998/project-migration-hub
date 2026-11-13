import { parseNumeroBR } from "./abertura";

export type MedicaoDescarregamento = {
  antesCm: number;
  antesLitros: number;
  depoisCm: number;
  depoisLitros: number;
  totalLitros: number;
};

/** CM são leituras físicas do tanque; nunca convertem automaticamente em litros. */
export function calcularDescarregamento(
  antesCmTexto: string,
  antesLitrosTexto: string,
  depoisCmTexto: string,
  depoisLitrosTexto: string,
): MedicaoDescarregamento | null {
  const numeros = [antesCmTexto, antesLitrosTexto, depoisCmTexto, depoisLitrosTexto]
    .map(parseNumeroBR);
  if (numeros.some((v) => v === null || !Number.isFinite(v) || v < 0)) return null;
  const [antesCm, antesLitros, depoisCm, depoisLitros] = numeros as [number, number, number, number];
  if (depoisCm <= antesCm || depoisLitros <= antesLitros) return null;
  return {
    antesCm,
    antesLitros,
    depoisCm,
    depoisLitros,
    totalLitros: Math.round((depoisLitros - antesLitros) * 1000) / 1000,
  };
}
