import { useState, type FormEvent } from "react";
import { HandCoins } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL, type Lancamento } from "@/lib/caixa";
import { parseNumeroBR } from "@/lib/abertura";
import { totaisSangriaCombustivel } from "@/lib/sangrias";

interface Props {
  lancamentos: Lancamento[];
  onClose: () => void;
  onSave: (l: Omit<Lancamento, "id" | "criadoEm">) => void;
}

export function SangriaDialog({ lancamentos, onClose, onSave }: Props) {
  const [valor, setValor] = useState("");
  const [observacao, setObservacao] = useState("Depósito");
  const [erro, setErro] = useState("");
  const total = parseNumeroBR(valor) ?? 0;
  const atuais = totaisSangriaCombustivel(lancamentos);
  const previa = totaisSangriaCombustivel([
    ...lancamentos,
    { id: "previa", tipo: "sangria", valor: total, criadoEm: new Date(0).toISOString() },
  ]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(total) || total <= 0 || total > 999999999)
      return setErro("Informe um valor válido e maior que zero.");
    onSave({
      tipo: "sangria",
      valor: Math.round(total * 100) / 100,
      observacao: observacao.trim() || "Depósito",
    });
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
            <p className="text-xs font-semibold text-muted-foreground">Divisão automática de todas as sangrias do turno</p>
            <div className="mt-2 flex justify-between gap-2 text-sm"><span>Gasolina</span><strong>{formatBRL(previa.gasolina)}</strong></div>
            <div className="mt-1 flex justify-between gap-2 text-sm"><span>Diesel</span><strong>{formatBRL(previa.diesel)}</strong></div>
            <p className="mt-2 text-xs text-muted-foreground">Diesel informado em Venda Diesel Dinheiro: {formatBRL(atuais.dieselVendido)}. O restante das sangrias é gasolina.</p>
          </div>
          <label className="block">
            <span className="eyebrow text-muted-foreground">Destino / observação</span>
            <input value={observacao} maxLength={120} onChange={e => setObservacao(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </label>
          {erro && <p className="text-sm font-semibold text-danger" role="alert">{erro}</p>}
          <div className="flex items-center justify-between">
            <span className="font-display text-xl font-bold num">{formatBRL(total)}</span>
            <button type="submit" disabled={total <= 0}
              className="rounded-xl bg-total px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-40">
              Registrar sangria
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
