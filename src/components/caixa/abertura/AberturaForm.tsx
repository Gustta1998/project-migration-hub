import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  Clock3,
  Droplet,
  Gauge,
  LockKeyholeOpen,
  UserRound,
  Wallet,
} from "lucide-react";
import {
  FORM_VAZIO,
  FRENTISTAS_INICIAIS,
  formatDataBR,
  TURNOS,
  validarAbertura,
  type AberturaCaixa,
  type AberturaForm as Form,
  type CampoAbertura,
  type ErrosAbertura,
} from "@/lib/abertura";

interface Props {
  posto: string;
  onVoltar: () => void;
  onConfirmar: (a: AberturaCaixa) => void;
}

const inputBase =
  "w-full rounded-xl border bg-background px-3.5 py-2.5 text-[15px] font-semibold outline-none transition-colors placeholder:font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-ring/30";
const inputOk = "border-input";
const inputErro = "border-danger ring-2 ring-danger/15";

export function AberturaForm({ posto, onVoltar, onConfirmar }: Props) {
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [erros, setErros] = useState<ErrosAbertura>({});
  const [tentou, setTentou] = useState(false);
  const [hoje, setHoje] = useState("");

  useEffect(() => setHoje(formatDataBR(new Date())), []);

  const set = (campo: CampoAbertura, valor: string) => {
    const novo = { ...form, [campo]: valor } as Form;
    setForm(novo);
    if (tentou) {
      const r = validarAbertura(novo, new Date());
      setErros(r.ok ? {} : r.erros);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTentou(true);
    const r = validarAbertura(form, new Date());
    if (!r.ok) {
      setErros(r.erros);
      const primeiro = Object.keys(r.erros)[0];
      document.querySelector<HTMLElement>(`[name="${primeiro}"]`)?.focus();
      return;
    }
    setErros({});
    onConfirmar(r.abertura);
  };

  const numerico = (v: string) => v.replace(/[^\d.,]/g, "");
  const qtdErros = Object.keys(erros).length;

  return (
    <form
      noValidate
      onSubmit={submit}
      className="animate-rise w-full overflow-hidden rounded-3xl border border-border bg-card shadow-lift"
    >
      {/* Cabeçalho */}
      <div className="relative overflow-hidden bg-hero px-6 py-5 text-ink-foreground sm:px-8">
        <div className="pointer-events-none absolute -right-8 top-0 flex h-full rotate-12 gap-3 opacity-[0.07]">
          <span className="h-full w-6 bg-ink-foreground" />
          <span className="h-full w-3 bg-ink-foreground" />
          <span className="h-full w-1.5 bg-ink-foreground" />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onVoltar}
              aria-label="Voltar"
              className="grid h-10 w-10 place-items-center rounded-xl border border-ink-border bg-ink-foreground/[0.06] text-ink-muted transition-colors hover:text-ink-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="eyebrow text-ink-muted">{posto} · Início do turno</p>
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Abertura do caixa
              </h2>
            </div>
          </div>
          <p className="max-w-xs text-sm text-ink-muted">
            Preencha os dados do turno. Todos os campos são obrigatórios.
          </p>
        </div>
      </div>

      {/* Seções */}
      <div className="grid divide-y divide-border lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)_minmax(0,1.2fr)] lg:divide-x lg:divide-y-0">
        {/* Frentista */}
        <section className="p-6 sm:p-7">
          <SecaoTitulo icon={<UserRound className="h-4 w-4" />} titulo="Informações do frentista" />
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
            <Campo label="Nome do frentista" erro={erros.frentista} className="col-span-2">
              <select
                name="frentista"
                autoFocus
                required
                value={form.frentista}
                onChange={(e) => set("frentista", e.target.value)}
                className={`${inputBase} ${erros.frentista ? inputErro : inputOk}`}
              >
                <option value="" disabled>Selecione o frentista</option>
                {FRENTISTAS_INICIAIS.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </Campo>

            <Campo label="Data" grupo>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-secondary px-3.5 py-2.5 text-[15px] font-semibold text-secondary-foreground num">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {hoje || "—"}
              </div>
            </Campo>

            <Campo label="Troco inicial" erro={erros.troco}>
              <Prefixado prefixo="R$" erro={!!erros.troco}>
                <input
                  name="troco"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.troco}
                  onChange={(e) => set("troco", numerico(e.target.value))}
                  className="w-full bg-transparent py-2.5 pr-3.5 text-[15px] font-semibold outline-none num placeholder:text-muted-foreground/50"
                />
              </Prefixado>
            </Campo>

            <Campo label="Turno de trabalho" erro={erros.turno} className="col-span-2" grupo>
              <div
                role="radiogroup"
                aria-label="Turno de trabalho"
                className={`grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1 ${erros.turno ? "ring-2 ring-danger/40" : ""}`}
              >
                {TURNOS.map((t) => {
                  const ativo = form.turno === t.codigo;
                  return (
                    <button
                      key={t.codigo}
                      type="button"
                      role="radio"
                      aria-checked={ativo}
                      name={t.codigo === "M" ? "turno" : undefined}
                      onClick={() => set("turno", t.codigo)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-1.5 py-2 text-sm font-bold transition-all ${
                        ativo
                          ? "bg-card text-primary shadow-card"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`grid h-6 min-w-6 place-items-center rounded-md px-1 font-display text-xs font-extrabold ${
                          ativo ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                        }`}
                      >
                        {t.codigo}
                      </span>
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </Campo>
          </div>
        </section>

        {/* Preços */}
        <section className="bg-muted/50 p-6 sm:p-7">
          <SecaoTitulo icon={<Wallet className="h-4 w-4" />} titulo="Preços dos combustíveis" />
          <div className="mt-5 space-y-4">
            <PrecoCampo
              nome="precoGasolina"
              label="Gasolina"
              tone="gasolina"
              valor={form.precoGasolina}
              erro={erros.precoGasolina}
              onChange={(v) => set("precoGasolina", numerico(v))}
            />
            <PrecoCampo
              nome="precoDiesel"
              label="Diesel"
              tone="diesel"
              valor={form.precoDiesel}
              erro={erros.precoDiesel}
              onChange={(v) => set("precoDiesel", numerico(v))}
            />
          </div>
        </section>

        {/* Leituras */}
        <section className="p-6 sm:p-7">
          <SecaoTitulo icon={<Gauge className="h-4 w-4" />} titulo="Leituras iniciais das bombas" />
          <div className="mt-5 space-y-4">
            {(["diesel", "gasolina"] as const).map((c) => (
              <div key={c} className="rounded-2xl border border-border p-4">
                <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
                  <Droplet
                    className={`h-4 w-4 ${c === "diesel" ? "text-diesel" : "text-gasolina"}`}
                    fill="currentColor"
                  />
                  {c === "diesel" ? "Diesel" : "Gasolina"}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {([1, 2] as const).map((b) => {
                    const campo = `${c}Bomba${b}` as CampoAbertura;
                    return (
                      <Campo key={b} label={`Bomba ${b} — Leitura inicial`} erro={erros[campo]}>
                        <input
                          name={campo}
                          inputMode="decimal"
                          placeholder="0,000"
                          value={form[campo]}
                          onChange={(e) => set(campo, numerico(e.target.value))}
                          className={`${inputBase} num ${erros[campo] ? inputErro : inputOk}`}
                        />
                      </Campo>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Rodapé */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/40 px-6 py-4 sm:px-8">
        {qtdErros > 0 ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-danger">
            <CircleAlert className="h-4 w-4" />
            {qtdErros === 1
              ? "Corrija o campo destacado para abrir o caixa."
              : `Corrija os ${qtdErros} campos destacados para abrir o caixa.`}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            Os preços informados serão usados nos cálculos de vendas e litros do turno.
          </p>
        )}
        <button
          type="submit"
          className="inline-flex items-center gap-3 rounded-xl bg-total px-7 py-3.5 font-display text-lg font-bold uppercase tracking-[0.06em] text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          <LockKeyholeOpen className="h-5 w-5" strokeWidth={2.25} />
          Confirmar e abrir caixa
        </button>
      </div>
    </form>
  );
}

function SecaoTitulo({ icon, titulo }: { icon: ReactNode; titulo: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
        {icon}
      </span>
      <h3 className="font-display text-xl font-bold tracking-tight">{titulo}</h3>
    </div>
  );
}

function Campo({
  label,
  erro,
  className = "",
  grupo = false,
  children,
}: {
  label: string;
  erro?: string | undefined;
  className?: string;
  grupo?: boolean;
  children: ReactNode;
}) {
  const Tag = grupo ? "div" : "label";
  return (
    <Tag className={`block min-w-0 ${className}`}>
      <span className="eyebrow block leading-snug text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {erro && <span className="animate-fade mt-1 block text-xs font-semibold text-danger">{erro}</span>}
    </Tag>
  );
}

function Prefixado({
  prefixo,
  sufixo,
  erro,
  children,
}: {
  prefixo: string;
  sufixo?: string;
  erro: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border bg-background pl-3.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30 ${
        erro ? inputErro : inputOk
      }`}
    >
      <span className="font-display text-base font-bold text-muted-foreground">{prefixo}</span>
      {children}
      {sufixo && (
        <span className="pr-3.5 text-xs font-semibold text-muted-foreground">{sufixo}</span>
      )}
    </div>
  );
}

function PrecoCampo({
  nome,
  label,
  tone,
  valor,
  erro,
  onChange,
}: {
  nome: CampoAbertura;
  label: string;
  tone: "gasolina" | "diesel";
  valor: string;
  erro?: string | undefined;
  onChange: (v: string) => void;
}) {
  const bar = tone === "gasolina" ? "bg-gasolina" : "bg-diesel";
  const text = tone === "gasolina" ? "text-gasolina" : "text-diesel";
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="p-4">
        <Campo label={`Preço da ${label.toLowerCase()} (R$/litro)`} erro={erro}>
          <div className="flex items-center gap-3">
            <Droplet className={`h-5 w-5 shrink-0 ${text}`} fill="currentColor" />
            <div className="flex-1">
              <Prefixado prefixo="R$" sufixo="/L" erro={!!erro}>
                <input
                  name={nome}
                  inputMode="decimal"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full bg-transparent py-2.5 font-display text-xl font-bold outline-none num placeholder:text-muted-foreground/40"
                />
              </Prefixado>
            </div>
          </div>
        </Campo>
      </div>
      <div className={`h-1 w-full ${bar}`} />
    </div>
  );
}
