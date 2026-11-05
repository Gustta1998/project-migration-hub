import { useEffect } from "react";

export function CaixaAbertoSucesso({ frentista, onFim }: { frentista: string; onFim: () => void }) {
  useEffect(() => {
    const id = setTimeout(onFim, 1700);
    return () => clearTimeout(id);
  }, [onFim]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade fixed inset-0 z-50 grid place-items-center bg-ink/70 px-6 backdrop-blur-sm"
    >
      <div className="animate-pop w-full max-w-sm overflow-hidden rounded-3xl bg-card text-center shadow-lift">
        <div className="px-8 pb-7 pt-9">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success-soft">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-success" fill="none" aria-hidden>
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-draw"
              />
            </svg>
          </div>
          <p className="mt-5 font-display text-3xl font-extrabold tracking-tight">
            Caixa aberto com sucesso!
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Bom turno, <b className="text-foreground">{frentista}</b>. Entrando no painel…
          </p>
        </div>
        <div className="h-1 w-full bg-secondary">
          <div className="animate-progress h-full w-full origin-left bg-success" />
        </div>
      </div>
    </div>
  );
}
