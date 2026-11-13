import { LockKeyholeOpen } from "lucide-react";

export function BoasVindas({ posto, onAbrir }: { posto: string; onAbrir: () => void }) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-hero px-6 py-12 text-ink-foreground">
      {/* faixas decorativas, como a sinalização das bombas */}
      <div className="pointer-events-none absolute -right-24 top-0 flex h-full rotate-12 gap-5 opacity-[0.07]">
        <span className="h-full w-16 bg-ink-foreground" />
        <span className="h-full w-8 bg-ink-foreground" />
        <span className="h-full w-3 bg-ink-foreground" />
      </div>
      <div className="pointer-events-none absolute -left-32 bottom-0 flex h-2/3 -rotate-12 gap-4 opacity-[0.05]">
        <span className="h-full w-10 bg-ink-foreground" />
        <span className="h-full w-4 bg-ink-foreground" />
      </div>

      <main className="relative flex w-full max-w-xl flex-col items-center text-center">
        <div className="animate-pop grid h-28 w-28 place-items-center overflow-hidden rounded-3xl bg-total shadow-glow ring-1 ring-ink-foreground/15 sm:h-32 sm:w-32">
          <img
            src="/rede-de-posto-almeida.webp"
            alt="Logo Rede de Posto Almeida"
            width={160}
            height={138}
            className="h-full w-full object-contain"
            decoding="async"
          />
        </div>

        <p className="animate-rise eyebrow mt-7 text-ink-muted [animation-delay:80ms]">{posto}</p>
        <h1 className="animate-rise mt-2 font-display text-6xl font-extrabold tracking-tight sm:text-7xl [animation-delay:140ms]">
          Bem-vindo ao Caixa
        </h1>
        <p className="animate-rise mt-3 text-base text-ink-muted sm:text-lg [animation-delay:200ms]">
          Sistema de Controle de Caixa — {posto}
        </p>

        <span className="animate-rise mt-10 h-px w-24 bg-ink-foreground/20 [animation-delay:240ms]" />

        <button
          type="button"
          onClick={onAbrir}
          autoFocus
          className="animate-rise group mt-10 inline-flex items-center gap-4 rounded-2xl bg-total py-4 pl-4 pr-9 font-display text-2xl font-bold uppercase tracking-[0.08em] text-primary-foreground shadow-glow ring-1 ring-ink-foreground/15 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-glow/50 [animation-delay:300ms]"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-ink-foreground/15 transition-transform duration-200 group-hover:scale-105">
            <LockKeyholeOpen className="h-6 w-6" strokeWidth={2.25} />
          </span>
          Abrir caixa
        </button>
      </main>
    </div>
  );
}
