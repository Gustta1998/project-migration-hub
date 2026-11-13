import { describe, expect, it } from "vitest";
import { calcularResumo, type Lancamento } from "./caixa";
import { apurarFechamento, conferirCaixa, totalPrestacaoCombustivel } from "./fechamento";
import type { SessaoCaixa } from "./abertura";

const criadoEm = "2026-11-13T01:30:00.000Z";
const gasolina: Lancamento = {
  id: "outros-gasolina", criadoEm, tipo: "despesas", valor: 72.9,
  tipoDespesaGeral: "outros", descricaoDespesa: "Veículo de apoio",
  combustivel: "gasolina", litros: 10, precoLitro: 7.29,
};
const diesel: Lancamento = {
  id: "funcionario-diesel", criadoEm, tipo: "despesas", valor: 38.45,
  funcionario: "GUSTAVO", tipoDespesaFuncionario: "diesel",
  combustivel: "diesel", litros: 5, precoLitro: 7.69,
};
const precos = { gasolina: 7.29, diesel: 7.69 };
const sessao: SessaoCaixa = {
  versao: 1,
  abertura: {
    frentista: "GUSTAVO", turno: "M", data: "13/11/2026",
    abertoEm: criadoEm, trocoInicial: 0, precos,
    leituras: {
      gasolina: { bomba1: 0, bomba2: 0 },
      diesel: { bomba1: 0, bomba2: 0 },
    },
  },
  notas: [], lancamentos: [gasolina, diesel],
};
const leiturasFinais = {
  gasolina: { bomba1: 10, bomba2: 0 },
  diesel: { bomba1: 5, bomba2: 0 },
};

describe("despesas de combustível no caixa e fechamento", () => {
  it("soma gasolina e diesel de despesas aos valores e litros exibidos no painel", () => {
    const r = calcularResumo(sessao.lancamentos, precos);
    expect(r.valorGasolina).toBe(72.9);
    expect(r.litrosGasolina).toBe(10);
    expect(r.valorDiesel).toBe(38.45);
    expect(r.litrosDiesel).toBe(5);
    expect(r.total).toBe(111.35);
    expect(r.totalVendas).toBe(111.35);
    // Continua identificado como saída para relatório administrativo.
    expect(r.totalSaidas).toBe(111.35);
  });

  it("reconcilia o valor e a litragem com as bombas sem somar despesa duas vezes", () => {
    const a = apurarFechamento(sessao, leiturasFinais, true);
    expect(totalPrestacaoCombustivel(sessao).categorias.despesas).toBe(111.35);
    expect(a.totalPrestado).toBe(111.35);
    expect(a.totalEsperado).toBe(111.35);
    expect(a.saldo).toBe(0);
    const c = conferirCaixa(sessao, leiturasFinais, a.totalPrestado, true);
    expect(c.litrosLancados).toEqual({ gasolina: 10, diesel: 5 });
    expect(c.diferencaLitros).toEqual({ gasolina: 0, diesel: 0 });
    expect(c.situacaoBombas).toBe("certo");
    expect(c.situacaoDinheiro).toBe("certo");
  });

  it("despesa geral sem combustível não gera litros de gasolina nem diesel", () => {
    const geral: Lancamento = {
      id: "cozinha", criadoEm, tipo: "despesas",
      tipoDespesaGeral: "outros", valor: 30, descricaoDespesa: "Cozinha",
    };
    const r = calcularResumo([geral], precos);
    expect(r.total).toBe(0);
    expect(r.valorGasolina).toBe(0);
    expect(r.valorDiesel).toBe(0);
    expect(r.litrosGasolina).toBe(0);
    expect(r.litrosDiesel).toBe(0);
    expect(r.totalSaidas).toBe(30);
  });

  it("não afeta o somatório das vendas de combustível já registradas", () => {
    const venda: Lancamento = {
      id: "pix-gasolina", criadoEm, tipo: "pix_manual",
      combustivel: "gasolina", valor: 72.9, litros: 10,
    };
    const r = calcularResumo([gasolina, diesel, venda], precos);
    expect(r.total).toBe(184.25);
    expect(r.valorGasolina).toBe(145.8);
    expect(r.litrosGasolina).toBe(20);
    expect(r.valorDiesel).toBe(38.45);
    expect(r.litrosDiesel).toBe(5);
  });
});
