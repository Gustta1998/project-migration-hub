import { describe, expect, it } from "vitest";
import { calcularResumo, type Lancamento } from "./caixa";
import { litrosGasolinaSangrias, totaisSangriaCombustivel, dieselPendenteDeposito } from "./sangrias";
import { conferirCaixa, totalPrestacaoCombustivel } from "./fechamento";
import type { SessaoCaixa } from "./abertura";

const quando = "2026-11-12T12:00:00";
const precos = { gasolina: 7.29, diesel: 7.69 };
const abertura = {
  frentista: "Teste", turno: "M" as const, data: "12/11/2026", abertoEm: quando,
  trocoInicial: 0, precos,
  leituras: { gasolina: { bomba1: 0, bomba2: 0 }, diesel: { bomba1: 0, bomba2: 0 } },
};
const lancar = (id: string, tipo: Lancamento["tipo"], valor: number, extra: Partial<Lancamento> = {}): Lancamento =>
  ({ id, tipo, valor, criadoEm: quando, ...extra });
const diesel100 = lancar("d", "venda_diesel_dinheiro", 76.9, { combustivel: "diesel", litros: 10 });
const sangria150 = lancar("s", "sangria", 149.8);

describe("sangrias divididas automaticamente por vendas de diesel dinheiro", () => {
  it("subtrai todo diesel vendido em dinheiro do total das sangrias e atribui o restante à gasolina", () => {
    expect(totaisSangriaCombustivel([diesel100, sangria150])).toMatchObject({
      gasolina: 72.9, diesel: 76.9, totalSangrias: 149.8, dieselNaoDepositado: 0,
    });
    expect(litrosGasolinaSangrias([diesel100, sangria150], precos.gasolina)).toBe(10);
  });

  it("mostra diesel ainda não coberto quando há venda antes de sangria", () => {
    expect(totaisSangriaCombustivel([diesel100])).toMatchObject({
      gasolina: 0, diesel: 0, dieselNaoDepositado: 76.9,
    });
    expect(dieselPendenteDeposito([diesel100])).toBe(76.9);
  });

  it("sangrias sem qualquer diesel em dinheiro são integralmente gasolina", () => {
    expect(totaisSangriaCombustivel([lancar("s1","sangria",72.9)])).toMatchObject({
      gasolina: 72.9, diesel: 0,
    });
  });

  it("divide sangrias antigas automaticamente quando o diesel é lançado depois", () => {
    const antigas = [lancar("antiga","sangria",100)];
    expect(totaisSangriaCombustivel(antigas).gasolina).toBe(100);
    expect(totaisSangriaCombustivel([...antigas, diesel100])).toMatchObject({
      gasolina: 23.1, diesel: 76.9,
    });
  });

  it("a soma de vendas e litros no painel acompanha a sangria sem duplicar diesel", () => {
    const r = calcularResumo([diesel100,sangria150], precos);
    expect(r.litrosGasolina).toBe(10);
    expect(r.litrosDiesel).toBe(10);
    expect(r.valorGasolina).toBe(72.9);
    expect(r.valorDiesel).toBe(76.9);
  });

  it("o total da prestação não soma venda diesel novamente, pois está incluída na sangria", () => {
    const sessao: SessaoCaixa = { versao: 1, abertura, notas: [], lancamentos: [diesel100, sangria150] };
    expect(totalPrestacaoCombustivel(sessao).total).toBe(149.8);
    expect(totalPrestacaoCombustivel({...sessao,lancamentos:[sangria150]}).total).toBe(149.8);
  });

  it("a conferência de litros reconhece sangria gasolina e venda diesel sem duplicar", () => {
    const sessao: SessaoCaixa = { versao: 1, abertura, notas: [], lancamentos: [diesel100, sangria150] };
    const finais = {gasolina:{bomba1:10,bomba2:0},diesel:{bomba1:10,bomba2:0}};
    const r = conferirCaixa(sessao,finais,149.8,true);
    expect(r.litrosLancados).toEqual({gasolina:10,diesel:10});
    expect(r.situacaoBombas).toBe("certo");
  });

  it("não atribui diesel duas vezes quando há venda maior que o total depositado", () => {
    const r = totaisSangriaCombustivel([diesel100,lancar("s","sangria",50)]);
    expect(r.gasolina).toBe(0);
    expect(r.diesel).toBe(50);
    expect(r.dieselNaoDepositado).toBe(26.9);
  });
});
