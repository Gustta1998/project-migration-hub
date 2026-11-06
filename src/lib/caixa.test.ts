import { describe, expect, it } from "vitest";
import {
  calcularResumo,
  confirmarAbastecimento,
  desfazerAbastecimento,
  filtrarHistorico,
  FILTROS_HISTORICO,
  FUNCIONARIOS,
  TIPOS_DESPESA_FUNCIONARIO,
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

describe("filtros do histórico", () => {
  const ls: Lancamento[] = [
    { id: "v", tipo: "dinheiro", valor: 10, combustivel: "gasolina", criadoEm: "2026-11-05T01:00:00" },
    { id: "n", tipo: "notas", valor: 20, combustivel: "diesel", criadoEm: "2026-11-05T01:00:00" },
    { id: "o", tipo: "cliente_outras_notas", valor: 30, combustivel: "diesel", criadoEm: "2026-11-05T01:00:00" },
    { id: "d", tipo: "descontos", valor: 5, criadoEm: "2026-11-05T01:00:00" },
    { id: "s", tipo: "sangria", valor: 50, criadoEm: "2026-11-05T01:00:00" },
    { id: "x", tipo: "despesas", valor: 8, criadoEm: "2026-11-05T01:00:00" },
  ];
  const ids = (f: Parameters<typeof filtrarHistorico>[1]) => filtrarHistorico(ls, f).map((l) => l.id);

  it("oferece Todos, Vendas, Descontos, Sangrias e Notas", () => {
    expect(FILTROS_HISTORICO.map((f) => f.label)).toEqual(["Todos", "Vendas", "Descontos", "Sangrias", "Notas"]);
  });
  it("Todos mostra tudo", () => expect(ids("todos")).toHaveLength(6));
  it("Vendas mostra só recebimentos", () => expect(ids("vendas")).toEqual(["v", "n", "o"]));
  it("Descontos mostra só descontos", () => expect(ids("descontos")).toEqual(["d"]));
  it("Sangrias mostra só sangrias", () => expect(ids("sangrias")).toEqual(["s"]));
  it("Notas mostra notas e notas de outros clientes", () => expect(ids("notas")).toEqual(["n", "o"]));
});

describe("lançamentos de notas e clientes outras notas", () => {
  const iso = "2026-11-05T10:00:00";
  const lancamentos: Lancamento[] = [
    {
      id: "nota", tipo: "notas", valor: 150, combustivel: "diesel",
      litros: 20, precoLitro: 7.5, responsavel: "Maria",
      destinoNota: "Secretaria de Saúde", criadoEm: iso,
    },
    {
      id: "prazo", tipo: "cliente_outras_notas", valor: 72.9,
      combustivel: "gasolina", litros: 10, precoLitro: 7.29,
      responsavel: "João", modalidade: "prazo", criadoEm: iso,
    },
    {
      id: "vista", tipo: "cliente_outras_notas", valor: 36.45,
      combustivel: "gasolina", litros: 5, precoLitro: 7.29,
      responsavel: "Ana", modalidade: "avista", criadoEm: iso,
    },
  ];

  it("inclui notas faturadas e a prazo no total do caixa, mantendo o indicador de não recebido", () => {
    const r = calcularResumo(lancamentos, TURNO.precos);
    expect(r.totalVendas).toBeCloseTo(259.35);
    expect(r.totalNaoRecebido).toBeCloseTo(222.9);
    expect(r.total).toBeCloseTo(259.35);
    expect(r.litrosGasolina).toBe(15);
    expect(r.litrosDiesel).toBe(20);
  });

  it("preserva identificação, destino e pagamento dos lançamentos", () => {
    expect(lancamentos[0].destinoNota).toBe("Secretaria de Saúde");
    expect(lancamentos[0].responsavel).toBe("Maria");
    expect(lancamentos[1].modalidade).toBe("prazo");
    expect(filtrarHistorico(lancamentos, "notas")).toHaveLength(3);
  });
});

describe("despesas de funcionários", () => {
  it("mantém os seis responsáveis e as quatro categorias solicitadas", () => {
    expect([...FUNCIONARIOS]).toEqual(["LUCIVANDO", "ROAN", "GUSTAVO", "NAYZA", "ROANY", "MOABE GERENTE"]);
    expect(TIPOS_DESPESA_FUNCIONARIO.map((t) => t.id)).toEqual([
      "vale", "gasolina", "diesel", "dinheiro",
    ]);
  });

  it("guarda funcionário, tipo e litros para futura conferência mensal", () => {
    const l: Lancamento = {
      id: "funcionario-1",
      tipo: "despesas",
      valor: 72.9,
      funcionario: "ROANY",
      tipoDespesaFuncionario: "gasolina",
      combustivel: "gasolina",
      litros: 10,
      precoLitro: 7.29,
      criadoEm: "2026-11-06T10:00:00",
    };
    const r = calcularResumo([l], TURNO.precos);
    expect(l.funcionario).toBe("ROANY");
    expect(l.tipoDespesaFuncionario).toBe("gasolina");
    expect(l.litros).toBe(10);
    expect(r.totalSaidas).toBeCloseTo(72.9);
    expect(r.valorGasolina).toBe(0);
    expect(r.total).toBe(0);
  });
});

describe("despesas gerais — Outros", () => {
  it("registra gasolina e diesel em Outros com litros e preço", () => {
    const combustiveis: Lancamento[] = [
      {
        id: "outros-gasolina", tipo: "despesas", valor: 72.9,
        tipoDespesaGeral: "outros", descricaoDespesa: "Veículo de apoio",
        combustivel: "gasolina", litros: 10, precoLitro: 7.29,
        criadoEm: "2026-11-06T11:30:00",
      },
      {
        id: "outros-diesel", tipo: "despesas", valor: 73.9,
        tipoDespesaGeral: "outros", descricaoDespesa: "Máquina do posto",
        combustivel: "diesel", litros: 10, precoLitro: 7.39,
        criadoEm: "2026-11-06T11:35:00",
      },
    ];
    const resumo = calcularResumo(combustiveis, TURNO.precos);
    expect(combustiveis.every((l) => l.funcionario === undefined)).toBe(true);
    expect(combustiveis.map((l) => l.combustivel)).toEqual(["gasolina", "diesel"]);
    expect(resumo.totalSaidas).toBeCloseTo(146.8);
    expect(resumo.valorGasolina).toBe(0);
    expect(resumo.valorDiesel).toBe(0);
  });

  it("registra gasto de cozinha sem atribuir a nenhum funcionário", () => {
    const l: Lancamento = {
      id: "cozinha-1",
      tipo: "despesas",
      tipoDespesaGeral: "outros",
      descricaoDespesa: "Compras para a cozinha",
      observacao: "Outros · Compras para a cozinha",
      valor: 120,
      criadoEm: "2026-11-06T11:30:00",
    };
    expect(l.funcionario).toBeUndefined();
    expect(l.tipoDespesaFuncionario).toBeUndefined();
    expect(l.tipoDespesaGeral).toBe("outros");
    expect(l.descricaoDespesa).toBe("Compras para a cozinha");
    const r = calcularResumo([l], TURNO.precos);
    expect(r.totalSaidas).toBe(120);
    expect(r.porTipo.despesas.valor).toBe(120);
  });
});
