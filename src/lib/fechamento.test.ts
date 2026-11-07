import { describe, expect, it } from "vitest";
import {
  avaliarSaldoCaixa, conferirCaixa, dinheiroEsperado, giroMedido, validarLeiturasFinais, leiturasVazias,
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
    const esperado = dinheiroEsperado(sessao, finais);
    expect(esperado).toBeCloseTo(322.9);
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
    expect(conferirCaixa(sessao, finais, 325).situacaoDinheiro).toBe("sobrando");
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

describe("conferência do caixa exclusivo de gasolina", () => {
  it("não considera produtos do posto nem recebimentos de diesel na diferença", () => {
    const dados: SessaoCaixa = {
      ...sessao,
      lancamentos: [
        { id: "g", tipo: "dinheiro", combustivel: "gasolina", valor: 100, criadoEm: iso },
        { id: "p", tipo: "pix_manual", combustivel: "gasolina", valor: 80, criadoEm: iso },
        { id: "n", tipo: "notas", combustivel: "gasolina", valor: 60, criadoEm: iso },
        { id: "x", tipo: "produto_posto", produtoId: "geladinho", valor: 15, criadoEm: iso },
        { id: "d", tipo: "pix_maquininha", combustivel: "diesel", valor: 1000, criadoEm: iso },
        { id: "s", tipo: "sangria", valor: 25, criadoEm: iso },
        { id: "a", tipo: "descontos", valor: 5, criadoEm: iso },
      ],
    };
    // Troco (200) + venda em dinheiro de gasolina (100) + sangria (25) + desconto (5).
    expect(dinheiroEsperado(dados)).toBe(330);
    const comOutrosProdutos: SessaoCaixa = {
      ...dados,
      lancamentos: [
        ...dados.lancamentos,
        { id: "x2", tipo: "produto_posto", valor: 125, criadoEm: iso },
      ],
    };
    expect(dinheiroEsperado(comOutrosProdutos)).toBe(330);
  });
});

describe("cálculo reativo pelas leituras finais", () => {
  const finais = {
    gasolina: { bomba1: 110, bomba2: 205 },
    diesel: { bomba1: 310, bomba2: 400 },
  };

  it("calcula giro como finais menos iniciais das quatro bombas", () => {
    expect(giroMedido(sessao.abertura.leituras, finais)).toEqual({
      gasolina: 15, diesel: 10,
    });
  });

  it("recalcula o dinheiro esperado quando a leitura final de gasolina aumenta", () => {
    const esperado15 = dinheiroEsperado(sessao, finais);
    const esperado16 = dinheiroEsperado(sessao, {
      ...finais,
      gasolina: { ...finais.gasolina, bomba1: 111 },
    });
    expect(esperado15).toBeCloseTo(322.9);
    expect(esperado16).toBeCloseTo(330.19);
    expect(esperado16 - esperado15).toBeCloseTo(7.29);
  });

  it("não altera conferência de gasolina ao mudar apenas bomba diesel", () => {
    const esperado = dinheiroEsperado(sessao, finais);
    expect(dinheiroEsperado(sessao, {
      ...finais,
      diesel: { ...finais.diesel, bomba1: 400 },
    })).toBe(esperado);
  });

  it("produtos do posto ficam fora do giro e da diferença financeira", () => {
    const produto: Lancamento = {
      id: "produto", tipo: "produto_posto", valor: 125,
      produtoId: "arla", quantidadeProduto: 1,
      criadoEm: iso,
    };
    expect(dinheiroEsperado({ ...sessao, lancamentos: [...sessao.lancamentos, produto] }, finais))
      .toBe(dinheiroEsperado(sessao, finais));
  });

  it("conferência final usa leituras medidas, não somente vendas registradas", () => {
    const finaisComMaisGas = {
      ...finais, gasolina: { bomba1: 111, bomba2: 205 },
    };
    const conferencia = conferirCaixa(sessao, finaisComMaisGas, 322.9);
    expect(conferencia.dinheiroEsperado).toBeCloseTo(330.19);
    expect(conferencia.situacaoDinheiro).toBe("faltando");
    expect(conferencia.diferencaLitros.gasolina).toBe(1);
  });
});

describe("confirmação de troco retirado e soma de ajustes", () => {
  const finais = {
    gasolina: { bomba1: 110, bomba2: 205 },
    diesel: { bomba1: 310, bomba2: 400 },
  };

  it("inclui o troco quando o funcionário informa que continua no caixa", () => {
    expect(dinheiroEsperado(sessao, finais, false)).toBeCloseTo(322.9);
    const conferencia = conferirCaixa(sessao, finais, 322.9, false);
    expect(conferencia.trocoRetirado).toBe(false);
    expect(conferencia.situacaoDinheiro).toBe("certo");
  });

  it("exclui o troco quando o funcionário confirma retirada", () => {
    expect(dinheiroEsperado(sessao, finais, true)).toBeCloseTo(122.9);
    const conferencia = conferirCaixa(sessao, finais, 122.9, true);
    expect(conferencia.trocoRetirado).toBe(true);
    expect(conferencia.situacaoDinheiro).toBe("certo");
  });

  it("soma descontos e sangrias, inclusive última sangria, sem subtrair", () => {
    const comAjustes: SessaoCaixa = {
      ...sessao,
      lancamentos: [
        ...sessao.lancamentos,
        { id: "desconto-extra", tipo: "descontos", valor: 12, criadoEm: iso },
        { id: "ultima-sangria", tipo: "sangria", valor: 30, criadoEm: iso },
      ],
    };
    expect(dinheiroEsperado(comAjustes, finais, true)).toBeCloseTo(164.9);
  });

  it("não muda a conferência de gasolina devido a produtos do posto", () => {
    const comProduto: SessaoCaixa = {
      ...sessao,
      lancamentos: [
        ...sessao.lancamentos,
        { id: "p", tipo: "produto_posto", valor: 125, criadoEm: iso },
      ],
    };
    expect(dinheiroEsperado(comProduto, finais, true)).toBe(dinheiroEsperado(sessao, finais, true));
  });
});

describe("saldo do caixa convertido de litros em reais", () => {
  it("mostra falta quando o giro é menor que os litros registrados", () => {
    expect(avaliarSaldoCaixa(-0.602, 7.29)).toEqual({ saldo: -4.39, status: "bom" });
  });

  it("mostra sobra quando o giro é maior que os litros registrados", () => {
    expect(avaliarSaldoCaixa(0.602, 7.29)).toEqual({ saldo: 4.39, status: "bom" });
  });

  it("classifica por valor absoluto, sem distinguir falta de sobra", () => {
    expect(avaliarSaldoCaixa(5, 1).status).toBe("bom");
    expect(avaliarSaldoCaixa(-5, 1).status).toBe("bom");
    expect(avaliarSaldoCaixa(5.01, 1).status).toBe("regular");
    expect(avaliarSaldoCaixa(-8, 1).status).toBe("regular");
    expect(avaliarSaldoCaixa(10, 1).status).toBe("regular");
    expect(avaliarSaldoCaixa(-10.01, 1).status).toBe("divergente");
    expect(avaliarSaldoCaixa(11, 1).status).toBe("divergente");
    expect(avaliarSaldoCaixa(0, 7.29)).toEqual({ saldo: 0, status: "bom" });
  });

  it("usa a diferença real da bomba e o preço da abertura", () => {
    const finais = {
      gasolina: { bomba1: 110, bomba2: 205 },
      diesel: { bomba1: 310, bomba2: 400 },
    };
    const conferencia = conferirCaixa(sessao, finais, dinheiroEsperado(sessao, finais));
    expect(conferencia.diferencaLitros.gasolina).toBe(0);
    expect(avaliarSaldoCaixa(conferencia.diferencaLitros.gasolina, sessao.abertura.precos.gasolina).saldo).toBe(0);
    const outra = conferirCaixa(sessao, { ...finais, gasolina: { bomba1: 111, bomba2: 205 } }, dinheiroEsperado(sessao, finais));
    expect(avaliarSaldoCaixa(outra.diferencaLitros.gasolina, sessao.abertura.precos.gasolina).saldo).toBe(7.29);
  });
});
