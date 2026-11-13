import { describe, expect, it } from "vitest";
import { apurarAfericoes } from "./afericoes";
import { calcularResumo, type Lancamento } from "./caixa";
import { apurarFechamento, conferirCaixa, totalPrestacaoCombustivel } from "./fechamento";
import type { SessaoCaixa } from "./abertura";

const agora = "2026-11-13T03:00:00.000Z";
const precos = { gasolina: 7.29, diesel: 7.69 };
const lancar = (id: string, valor: number, litros: number, combustivel: "gasolina" | "diesel", afericaoDevolvida = true): Lancamento => ({
  id, criadoEm: agora, tipo: "despesas", valor, litros, combustivel,
  precoLitro: precos[combustivel], responsavel: "GUSTAVO",
  tipoDespesaGeral: "outros", afericaoDevolvida,
});
const gasolina = lancar("afericao-g", 145.8, 20, "gasolina");
const diesel = lancar("afericao-d", 76.9, 10, "diesel");
const sessao: SessaoCaixa = {
  versao: 1,
  abertura: {
    frentista: "GUSTAVO", turno: "M", abertoEm: agora,
    data: "13/11/2026", trocoInicial: 0, precos,
    leituras: {
      gasolina: { bomba1: 0, bomba2: 0 },
      diesel: { bomba1: 0, bomba2: 0 },
    },
  },
  lancamentos: [gasolina, diesel],
  notas: [],
};
const finais = { gasolina: { bomba1: 20, bomba2: 0 }, diesel: { bomba1: 10, bomba2: 0 } };

describe("aferições devolvidas ao tanque", () => {
  it("preserva combustível, litros, valor equivalente e responsável para o gerente", () => {
    const a = apurarAfericoes(sessao.lancamentos, precos);
    expect(a.gasolina).toEqual({ litros: 20, valorBomba: 145.8, quantidade: 1 });
    expect(a.diesel).toEqual({ litros: 10, valorBomba: 76.9, quantidade: 1 });
    expect(sessao.lancamentos[0]?.responsavel).toBe("GUSTAVO");
    expect(sessao.lancamentos[0]?.afericaoDevolvida).toBe(true);
  });

  it("não aumenta vendas, despesas financeiras, litros vendidos ou saída de estoque", () => {
    const r = calcularResumo(sessao.lancamentos, precos);
    expect(r.total).toBe(0);
    expect(r.totalVendas).toBe(0);
    expect(r.totalSaidas).toBe(0);
    expect(r.valorGasolina).toBe(0);
    expect(r.valorDiesel).toBe(0);
    expect(r.litrosGasolina).toBe(0);
    expect(r.litrosDiesel).toBe(0);
    expect(r.porTipo.afericoes?.quantidade).toBe(2);
    expect(r.porTipo.despesas).toBeUndefined();
  });

  it("compensa o giro medido nas bombas na conferência, sem virar venda", () => {
    const p = totalPrestacaoCombustivel(sessao);
    expect(p.categorias.despesas).toBe(0);
    expect(p.categorias.afericoes).toBe(222.7);
    expect(p.total).toBe(222.7);
    expect(apurarFechamento(sessao, finais, true).saldo).toBe(0);
    const c = conferirCaixa(sessao, finais, p.total, true);
    expect(c.litrosLancados).toEqual({ gasolina: 20, diesel: 10 });
    expect(c.diferencaLitros).toEqual({ gasolina: 0, diesel: 0 });
    expect(c.situacaoBombas).toBe("certo");
  });

  it("separa aferições de despesas convencionais da mesma gasolina", () => {
    const despesa = lancar("despesa-g", 72.9, 10, "gasolina", false);
    const r = calcularResumo([...sessao.lancamentos, despesa], precos);
    expect(r.total).toBe(72.9);
    expect(r.totalSaidas).toBe(72.9);
    expect(r.litrosGasolina).toBe(10);
    const p = totalPrestacaoCombustivel({ ...sessao, lancamentos: [...sessao.lancamentos, despesa] });
    expect(p.categorias.afericoes).toBe(222.7);
    expect(p.categorias.despesas).toBe(72.9);
    expect(p.total).toBe(295.6);
  });
});
