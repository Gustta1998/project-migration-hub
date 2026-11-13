import type { Lancamento, NotaAutorizada, Precos } from "./caixa";

/** Cadastro inicial de frentistas; futuramente alimentado pelo painel do gerente. */
export const FRENTISTAS_INICIAIS = [
  "GUSTAVO",
  "ROAN",
  "NAYZA",
  "ROANNY",
  "LUCIVANDO",
  "TIAGO DIARISTA",
] as const;

export type CodigoTurno = "M" | "T1" | "MN";

export const TURNOS: { codigo: CodigoTurno; label: string; descricao: string }[] = [
  { codigo: "M", label: "Manhã", descricao: "Turno da manhã" },
  { codigo: "T1", label: "Tarde", descricao: "Turno da tarde" },
  { codigo: "MN", label: "Turno MN", descricao: "Turno MN" },
];

export const turnoInfo = (c: CodigoTurno) => TURNOS.find((t) => t.codigo === c)!;

export interface LeiturasBombas {
  diesel: { bomba1: number; bomba2: number };
  gasolina: { bomba1: number; bomba2: number };
}

export interface AberturaCaixa {
  frentista: string;
  data: string; // DD/MM/AAAA
  turno: CodigoTurno;
  trocoInicial: number;
  precos: Precos;
  leituras: LeiturasBombas;
  abertoEm: string; // ISO
}

/** Valores digitados no formulário (texto cru). */
export interface AberturaForm {
  frentista: string;
  turno: CodigoTurno | "";
  troco: string;
  precoGasolina: string;
  precoDiesel: string;
  dieselBomba1: string;
  dieselBomba2: string;
  gasolinaBomba1: string;
  gasolinaBomba2: string;
}

export type CampoAbertura = keyof AberturaForm;
export type ErrosAbertura = Partial<Record<CampoAbertura, string>>;

export const FORM_VAZIO: AberturaForm = {
  frentista: "",
  turno: "",
  troco: "",
  precoGasolina: "",
  precoDiesel: "",
  dieselBomba1: "",
  dieselBomba2: "",
  gasolinaBomba1: "",
  gasolinaBomba2: "",
};

/**
 * Lê número no formato brasileiro ("1.234,56") ou com ponto decimal ("1234.56").
 * Retorna null quando vazio ou inválido.
 */
export function parseNumeroBR(texto: string): number | null {
  const t = texto.trim().replace(/\s/g, "").replace(/^R\$/i, "");
  if (!t) return null;
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  if (!/^\d+(\.\d+)?$/.test(normal)) return null;
  return Number(normal);
}

export const formatDataBR = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export function validarAbertura(
  form: AberturaForm,
  agora: Date,
): { ok: true; abertura: AberturaCaixa } | { ok: false; erros: ErrosAbertura } {
  const erros: ErrosAbertura = {};

  const frentista = form.frentista.trim().replace(/\s+/g, " ");
  if (!frentista) erros.frentista = "Informe o nome do frentista.";
  if (!form.turno) erros.turno = "Selecione o turno de trabalho.";

  const troco = parseNumeroBR(form.troco);
  if (troco === null) erros.troco = "Informe o troco inicial (pode ser R$ 0,00).";

  const preco = (campo: "precoGasolina" | "precoDiesel") => {
    const v = parseNumeroBR(form[campo]);
    if (v === null || v <= 0) erros[campo] = "Informe um preço maior que zero.";
    return v ?? 0;
  };
  const gasolina = preco("precoGasolina");
  const diesel = preco("precoDiesel");

  const leitura = (campo: "dieselBomba1" | "dieselBomba2" | "gasolinaBomba1" | "gasolinaBomba2") => {
    const v = parseNumeroBR(form[campo]);
    if (v === null) erros[campo] = "Informe a leitura inicial.";
    return v ?? 0;
  };
  const leituras: LeiturasBombas = {
    diesel: { bomba1: leitura("dieselBomba1"), bomba2: leitura("dieselBomba2") },
    gasolina: { bomba1: leitura("gasolinaBomba1"), bomba2: leitura("gasolinaBomba2") },
  };

  if (Object.keys(erros).length > 0) return { ok: false, erros };

  return {
    ok: true,
    abertura: {
      frentista,
      data: formatDataBR(agora),
      turno: form.turno as CodigoTurno,
      trocoInicial: Math.round(troco! * 100) / 100,
      precos: { gasolina, diesel },
      leituras,
      abertoEm: agora.toISOString(),
    },
  };
}

/* ---------- Persistência local do caixa aberto ---------- */

export interface SessaoCaixa {
  versao: 1;
  abertura: AberturaCaixa;
  lancamentos: Lancamento[];
  notas: NotaAutorizada[];
}

export const CHAVE_SESSAO = "posto-almeida:caixa-aberto";

export function lerSessao(raw: string | null): SessaoCaixa | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<SessaoCaixa>;
    const a = s?.abertura;
    if (
      s?.versao !== 1 ||
      !a ||
      typeof a.frentista !== "string" ||
      !a.precos ||
      typeof a.precos.gasolina !== "number" ||
      typeof a.precos.diesel !== "number" ||
      !Array.isArray(s.lancamentos) ||
      !Array.isArray(s.notas)
    )
      return null;
    return s as SessaoCaixa;
  } catch {
    return null;
  }
}

export function carregarSessao(): SessaoCaixa | null {
  try {
    return lerSessao(window.localStorage.getItem(CHAVE_SESSAO));
  } catch {
    return null;
  }
}

export function salvarSessao(s: SessaoCaixa) {
  try {
    window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(s));
  } catch {
    /* armazenamento indisponível: segue só em memória */
  }
}
