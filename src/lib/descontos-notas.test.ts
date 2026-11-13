import { describe, expect, it } from "vitest";
import { calcularResumo, type Lancamento } from "./caixa";
import { registrarLancamentoComDesconto, removerLancamentoVinculado } from "./descontos-notas";
import { apurarFechamento, conferirCaixa, totalPrestacaoCombustivel } from "./fechamento";
import type { SessaoCaixa } from "./abertura";

const quando = "2026-11-12T20:00:00";
const precos = { gasolina: 7.29, diesel: 7.69 };
const base: SessaoCaixa = {
  versao: 1,
  abertura: {
    frentista: "Teste", turno: "M", abertoEm: quando, data: "12/11/2026",
    trocoInicial: 0, precos,
    leituras: {gasolina: {bomba1: 0, bomba2: 0}, diesel: {bomba1: 0, bomba2: 0}},
  },
  lancamentos: [], notas: [],
};
const finais = { gasolina: {bomba1: 100, bomba2: 0}, diesel: {bomba1: 0, bomba2: 0} };
const nota = {
  tipo: "cliente_outras_notas" as const,
  valor: 715,
  litros: 100,
  combustivel: "gasolina" as const,
  precoLitro: 7.29,
  precoEspecial: 7.15,
  valorBomba: 729,
  descontoNota: 14,
  modalidade: "prazo" as const,
  responsavel: "T. Amapá",
};
const registros = registrarLancamentoComDesconto(nota, "nota-1", quando);

describe("nota com preço especial e desconto único vinculado", () => {
  it("registra R$ 715 como dívida e R$ 14 como um único desconto comercial", () => {
    expect(registros).toHaveLength(2);
    expect(registros[0]).toMatchObject({ id: "nota-1", valor: 715, precoEspecial: 7.15, descontoNota: 14 });
    expect(registros[1]).toMatchObject({ tipo: "descontos", valor: 14,
      origemDesconto: "nota", notaVinculadaId: "nota-1", responsavel: "T. Amapá" });
    const resumo = calcularResumo(registros, precos);
    expect(resumo.totalNaoRecebido).toBe(715);
    expect(resumo.totalVendas).toBe(715);
    expect(resumo.total).toBe(715);
    expect(resumo.totalDescontos).toBe(14);
    expect(resumo.litrosGasolina).toBe(100);
  });

  it("recompõe a nota de R$ 715 + R$ 14 para bater com a bomba a R$ 729", () => {
    const sessao: SessaoCaixa = { ...base, lancamentos: registros };
    const prestacao = totalPrestacaoCombustivel(sessao);
    expect(prestacao.categorias.cliente_outras_notas).toBe(715);
    expect(prestacao.categorias.descontos).toBe(14);
    expect(prestacao.descontosDeNotas).toBe(14);
    expect(prestacao.total).toBe(729);
    expect(apurarFechamento(sessao, finais, true).saldo).toBe(0);
  });

  it("preserva a opção Descontos manual como lançamento independente", () => {
    const manual: Lancamento = { id: "m", tipo: "descontos", valor: 5, criadoEm: quando };
    const sessao: SessaoCaixa = { ...base, lancamentos: [...registros, manual] };
    expect(calcularResumo(sessao.lancamentos, precos).total).toBe(720);
    expect(totalPrestacaoCombustivel(sessao).total).toBe(734);
    expect(apurarFechamento(sessao, finais, true).saldo).toBe(5);
  });

  it("não cria desconto automático com preço normal", () => {
    expect(registrarLancamentoComDesconto({
      ...nota, valor: 729, precoEspecial: 7.29, descontoNota: 0,
    }, "sem-desconto", quando)).toHaveLength(1);
  });

  it("remove nota e desconto vinculados juntos, sem afetar outras notas", () => {
    const outros = registrarLancamentoComDesconto({
      ...nota, responsavel: "Outro Cliente", valor: 715,
    }, "nota-2", quando);
    const comTudo = [...registros, ...outros];
    expect(removerLancamentoVinculado(comTudo, "nota-1")).toEqual(outros);
    expect(removerLancamentoVinculado(comTudo, "nota-1:desconto")).toEqual(outros);
  });
  it("soma desconto manual de gasolina no valor e litros equivalentes", () => {
    const manual: Lancamento = {
      id: "g", tipo: "descontos", valor: 14, combustivel: "gasolina",
      precoLitro: 7.29, litros: 1.92, criadoEm: quando, observacao: "T. Amapá",
    };
    const r = calcularResumo([manual], precos);
    expect(r.total).toBe(14);
    expect(r.totalDescontos).toBe(14);
    expect(r.valorGasolina).toBe(14);
    expect(r.litrosGasolina).toBe(1.92);
    expect(r.valorDiesel).toBe(0);
    expect(totalPrestacaoCombustivel({ ...base, lancamentos: [manual] }).total).toBe(14);
  });

  it("soma desconto manual de diesel apenas à litragem de diesel", () => {
    const manual: Lancamento = {
      id: "d", tipo: "descontos", valor: 76.9, combustivel: "diesel",
      precoLitro: 7.69, litros: 10, criadoEm: quando,
    };
    const r = calcularResumo([manual], precos);
    expect(r.total).toBe(76.9);
    expect(r.valorDiesel).toBe(76.9);
    expect(r.litrosDiesel).toBe(10);
    expect(r.litrosGasolina).toBe(0);
    const sessao: SessaoCaixa = { ...base, lancamentos: [manual] };
    expect(conferirCaixa(sessao, {gasolina: {bomba1: 0, bomba2: 0}, diesel: {bomba1: 10, bomba2: 0}}, 76.9, true).litrosLancados.diesel).toBe(10);
  });

  it("desconto automático de nota não acrescenta litros uma segunda vez", () => {
    const r = calcularResumo(registros, precos);
    expect(r.litrosGasolina).toBe(100);
    expect(r.totalNaoRecebido).toBe(715);
    expect(r.total).toBe(715);
    const sessao: SessaoCaixa = { ...base, lancamentos: registros };
    const res = conferirCaixa(sessao, finais, 729, true);
    expect(res.litrosLancados.gasolina).toBe(100);
  });

});
