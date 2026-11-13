import { useMemo, useState } from "react";
import { Droplet, Inbox, Trash2, TrendingUp } from "lucide-react";
import {
  filtrarHistorico,
  FILTROS_HISTORICO,
  formatBRL,
  formatDataHora,
  formatLitros,
  litrosDe,
  tipoInfo,
  TIPOS,
  type FiltroHistorico,
  type Lancamento,
  type Precos,
  type Resumo,
} from "@/lib/caixa";
import { CATEGORIA_TILE_INK, TIPO_ICON } from "./icons";
import { litrosGasolinaSangrias, totaisSangriaCombustivel } from "@/lib/sangrias";

interface Props {
  resumo: Resumo;
  lancamentos: Lancamento[];
  precos: Precos;
  trocoInicial: number;
  onRemove: (id: string) => void;
}

export function ResumoPanel({ resumo, lancamentos, precos, trocoInicial, onRemove }: Props) {
  const combustivelSangrias = totaisSangriaCombustivel(lancamentos);
  const litrosGasolinaSangrados = litrosGasolinaSangrias(lancamentos, precos.gasolina);
  const descontosComerciais = lancamentos
    .filter(l => l.tipo === "descontos" && l.origemDesconto === "nota")
    .reduce((s, l) => s + l.valor, 0);
  const descontosManuais = Math.max(0, resumo.totalDescontos - descontosComerciais);
  return (
    <aside className="animate-rise flex flex-col gap-4 rounded-3xl bg-ink-panel p-4 text-ink-foreground shadow-lift sm:p-5 [animation-delay:90ms]">
      {/* Total */}
      <div className="relative overflow-hidden rounded-2xl bg-total p-5 shadow-glow sm:p-6">
        <TrendingUp className="pointer-events-none absolute -bottom-6 -right-4 h-36 w-36 text-ink-foreground opacity-10" />
        <p className="eyebrow text-ink-foreground/75">Valor total do caixa</p>
        <p className="mt-1 font-display text-5xl font-extrabold tracking-tight num sm:text-6xl">
          {formatBRL(resumo.total)}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-foreground/80">
          <span>
            Vendas <b className="num text-ink-foreground">{formatBRL(resumo.totalVendas)}</b>
          </span>
          <span>
            Descontos manuais <b className="num text-ink-foreground">+{formatBRL(descontosManuais)}</b>
          </span>
          <span>
            Descontos em notas <b className="num text-ink-foreground">{formatBRL(descontosComerciais)}</b>
          </span>
          <span>
            Saídas <b className="num text-ink-foreground">{formatBRL(resumo.totalSaidas)}</b>
          </span>
          <span>
            Troco <b className="num text-ink-foreground">{formatBRL(trocoInicial)}</b>
          </span>
        </div>
      </div>

      {/* Fuel */}
      <div className="grid gap-3 sm:grid-cols-2">
        <FuelCard
          label="Gasolina"
          valor={resumo.valorGasolina}
          litros={resumo.litrosGasolina}
          share={resumo.totalVendas ? resumo.valorGasolina / resumo.totalVendas : 0}
          tone="gasolina"
        />
        <FuelCard
          label="Diesel"
          valor={resumo.valorDiesel}
          litros={resumo.litrosDiesel}
          share={resumo.totalVendas ? resumo.valorDiesel / resumo.totalVendas : 0}
          tone="diesel"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-border bg-ink-2/40 px-3 py-2 text-xs text-ink-muted">
        <span>Sangrias de gasolina: <strong className="text-gasolina num">{formatBRL(combustivelSangrias.gasolina)} · {formatLitros(litrosGasolinaSangrados)}</strong></span>
        <span>Sangrias de diesel: <strong className="text-diesel num">{formatBRL(combustivelSangrias.diesel)}</strong></span>
      </div>

      <div className="grid min-h-0 gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Historico lancamentos={lancamentos} precos={precos} onRemove={onRemove} />
        <PorPagamento resumo={resumo} />
      </div>
    </aside>
  );
}

