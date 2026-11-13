import { describe, expect, it } from "vitest";
import { calcularTransferencia, apurarTransferencias } from "./transferencias";
import { calcularResumo, filtrarHistorico, type Lancamento } from "./caixa";
import { apurarFechamento, conferirCaixa, totalPrestacaoCombustivel } from "./fechamento";
import type { SessaoCaixa } from "./abertura";

const agora = "2026-11-13T15:00:00.000Z";
const precos = { gasolina: 7.29, diesel: 7.69 };
const gasolina: Lancamento = {
  id: "tg", criadoEm: agora, tipo: "transferencia_combustivel",
  combustivel: "gasolina", litros: 100, precoLitro: 7.29, valor: 729,
  responsavel: "GUSTAVO", postoDestino: "Posto da Rede 2",
};
const diesel: Lancamento = {
  id: "td", criadoEm: agora, tipo: "transferencia_combustivel",
  combustivel: "diesel", litros: 20, precoLitro: 7.69, valor: 153.8,
  responsavel: "GUSTAVO", postoDestino: "Posto da Rede 3",
};
const sessao: SessaoCaixa = {
  versao: 1,
  abertura: {
    frentista: "GUSTAVO", turno: "M", abertoEm: agora, data: "13/11/2026",
    trocoInicial: 0, precos,
    leituras: {
      gasolina: { bomba1: 0, bomba2: 0 }, diesel: { bomba1: 0, bomba2: 0 },
    },
  },
  lancamentos: [gasolina, diesel], notas: [],
};
const finais = {
  gasolina: { bomba1: 100, bomba2: 0 }, diesel: { bomba1: 20, bomba2: 0 },
};

describe("transferência entre postos sem venda", () => {
  it("calcula litros e valor equivalente, sem aceitar valores inválidos", () => {
    expect(calcularTransferencia("100,000", 7.29)).toEqual({ litros: 100, valorEquivalente: 729 });
    expect(calcularTransferencia("20", 7.69)).toEqual({ litros: 20, valorEquivalente: 153.8 });
    expect(calcularTransferencia("0", 7.29)).toBeNull();
    expect(calcularTransferencia("", 7.29)).toBeNull();
    expect(calcularTransferencia("-1", 7.29)).toBeNull();
    expect(calcularTransferencia("10", 0)).toBeNull();
  });

  it("preserva posto de destino, responsável, combustível e litros para o gerente", () => {
    expect(gasolina.postoDestino).toBe("Posto da Rede 2");
    expect(diesel.postoDestino).toBe("Posto da Rede 3");
    expect(apurarTransferencias(sessao.lancamentos, precos)).toEqual({
      gasolina: { litros: 100, valorEquivalente: 729, quantidade: 1 },
      diesel: { litros: 20, valorEquivalente: 153.8, quantidade: 1 },
    });
  });

  it("não aumenta vendas, caixa financeiro, despesas nem litros vendidos do painel", () => {
    const resumo = calcularResumo(sessao.lancamentos, precos);
    expect(resumo.total).toBe(0);
    expect(resumo.totalVendas).toBe(0);
    expect(resumo.totalSaidas).toBe(0);
    expect(resumo.valorGasolina).toBe(0);
    expect(resumo.valorDiesel).toBe(0);
    expect(resumo.litrosGasolina).toBe(0);
    expect(resumo.litrosDiesel).toBe(0);
    expect(filtrarHistorico(sessao.lancamentos, "todos")).toHaveLength(2);
    expect(filtrarHistorico(sessao.lancamentos, "vendas")).toHaveLength(0);
  });

  it("justifica o giro de gasolina e diesel no fechamento sem criar venda", () => {
    const prestacao = totalPrestacaoCombustivel(sessao);
    expect(prestacao.categorias.transferencias).toBe(882.8);
    expect(prestacao.categorias.despesas).toBe(0);
    expect(prestacao.total).toBe(882.8);
    const saldo = apurarFechamento(sessao, finais, true);
    expect(saldo.totalEsperado).toBe(882.8);
    expect(saldo.saldo).toBe(0);
    const conferido = conferirCaixa(sessao, finais, saldo.totalPrestado, true);
    expect(conferido.litrosLancados).toEqual({ gasolina: 100, diesel: 20 });
    expect(conferido.diferencaLitros).toEqual({ gasolina: 0, diesel: 0 });
    expect(conferido.situacaoBombas).toBe("certo");
  });

  it("não duplica lançamentos normais ao misturar com transferência", () => {
    const pix: Lancamento = {
      id: "pix", criadoEm: agora, tipo: "pix_manual", valor: 72.9,
      combustivel: "gasolina", litros: 10,
    };
    const comVenda = { ...sessao, lancamentos: [...sessao.lancamentos, pix] };
    expect(calcularResumo(comVenda.lancamentos, precos).total).toBe(72.9);
    expect(totalPrestacaoCombustivel(comVenda).total).toBe(955.7);
  });
});
