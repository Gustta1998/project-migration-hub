import type { Lancamento } from "./caixa";

export function registrarLancamentoComDesconto(
  dados: Omit<Lancamento, "id" | "criadoEm">,
  id: string,
  criadoEm: string,
): Lancamento[] {
  const nota: Lancamento = { ...dados, id, criadoEm };
  if ((dados.tipo !== "notas" && dados.tipo !== "cliente_outras_notas") ||
      !dados.descontoNota || dados.descontoNota <= 0) {
    return [nota];
  }
  const desconto = Math.round(dados.descontoNota * 100) / 100;
  return [
    nota,
    {
      id: id + ":desconto",
      criadoEm,
      tipo: "descontos",
      valor: desconto,
      origemDesconto: "nota",
      notaVinculadaId: id,
      responsavel: dados.responsavel,
      combustivel: dados.combustivel,
      observacao: "Desconto comercial · " + (dados.responsavel || "Cliente") +
        " · Nota vinculada",
    },
  ];
}

/** Remoção atômica: não deixar desconto sem nota ou nota sem seu desconto. */
export function removerLancamentoVinculado(lancamentos: Lancamento[], id: string): Lancamento[] {
  const alvo = lancamentos.find(l => l.id === id);
  const notaId = alvo?.notaVinculadaId ?? id;
  return lancamentos.filter(l => l.id !== id && l.id !== notaId && l.notaVinculadaId !== notaId);
}
