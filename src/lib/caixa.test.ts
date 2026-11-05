import { describe, expect, it } from "vitest";
import {
  calcularResumo,
  confirmarAbastecimento,
  desfazerAbastecimento,
  LANCAMENTOS_INICIAIS,
  NOTAS,
  notasEmAberto,
  TURNO,
  type Lancamento,
} from "./caixa";

describe("calcularResumo", () => {
  it("soma as vendas de gasolina do turno em R$ 483,00", () => {
    const r = calcularResumo(LANCAMENTOS_INICIAIS, TURNO.precos);
    expect(r.valorGasolina).toBe(483);
    expect(r.total).toBe(483);
  });

  it("calcula os litros dividindo o valor pelo preço do combustível", () => {
    const r = calcularResumo(LANCAMENTOS_INICIAIS, TURNO.precos);
    expect(r.litrosGasolina).toBe(66.255);
  });

  it("descontos abatem o total, sangria e despesas não", () => {
    const extra: Lancamento[] = [
      ...LANCAMENTOS_INICIAIS,
      { id: "d", tipo: "descontos", valor: 10, criadoEm: "2026-11-05T01:00:00" },
      { id: "s", tipo: "sangria", valor: 100, criadoEm: "2026-11-05T01:00:00" },
    ];
    const r = calcularResumo(extra, TURNO.precos);
    expect(r.total).toBe(473);
    expect(r.totalSaidas).toBe(100);
  });
});

describe("notas autorizadas", () => {
  it("nota confirmada como abastecida não aparece para o próximo turno", () => {
    const depois = confirmarAbastecimento(NOTAS, "n1", "Gustavo", "2026-11-05T01:20:00");
    expect(notasEmAberto(depois).map((n) => n.id)).not.toContain("n1");
    expect(depois.find((n) => n.id === "n1")?.abastecidaPor).toBe("Gustavo");
  });

  it("nota pendente (sem autorização) não pode ser confirmada", () => {
    const depois = confirmarAbastecimento(NOTAS, "n3", "Gustavo", "2026-11-05T01:20:00");
    expect(depois.find((n) => n.id === "n3")?.status).toBe("pendente");
    expect(notasEmAberto(depois).map((n) => n.id)).toContain("n3");
  });

  it("desfazer devolve a nota para a lista em aberto", () => {
    const conf = confirmarAbastecimento(NOTAS, "n2", "Gustavo", "2026-11-05T01:20:00");
    const volta = desfazerAbastecimento(conf, "n2");
    expect(notasEmAberto(volta).map((n) => n.id)).toContain("n2");
  });
});
