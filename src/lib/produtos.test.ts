import { describe, expect, it } from "vitest";
import { CATALOGO_PRODUTOS, totalProdutoCentavos } from "./produtos";
import { calcularResumo, TURNO, type Lancamento } from "./caixa";

describe("catálogo Produto Posto", () => {
  it("mantém os produtos e preços informados", () => {
    expect(CATALOGO_PRODUTOS.map(({ id, categoria, precoCentavos }) =>
      [id, categoria, precoCentavos])).toEqual([
      ["picole", "freezer", 500],
      ["cremosinho-quadrado", "freezer", 300],
      ["geladinho", "freezer", 100],
      ["arla", "lubrificantes", 12500],
    ]);
  });

  it("calcula valores por quantidade em centavos sem perder precisão", () => {
    expect(totalProdutoCentavos(500, 2)).toBe(1000);
    expect(totalProdutoCentavos(300, 3)).toBe(900);
    expect(totalProdutoCentavos(12500, 2)).toBe(25000);
    expect(totalProdutoCentavos(500, 0)).toBe(0);
    expect(totalProdutoCentavos(500, 1.5)).toBe(0);
  });

  it("soma produtos nas vendas e não inventa litros de gasolina ou diesel", () => {
    const lancamento: Lancamento = {
      id: "produto-1",
      tipo: "produto_posto",
      valor: 10,
      produtoId: "picole",
      produtoNome: "Picolé",
      produtoCategoria: "freezer",
      precoUnitarioProduto: 5,
      quantidadeProduto: 2,
      criadoEm: "2026-11-07T12:00:00",
    };
    const resumo = calcularResumo([lancamento], TURNO.precos);
    expect(resumo.totalVendas).toBe(10);
    expect(resumo.total).toBe(10);
    expect(resumo.porTipo.produto_posto).toEqual({ valor: 10, quantidade: 1 });
    expect(resumo.valorGasolina).toBe(0);
    expect(resumo.valorDiesel).toBe(0);
    expect(resumo.litrosGasolina).toBe(0);
    expect(resumo.litrosDiesel).toBe(0);
  });
});
