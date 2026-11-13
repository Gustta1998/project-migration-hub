import { describe, expect, it } from "vitest";
import { calcularDescarregamento } from "./descarregamento";
import { calcularResumo, type Lancamento } from "./caixa";
import { totalPrestacaoCombustivel } from "./fechamento";
import type { SessaoCaixa } from "./abertura";

const criadoEm = "2026-11-13T01:10:00.000Z";
const recebimento: Lancamento = {
  id: "descarga-1", criadoEm, tipo: "descarregamento", valor: 0,
  combustivel: "gasolina", litros: 2320,
  descargaAntesCm: 8.5, descargaAntesLitros: 160,
  descargaDepoisCm: 55, descargaDepoisLitros: 2480,
  responsavel: "GUSTAVO",
};
const sessao: SessaoCaixa = {
  versao: 1,
  abertura: {
    frentista: "GUSTAVO", turno: "M", data: "13/11/2026",
    abertoEm: criadoEm, trocoInicial: 100,
    precos: { gasolina: 7.29, diesel: 7.69 },
    leituras: {
      gasolina: { bomba1: 0, bomba2: 0 },
      diesel: { bomba1: 0, bomba2: 0 },
    },
  },
  notas: [], lancamentos: [recebimento],
};

describe("descarregamento de combustível", () => {
  it("reproduz a ficha manual: 160 L antes e 2480 L depois resultam 2320 L", () => {
    expect(calcularDescarregamento("8,5", "160", "55", "2480")).toEqual({
      antesCm: 8.5, antesLitros: 160,
      depoisCm: 55, depoisLitros: 2480, totalLitros: 2320,
    });
  });
  it("aceita medições de diesel com três casas decimais", () => {
    expect(calcularDescarregamento("10", "100,125", "65", "3000,375")?.totalLitros).toBe(2900.25);
  });
  it("rejeita dados vazios, negativos e leituras depois menores que antes", () => {
    expect(calcularDescarregamento("", "160", "55", "2480")).toBeNull();
    expect(calcularDescarregamento("8,5", "160", "7", "2480")).toBeNull();
    expect(calcularDescarregamento("8,5", "160", "55", "150")).toBeNull();
    expect(calcularDescarregamento("8,5", "-1", "55", "2480")).toBeNull();
  });
  it("não transforma combustível recebido em venda nem em saída financeira", () => {
    const r = calcularResumo(sessao.lancamentos, sessao.abertura.precos);
    expect(r.total).toBe(0);
    expect(r.totalVendas).toBe(0);
    expect(r.totalSaidas).toBe(0);
    expect(r.litrosGasolina).toBe(0);
    expect(r.litrosDiesel).toBe(0);
    expect(totalPrestacaoCombustivel(sessao).total).toBe(0);
    expect(recebimento.responsavel).toBe("GUSTAVO");
  });
});
