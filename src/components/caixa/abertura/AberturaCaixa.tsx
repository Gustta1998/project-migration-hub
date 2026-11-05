import { useCallback, useState } from "react";
import type { AberturaCaixa as Abertura } from "@/lib/abertura";
import { AppHeader } from "../AppHeader";
import { AberturaForm } from "./AberturaForm";
import { BoasVindas } from "./BoasVindas";
import { CaixaAbertoSucesso } from "./CaixaAbertoSucesso";

/** Etapa anterior ao PDV: boas-vindas → formulário → confirmação animada. */
export function AberturaCaixa({ posto, onAberto }: { posto: string; onAberto: (a: Abertura) => void }) {
  const [etapa, setEtapa] = useState<"boas-vindas" | "formulario">("boas-vindas");
  const [confirmada, setConfirmada] = useState<Abertura | null>(null);

  const finalizar = useCallback(() => {
    if (confirmada) onAberto(confirmada);
  }, [confirmada, onAberto]);

  if (etapa === "boas-vindas") {
    return <BoasVindas posto={posto} onAbrir={() => setEtapa("formulario")} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader posto={posto} />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 items-center px-4 py-5 sm:px-6 sm:py-6">
        <AberturaForm
          posto={posto}
          onVoltar={() => setEtapa("boas-vindas")}
          onConfirmar={setConfirmada}
        />
      </main>
      {confirmada && <CaixaAbertoSucesso frentista={confirmada.frentista} onFim={finalizar} />}
    </div>
  );
}
