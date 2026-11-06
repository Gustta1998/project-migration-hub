import { useEffect, useState } from "react";
import { Clock3, Fuel, RotateCcw } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AppHeader({ posto, onReiniciarTeste }: { posto: string; onReiniciarTeste?: () => void }) {
  const [hora, setHora] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setHora(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/85 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-total text-primary-foreground shadow-glow">
            <Fuel className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="eyebrow truncate text-muted-foreground">{posto}</p>
            <h1 className="truncate font-display text-xl font-bold leading-tight tracking-tight">
              Caixa da pista
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {hora && (
            <div className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground num sm:flex">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              {hora}
            </div>
          )}
          {import.meta.env.DEV && (
            <>
              <span className="eyebrow rounded-full border border-warning/50 bg-warning-soft px-3 py-1.5 text-warning-foreground">
                Modo teste
              </span>
              {onReiniciarTeste && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-warning/50 bg-warning-soft px-3 py-1.5 text-xs font-bold text-warning-foreground transition-colors hover:brightness-95">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reiniciar teste
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display text-2xl">Reiniciar caixa de teste?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O caixa aberto e seus lançamentos de teste serão descartados sem gerar fechamento.
                        Você voltará à tela inicial para abrir um novo caixa. Esta ação não apaga os fechamentos já arquivados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onReiniciarTeste}
                        className="rounded-xl bg-warning text-warning-foreground hover:bg-warning/90">
                        Sim, reiniciar teste
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )>
        </div>
      </div>
    </header>
  );
}
