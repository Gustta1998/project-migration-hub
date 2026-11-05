import { useState } from "react";
import { CheckCircle2, Clock, Droplet, FileCheck2, Fuel, RotateCcw, UserRound } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  formatDataHora,
  notasEmAberto,
  podeConfirmarAbastecimento,
  type NotaAutorizada,
} from "@/lib/caixa";

interface Props {
  notas: NotaAutorizada[];
  onConfirmar: (id: string) => void;
  onDesfazer: (id: string) => void;
}

export function NotasAutorizadas({ notas, onConfirmar, onDesfazer }: Props) {
  const [confirmando, setConfirmando] = useState<NotaAutorizada | null>(null);
  const abertas = notasEmAberto(notas);
  const abastecidas = notas.filter((n) => n.status === "abastecida");

  return (
    <section className="animate-rise rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6 [animation-delay:120ms]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-muted-foreground">Clientes faturados</p>
          <h2 className="font-display text-2xl font-bold tracking-tight">Notas autorizadas</h2>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground num">
          {abertas.length} em aberto
        </span>
      </div>

      {abertas.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
          <CheckCircle2 className="h-7 w-7 text-success" />
          <p className="font-bold">Todas as notas foram abastecidas</p>
          <p className="text-sm text-muted-foreground">Nada fica pendente para o próximo turno.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {abertas.map((n) => {
            const ok = podeConfirmarAbastecimento(n);
            return (
              <article
                key={n.id}
                className="flex min-w-0 flex-col rounded-2xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">{n.cliente}</h3>
                    <p className="text-xs text-muted-foreground">{n.turno}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      ok ? "bg-success-soft text-success" : "bg-warning-soft text-warning-foreground"
                    }`}
                  >
                    <FileCheck2 className="h-3 w-3" />
                    {ok ? "Autorizada" : "Pendente"}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-2 text-sm">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <dd className="truncate">
                    <span className="text-muted-foreground">Responsável · </span>
                    <span className="font-semibold">{n.responsavel}</span>
                  </dd>
                  <Droplet
                    className={`h-4 w-4 ${n.combustivel === "Diesel" ? "text-diesel" : "text-gasolina"}`}
                  />
                  <dd className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{n.combustivel}</span>
                    <span className="font-display text-lg font-bold num">{n.litros} L</span>
                  </dd>
                </dl>

                {ok ? (
                  <button
                    type="button"
                    onClick={() => setConfirmando(n)}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-card transition-all hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0"
                  >
                    <Fuel className="h-4 w-4" />
                    Confirmar abastecimento
                  </button>
                ) : (
                  <p className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-warning-soft px-4 py-2.5 text-sm font-semibold text-warning-foreground">
                    <Clock className="h-4 w-4" />
                    Aguardando autorização
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {abastecidas.length > 0 && (
        <div className="mt-5 rounded-2xl bg-success-soft/60 p-4">
          <p className="eyebrow mb-2 text-success">Abastecidas neste turno · {abastecidas.length}</p>
          <ul className="divide-y divide-success/15">
            {abastecidas.map((n) => (
              <li key={n.id} className="flex items-center gap-3 py-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{n.cliente}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {n.combustivel} · <span className="num">{n.litros} L</span>
                    {n.abastecidaPor && <> · por {n.abastecidaPor}</>}
                    {n.abastecidaEm && (
                      <>
                        {" "}
                        · <span className="num">{formatDataHora(n.abastecidaEm)}</span>
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDesfazer(n.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Desfazer
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AlertDialog open={!!confirmando} onOpenChange={(o) => !o && setConfirmando(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">
              Confirmar abastecimento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmando && (
                <>
                  <b className="text-foreground">{confirmando.cliente}</b> ·{" "}
                  {confirmando.combustivel} · <b className="text-foreground num">{confirmando.litros} L</b>
                  <br />
                  Depois de confirmada, a nota sai da lista e não aparece para o próximo frentista.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-success text-primary-foreground hover:bg-success/90"
              onClick={() => {
                if (confirmando) onConfirmar(confirmando.id);
                setConfirmando(null);
              }}
            >
              Sim, abasteci
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
