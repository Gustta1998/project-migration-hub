import { describe, expect, it } from "vitest";
import { FORM_VAZIO, lerSessao, parseNumeroBR, validarAbertura, type AberturaForm } from "./abertura";

const agora = new Date(2026, 10, 5, 6, 30);
const valido: AberturaForm = {
  frentista: "  Gustavo  ",
  turno: "M",
  troco: "200,00",
  precoGasolina: "7,29",
  precoDiesel: "7,39",
  dieselBomba1: "125430,5",
  dieselBomba2: "98200",
  gasolinaBomba1: "301122,75",
  gasolinaBomba2: "1.204,3",
};

describe("abertura do caixa", () => {
  it("formulário vazio bloqueia a abertura em todos os campos obrigatórios", () => {
    const r = validarAbertura(FORM_VAZIO, agora);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.erros).sort()).toEqual(Object.keys(FORM_VAZIO).sort());
  });

  it("aceita troco inicial de R$ 0,00", () => {
    const r = validarAbertura({ ...valido, troco: "0,00" }, agora);
    expect(r.ok && r.abertura.trocoInicial).toBe(0);
  });

  it("preço da gasolina ou diesel precisa ser maior que zero", () => {
    const r = validarAbertura({ ...valido, precoGasolina: "0", precoDiesel: "0,00" }, agora);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros.precoGasolina).toBeDefined();
      expect(r.erros.precoDiesel).toBeDefined();
    }
  });

  it("leitura de bomba precisa ser numérica", () => {
    const r = validarAbertura({ ...valido, dieselBomba2: "abc" }, agora);
    expect(!r.ok && r.erros.dieselBomba2).toBeTruthy();
  });

  it("data vem do computador no formato DD/MM/AAAA e guarda preços e leituras com decimais", () => {
    const r = validarAbertura(valido, agora);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.abertura.data).toBe("05/11/2026");
      expect(r.abertura.frentista).toBe("Gustavo");
      expect(r.abertura.precos).toEqual({ gasolina: 7.29, diesel: 7.39 });
      expect(r.abertura.leituras.diesel.bomba1).toBe(125430.5);
      expect(r.abertura.leituras.gasolina.bomba2).toBe(1204.3);
    }
  });

  it("lê números em formato brasileiro", () => {
    expect(parseNumeroBR("1.234,56")).toBe(1234.56);
    expect(parseNumeroBR("7.29")).toBe(7.29);
    expect(parseNumeroBR("")).toBeNull();
  });

  it("caixa salvo é recuperado após atualizar a página; dado corrompido é ignorado", () => {
    const r = validarAbertura(valido, agora);
    if (!r.ok) throw new Error("inválido");
    const salvo = JSON.stringify({ versao: 1, abertura: r.abertura, lancamentos: [], notas: [] });
    expect(lerSessao(salvo)?.abertura.frentista).toBe("Gustavo");
    expect(lerSessao("{quebrado")).toBeNull();
  });
});
