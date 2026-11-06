import { describe, expect, it } from "vitest";
import {
  conferirCaixa, dinheiroEsperado, validarLeiturasFinais, leiturasVazias,
} from "./fechamento";
import { TURNO, type Lancamento } from "./caixa";
import type { SessaoCaixa } from "./abertura";

const iso = "2026-11-06T12:00:00";
const lancamentos: Lancamento[] = [
  { id: "a", tipo: "dinheiro", combustivel: "gasolina", valor: 72.9, litros: 10, criadoEm: iso },
  { id: "b", tipo: "pix_maquininha", combustivel: "diesel", valor: 73.9, litros: 10, criadoEm: iso },
  { id: "c", tipo: "despesas", combustivel: "gasolina", valor: 36.45, litros: 5,
    funcionario: "ROANY", tipoDespesaFuncionario: "gasolina", criadoEm: iso },
  { id: "d", tipo: "sangria", valor: 50, criadoEm: iso },
  { id: "e", tipo: "despesas", valor: 20, tipoDespesaGeral: "outros",
    descricaoDespesa: "Cozinha", criadoEm: iso },
];
const sessao: SessaoCaixa = {
  versao: 1,
  abertura: {
    frentista: "Gustavo", data: "06/11/2026", turno: "M",
    trocoInicial: 200, precos: TURNO.precos,
    abertoEm: iso,
    leituras: {
      gasolina: { bomba1: 100, bomba2: 200 },
      diesel: { bomba1: 300, bomba2: 400 },
    },
  },
  lancamentos, notas: [],
};

describe("fechamento de caixa", () => {
  it("impede leitura final abaixo da inicial e campos faltantes", () => {
    const texto = leiturasVazias();
    expect(validarLeiturasFinais(texto, sessao.abertura.leituras).ok).toBe(false);
    texto.gasolina.bomba1 = "99";
    texto.gasolina.bomba2 = "200";
    texto.diesel.bomba1 = "300";
    texto.diesel.bomba2 = "400";
    expect(validarLeiturasFinais(texto, sessao.abertura.leituras).ok).toBe(false);
  });

  it("aceita leituras finais válidas e mantém as iniciais", () => {
    const texto = {
      gasolina: { bomba1: "110", bomba2: "205" },
      diesel: { bomba1: "310", bomba2: "400" },
    };
    const resultado = validarLeiturasFinais(texto, sessao.abertura.leituras);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valores.gasolina.bomba1).toBe(110);
      expect(sessao.abertura.leituras.gasolina.bomba1).toBe(100);
    }
  });

  it("confere litros incluindo despesas de combustível e separa dinheiro físico", () => {
    const finais = {
      gasolina: { bomba1: 110, bomba2: 205 },
      diesel: { bomba1: 310, bomba2: 400 },
    };
    const esperado = dinheiroEsperado(sessao);
    expect(esperado).toBeCloseTo(202.9);
    const conferencia = conferirCaixa(sessao, finais, esperado);
    expect(conferencia.litrosMedidos.gasolina).toBe(15);
    expect(conferencia.litrosLancados.gasolina).toBe(15);
    expect(conferencia.litrosMedidos.diesel).toBe(10);
    expect(conferencia.situacaoBombas).toBe("certo");
    expect(conferencia.situacaoDinheiro).toBe("certo");
  });

  it("indica falta ou sobra conforme dinheiro informado", () => {
    const finais = {
      gasolina: { bomba1: 110, bomba2: 205 },
      diesel: { bomba1: 310, bomba2: 400 },
    };
    expect(conferirCaixa(sessao, finais, 200).situacaoDinheiro).toBe("faltando");
    expect(conferirCaixa(sessao, finais, 205).situacaoDinheiro).toBe("sobrando");
  });

  it("detecta diferença de litros mesmo que dinheiro esteja certo", () => {
    const finais = {
      gasolina: { bomba1: 111, bomba2: 205 },
      diesel: { bomba1: 310, bomba2: 400 },
    };
    const conferencia = conferirCaixa(sessao, finais, dinheiroEsperado(sessao));
    expect(conferencia.situacaoBombas).toBe("divergente");
    expect(conferencia.diferencaLitros.gasolina).toBe(1);
  });
});
