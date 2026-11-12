import { describe, expect, it } from "vitest";
import { calcularResumo, type Lancamento } from "./caixa";
import { dieselPendenteDeposito, separarSangria, totaisSangriaCombustivel } from "./sangrias";
import { totalPrestacaoCombustivel } from "./fechamento";
import type { SessaoCaixa } from "./abertura";

const quando = "2026-11-12T12:00:00";
const itens: Lancamento[] = [
  { id: "d1", tipo: "venda_diesel_dinheiro", combustivel: "diesel", valor: 76.9, litros: 10, precoLitro: 7.69, criadoEm: quando },
  { id: "d2", tipo: "venda_diesel_dinheiro", combustivel: "diesel", valor: 38.45, litros: 5, precoLitro: 7.69, criadoEm: quando },
  { id: "s1", tipo: "sangria", valor: 100, sangriaGasolina: 61.55, sangriaDiesel: 38.45, criadoEm: quando },
  { id: "s2", tipo: "sangria", valor: 50, sangriaGasolina: 50, sangriaDiesel: 0, criadoEm: quando },
  { id: "legacy", tipo: "sangria", valor: 30, criadoEm: quando },
];

describe("venda diesel dinheiro e divisão de sangrias", () => {
  it("contabiliza venda diesel na litragem vendida e nas vendas do PDV", () => {
    const r = calcularResumo(itens, { gasolina: 7.29, diesel: 7.69 });
    expect(r.valorDiesel).toBeCloseTo(115.35);
    expect(r.litrosDiesel).toBe(15);
    expect(r.totalVendas).toBeCloseTo(115.35);
  });

  it("registra os totais de gasolina e diesel depositados, sem inventar o legado", () => {
    expect(totaisSangriaCombustivel(itens)).toEqual({
      gasolina: 111.55, diesel: 38.45, semDetalhe: 30,
    });
  });

  it("mostra diesel em dinheiro ainda não atribuído às sangrias", () => {
    expect(dieselPendenteDeposito(itens)).toBeCloseTo(76.9);
  });

  it("não permite valor negativo ou diesel maior que o total depositado", () => {
    expect(separarSangria(100, 110)).toBeNull();
    expect(separarSangria(100, -1)).toBeNull();
    expect(separarSangria(0, 0)).toBeNull();
    expect(separarSangria(100, 40)).toEqual({ total: 100, gasolina: 60, diesel: 40 });
  });

  it("não duplica a venda diesel em dinheiro no total da prestação", () => {
    const sessao: SessaoCaixa = {
      versao: 1,
      abertura: {
        frentista: "Teste", turno: "M", data: "12/11/2026", abertoEm: quando,
        trocoInicial: 0, precos: { gasolina: 7.29, diesel: 7.69 },
        leituras: { gasolina: { bomba1: 0, bomba2: 0 }, diesel: { bomba1: 0, bomba2: 0 } },
      },
      notas: [], lancamentos: itens,
    };
    const prestacao = totalPrestacaoCombustivel(sessao);
    expect(prestacao.total).toBe(180);
    expect(prestacao.categorias.sangria).toBe(180);
    const semVendas = { ...sessao, lancamentos: itens.filter(l => l.tipo !== "venda_diesel_dinheiro") };
    expect(totalPrestacaoCombustivel(semVendas).total).toBe(prestacao.total);
  });
});
