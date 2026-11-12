import { useState, type FormEvent } from "react";
import { HandCoins } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL, type Lancamento } from "@/lib/caixa";
import { parseNumeroBR } from "@/lib/abertura";
import { dieselPendenteDeposito, separarSangria, totaisSangriaCombustivel } from "@/lib/sangrias";

interface Props {
  lancamentos: Lancamento[];
  onClose: () => void;
  onSave: (l: Omit<Lancamento, "id" | "criadoEm">) => void;
}

export function SangriaDialog({ lancamentos, onClose, onSave }: Props) {
  const [valor, setValor] = useState("");
  const [diesel, setDiesel] = useState("");
  const [observacao, setObservacao] = useState("Depósito");
  const [erro, setErro] = useState("");
  const total = parseNumeroBR(valor) ?? 0;
  const parteDiesel = parseNumeroBR(diesel) ?? 0;
  const divisao = separarSangria(total, parteDiesel);
  const pendente = dieselPendenteDeposito(lancamentos);
  const semDetalhe = totaisSangriaCombustivel(lancamentos).semDetalhe;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!divisao) return setErro("Informe o total e a parte do diesel (entre zero e o total).");
    if (divisao.diesel > pendente + 0.01) {
      return setErro("O diesel informado excede as vendas em dinheiro ainda não atribuídas a sangrias.");
    }
    onSave({
      tipo: "sangria",
      valor: divisao.total,
      sangriaGasolina: divisao.gasolina,
      sangriaDiesel: divisao.diesel,
      observacao: observacao.trim() || "Depósito",
    });
  };
  const preencherDiesel = () => {
    setDiesel(Math.min(total, pendente).toFixed(2).replace(".", ","));
    setErro("");
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-3xl border-border p-0 sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border px-6 py-5 text-left">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger"><HandCoins className="h-5 w-5" /></span>
          <div>
            <DialogTitle className="font-display text-2xl font-bold">Sangria</DialogTitle>
            <DialogDescription>Dinheiro de combustível depositado</DialogDescription>
          </div>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="eyebrow text-muted-foreground">Total depositado (R$)</span>
            <input required inputMode="decimal" value={valor} placeholder="0,00"
              onChange={e => { setValor(e.target.value.replace(/[^\d.,]/g, "")); setErro(""); }}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 font-display text-2xl font-bold num outline-none focus:border-primary" />
          </label>
          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <p className="text-xs font-semibold text-muted-foreground">Diesel vendido em dinheiro ainda sem sangria detalhada: {formatBRL(pendente)}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <label className="flex-1">
                <span className="eyebrow text-muted-foreground">Parte de diesel no depósito (R$)</span>
                <input required inputMode="decimal" value={diesel} placeholder="0,00"
                  onChange={e => { setDiesel(e.target.value.replace(/[^\d.,]/g, "")); setErro(""); }}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 font-bold num outline-none focus:border-primary" />
              </label>
              <button type="button" onClick={preencherDiesel}
                className="self-end rounded-xl border border-primary px-3 py-2 text-xs font-bold text-primary hover:bg-primary-soft">
                Sugerir diesel
              </button>
            </div>
            <p className="mt-2 text-sm font-bold">Gasolina neste depósito: {divisao ? formatBRL(divisao.gasolina) : "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Confirme a divisão real do depósito. A sugestão é apenas uma estimativa.</p>
            {semDetalhe > 0 && <p className="mt-1 text-xs text-warning-foreground">Há {formatBRL(semDetalhe)} em sangrias antigas sem combustível identificado.</p>}
          </div>
          <label className="block">
            <span className="eyebrow text-muted-foreground">Destino / observação</span>
            <input value={observacao} maxLength={120} onChange={e => setObservacao(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </label>
          {erro && <p className="text-sm font-semibold text-danger" role="alert">{erro}</p>}
          <div className="flex items-center justify-between">
            <span className="font-display text-xl font-bold num">{formatBRL(total)}</span>
            <button type="submit" disabled={!divisao}
              className="rounded-xl bg-total px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-40">
              Registrar sangria
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