function FuelCard({
  label,
  valor,
  litros,
  share,
  tone,
}: {
  label: string;
  valor: number;
  litros: number;
  share: number;
  tone: "gasolina" | "diesel";
}) {
  const bar = tone === "gasolina" ? "bg-gasolina" : "bg-diesel";
  const text = tone === "gasolina" ? "text-gasolina" : "text-diesel";
  return (
    <div className="rounded-2xl border border-ink-border bg-ink-2/50 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold">
          <Droplet className={`h-4 w-4 ${text}`} fill="currentColor" />
          {label}
        </span>
        <span className="text-xs font-semibold text-ink-muted num">{Math.round(share * 100)}%</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="font-display text-3xl font-bold num">{formatBRL(valor)}</p>
        <p className={`pb-1 text-sm font-bold num ${text}`}>{formatLitros(litros)}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-foreground/10">
        <div
          className={`h-full rounded-full ${bar} transition-all duration-700`}
          style={{ width: `${Math.max(share * 100, valor > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function Historico({
  lancamentos,
  precos,
  onRemove,
}: {
  lancamentos: Lancamento[];
  precos: Precos;
  onRemove: (id: string) => void;
}) {
  const [filtro, setFiltro] = useState<FiltroHistorico>("todos");
  const lista = useMemo(() => filtrarHistorico(lancamentos, filtro), [lancamentos, filtro]);

  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-ink-border bg-ink-2/40">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-border px-4 py-3">
        <h3 className="font-display text-lg font-bold">Histórico</h3>
        <div className="flex gap-1 rounded-full bg-ink-foreground/[0.06] p-1">
          {FILTROS_HISTORICO.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                filtro === f.id
                  ? "bg-ink-foreground text-ink"
                  : "text-ink-muted hover:text-ink-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="scroll-slim-ink max-h-[420px] flex-1 space-y-1 overflow-y-auto p-2">
        {lista.length === 0 && (
          <li className="flex flex-col items-center gap-2 py-10 text-center text-sm text-ink-muted">
            <Inbox className="h-6 w-6" />
            Nenhum lançamento aqui ainda
          </li>
        )}
        {lista.map((l) => {
          const info = tipoInfo(l.tipo);
          const Icon = TIPO_ICON[l.tipo];
          const negativo = info.categoria !== "venda";
          return (
            <li
              key={l.id}
              className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-ink-foreground/[0.06]"
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${CATEGORIA_TILE_INK[info.categoria]}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{info.label}</p>
                <p className="truncate text-[11px] text-ink-muted">
                  {l.combustivel && (
                    <>
                      <span
                        className={l.combustivel === "diesel" ? "text-diesel" : "text-gasolina"}
                      >
                        {l.combustivel === "diesel" ? "Diesel" : "Gasolina"}
                      </span>{" "}
                      · <span className="num">{formatLitros(litrosDe(l, precos))}</span> ·{" "}
                    </>
                  )}
                  {l.modalidade === "credito"
                    ? "Crédito · "
                    : l.modalidade === "debito"
                      ? "Débito · "
                      : ""}
                  <span className="num">{formatDataHora(l.criadoEm)}</span>
                  {l.tipo === "cliente_outras_notas" && l.modalidade === "prazo" && (
                    <span className="font-bold text-warning-foreground"> · A receber</span>
                  )}
                  {l.tipo === "notas" && (
                    <span className="font-bold text-warning-foreground"> · Faturado</span>
                  )}
                  {l.observacao && <> · {l.observacao}</>}
                </p>
              </div>
              <p
                className={`shrink-0 font-display text-base font-bold num ${negativo ? "text-danger" : ""}`}
              >
                {negativo ? "−" : ""}
                {formatBRL(l.valor)}
              </p>
              <button
                type="button"
                onClick={() => onRemove(l.id)}
                aria-label={`Remover ${info.label}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-muted opacity-0 transition-opacity hover:bg-danger/20 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PorPagamento({ resumo }: { resumo: Resumo }) {
  const vendas = TIPOS.filter((t) => t.categoria === "venda" && resumo.porTipo[t.id]);
  const dados = (id: string) => resumo.porTipo[id] ?? { valor: 0, quantidade: 0 };
  const max = Math.max(1, ...vendas.map((t) => dados(t.id).valor));

  return (
    <div className="flex flex-col rounded-2xl border border-ink-border bg-ink-2/40">
      <div className="border-b border-ink-border px-4 py-3">
        <h3 className="font-display text-lg font-bold">Por forma de pagamento</h3>
      </div>
      <ul className="space-y-3 p-4">
        {vendas.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-muted">Sem vendas no turno</li>
        )}
        {vendas.map((t) => {
          const { valor, quantidade } = dados(t.id);
          const Icon = TIPO_ICON[t.id];
          return (
            <li key={t.id}>
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0 text-primary-glow" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t.label}</span>
                <span className="text-[11px] text-ink-muted num">
                  {quantidade}×
                </span>
                <span className="w-24 text-right font-display text-base font-bold num">
                  {formatBRL(valor)}
                </span>
              </div>
              <div className="ml-6 mt-1.5 h-1 overflow-hidden rounded-full bg-ink-foreground/10">
                <div
                  className="h-full rounded-full bg-primary-glow transition-all duration-700"
                  style={{ width: `${(valor / max) * 100}%` }}
                />
              </div>
              {t.id === "cartoes" && (
                <div className="ml-6 mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <span className="flex justify-between rounded-md bg-ink-foreground/[0.06] px-2 py-1">
                    <span className="text-ink-muted">Débito · {resumo.cartoes.qtdDebito}</span>
                    <b className="num">{formatBRL(resumo.cartoes.debito)}</b>
                  </span>
                  <span className="flex justify-between rounded-md bg-ink-foreground/[0.06] px-2 py-1">
                    <span className="text-ink-muted">Crédito · {resumo.cartoes.qtdCredito}</span>
                    <b className="num">{formatBRL(resumo.cartoes.credito)}</b>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
