import { describe, expect, it } from "vitest";
import {
  apurarFechamento, avaliarSaldoCaixa, conferirCaixa, dinheiroEsperado,
  giroMedido, leiturasVazias, totalBombasCombustivel,
  totalPrestacaoCombustivel, validarLeiturasFinais,
} from "./fechamento";
import type { Lancamento } from "./caixa";
import type { SessaoCaixa } from "./abertura";

const quando = "2026-11-08T12:00:00";
const lancar = (tipo: Lancamento["tipo"], valor: number, outros: Partial<Lancamento> = {}): Lancamento => ({
  id: Math.random().toString(), criadoEm: quando, tipo, valor, ...outros,
});
const s: SessaoCaixa = {
  versao: 1,
  abertura: {
    frentista: "Gustavo", turno: "M", data: "08/11/2026",
    abertoEm: quando, trocoInicial: 200,
    precos: { gasolina: 7.29, diesel: 7.69 },
    leituras: { gasolina: { bomba1: 100, bomba2: 200 }, diesel: { bomba1: 300, bomba2: 400 } },
  },
  notas: [],
  lancamentos: [
    lancar("sangria", 100),
    lancar("pix_maquininha", 50),
    lancar("pix_manual", 20),
    lancar("cartoes", 30),
    lancar("descontos", 10),
    lancar("notas", 40, { combustivel: "gasolina", litros: 5 }),
    lancar("cliente_outras_notas", 10, { modalidade: "prazo" }),
    lancar("despesas", 20, { funcionario: "ROANY", tipoDespesaFuncionario: "gasolina", combustivel: "gasolina", litros: 2 }),
    lancar("cartao_frota", 5),
    lancar("fit_card", 5),
    lancar("produto_posto", 125, { produtoId: "arla" }),
    lancar("dinheiro", 100, { combustivel: "gasolina" }),
  ],
};
const finais = {
  gasolina: { bomba1: 110, bomba2: 205 },
  diesel: { bomba1: 310, bomba2: 400 },
};

describe("fechamento conforme prestação de contas do Posto Almeida", () => {
  it("valida as quatro leituras e rejeita final inferior à inicial", () => {
    expect(validarLeiturasFinais(leiturasVazias(), s.abertura.leituras).ok).toBe(false);
    expect(validarLeiturasFinais({
      gasolina: { bomba1: "99", bomba2: "205" },
      diesel: { bomba1: "310", bomba2: "400" },
    }, s.abertura.leituras).ok).toBe(false);
    const validas = validarLeiturasFinais({
      gasolina: { bomba1: "110", bomba2: "205" },
      diesel: { bomba1: "310", bomba2: "400" },
    }, s.abertura.leituras);
    expect(validas.ok).toBe(true);
  });

  it("calcula os litros vendidos por gasolina e diesel pelas bombas", () => {
    expect(giroMedido(s.abertura.leituras, finais)).toEqual({ gasolina: 15, diesel: 10 });
  });

  it("calcula valor monetário das duas bombas usando seus preços diferentes", () => {
    expect(totalBombasCombustivel(s, finais)).toEqual({
      gasolina: 109.35, diesel: 76.9, total: 186.25,
    });
  });

  it("soma sangrias, despesas e descontos na prestação", () => {
    const p = totalPrestacaoCombustivel(s);
    expect(p.total).toBe(290);
    expect(p.categorias.sangria).toBe(100);
    expect(p.categorias.descontos).toBe(10);
    expect(p.categorias.despesas).toBe(20);
    expect(p.categorias.cartao_frota).toBe(5);
    expect(p.categorias.fit_card).toBe(5);
  });

  it("exclui produtos do posto e dinheiro legado para não duplicar sangrias", () => {
    const base = totalPrestacaoCombustivel(s).total;
    const extras: SessaoCaixa = {
      ...s, lancamentos: [...s.lancamentos, lancar("produto_posto", 500), lancar("dinheiro", 1000)],
    };
    expect(totalPrestacaoCombustivel(extras).total).toBe(base);
  });

  it("sangria extra entra automaticamente na prestação e muda o saldo", () => {
    const extra: SessaoCaixa = {
      ...s, lancamentos: [...s.lancamentos, lancar("sangria", 30)],
    };
    expect(totalPrestacaoCombustivel(extra).total).toBe(320);
    expect(apurarFechamento(extra, finais, true).saldo - apurarFechamento(s, finais, true).saldo).toBe(30);
  });

  it("com troco retirado: compara prestação com giro das bombas", () => {
    const a = apurarFechamento(s, finais, true);
    expect(a.totalPrestado).toBe(290);
    expect(a.totalEsperado).toBe(186.25);
    expect(a.saldo).toBe(103.75);
    expect(dinheiroEsperado(s, finais, true)).toBe(186.25);
  });

  it("com troco no caixa: soma troco aos dois lados, sem alterar a diferença", () => {
    const a = apurarFechamento(s, finais, false);
    expect(a.totalPrestado).toBe(490);
    expect(a.totalEsperado).toBe(386.25);
    expect(a.saldo).toBe(103.75);
  });

  it("mais valor nas bombas do que na prestação indica falta", () => {
    const a = apurarFechamento({ ...s, lancamentos: [] }, finais, true);
    expect(a.saldo).toBe(-186.25);
  });

  it("relatório de conferência usa diferença financeira real em vez de valores iguais automáticos", () => {
    const c = conferirCaixa(s, finais, apurarFechamento(s, finais, true).totalPrestado, true);
    expect(c.diferencaDinheiro).toBe(103.75);
    expect(c.situacaoDinheiro).toBe("sobrando");
    expect(c.prestacaoCombustivel?.totalPrestado).toBe(290);
  });

  it("classifica os limites de bom, regular e divergente em valores positivos e negativos", () => {
    expect(avaliarSaldoCaixa(0).status).toBe("bom");
    expect(avaliarSaldoCaixa(-5).status).toBe("bom");
    expect(avaliarSaldoCaixa(5.01).status).toBe("regular");
    expect(avaliarSaldoCaixa(-10).status).toBe("regular");
    expect(avaliarSaldoCaixa(10.01).status).toBe("divergente");
    expect(avaliarSaldoCaixa(-11).status).toBe("divergente");
  });

  it("alterar só a leitura final do diesel altera valor das bombas", () => {
    const maisDiesel = {
      ...finais, diesel: { ...finais.diesel, bomba1: 311 },
    };
    expect(totalBombasCombustivel(s, maisDiesel).total).toBe(193.94);
  });
});

describe("desconto manual soma à conferência sem alterar o giro das bombas", () => {
  it("aumenta em 14 reais o saldo ao lançar desconto de 14 reais", () => {
    const base = apurarFechamento(s, finais, true);
    const comDesconto: SessaoCaixa = {
      ...s, lancamentos: [...s.lancamentos, lancar("descontos", 14)],
    };
    const novo = apurarFechamento(comDesconto, finais, true);
    expect(novo.saldo - base.saldo).toBe(14);
    expect(novo.bombas.total).toBe(base.bombas.total);
  });

  it("sangria e despesa entram positivamente na prestação sem duplicar dinheiro legado", () => {
    const base = totalPrestacaoCombustivel(s).total;
    const adicionais: SessaoCaixa = {
      ...s, lancamentos: [
        ...s.lancamentos,
        lancar("sangria", 400),
        lancar("despesas", 100),
        lancar("dinheiro", 400),
      ],
    };
    expect(totalPrestacaoCombustivel(adicionais).total - base).toBe(500);
  });
});
