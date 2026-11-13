import { useState, type FormEvent } from "react";
import { Droplet, Truck } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL, formatLitros, type Combustivel, type Lancamento, type Precos } from "@/lib/caixa";
import { calcularTransferencia } from "@/lib/transferencias";

type Props = {
  precos: Precos;
  frentista: string;
  onClose: () => void;
  onSave: (l: Omit<Lancamento, "id" | "criadoEm">) => void;
};

const input = "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";

export function TransferenciaCombustivelDialog({ precos, frentista, onClose, onSave }: Props) {
  const [combustivel, setCombustivel] = useState<Combustivel | null>(null);
  const [destino, setDestino] = useState("");
  const [litrosTexto, setLitrosTexto] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const transferencia = combustivel ? calcularTransferencia(litrosTexto, precos[combustivel]) : null;

  const registrar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!combustivel) return setErro("Selecione gasolina ou diesel.");
    if (!destino.trim()) return setErro("Informe o posto de destino.");
    if (!transferencia) return setErro("Informe uma quantidade válida de litros transferidos.");
    onSave({
      tipo: "transferencia_combustivel",
      valor: transferencia.valorEquivalente,
      combustivel,
      litros: transferencia.litros,
      precoLitro: precos[combustivel],
      postoDestino: destino.trim(),
      responsavel: frentista,
      observacao: observacao.trim() || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-3xl border-border p-0 sm:max-w-lg">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border px-6 py-5 text-left">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <DialogTitle className="font-display text-2xl font-bold">Transferência de combustível</DialogTitle>
            <DialogDescription>Saída para outro posto · sem venda</DialogDescription>
          </div>
        </DialogHeader>

        <form className="space-y-5 px-6 py-5" onSubmit={registrar}>
          <p className="rounded-xl bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            Posto de origem: <strong className="text-foreground">Posto Almeida</strong>
            {" · "}Responsável: <strong className="text-foreground">{frentista}</strong>
          </p>

          <div>
            <span className="eyebrow text-muted-foreground">1. Selecione o combustível</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["gasolina", "diesel"] as const).map(c => (
                <button
                  type="button" key={c} aria-pressed={combustivel === c}
                  onClick={() => { setCombustivel(c); setErro(""); }}
                  className={"flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition-colors " +
                    (combustivel === c
                      ? c === "gasolina" ? "border-gasolina bg-gasolina-soft" : "border-diesel bg-diesel-soft"
                      : "border-border hover:border-primary/40")}
                >
                  <Droplet className={"h-4 w-4 " + (c === "gasolina" ? "text-gasolina" : "text-diesel")} fill="currentColor" />
                  {c === "gasolina" ? "Gasolina" : "Diesel"}
                </button>
              ))}
            </div>
          </div>

          {combustivel && (
            <>
              <label className="block">
                <span className="eyebrow text-muted-foreground">Posto de destino (obrigatório)</span>
                <input required value={destino} maxLength={120}
                  onChange={e => { setDestino(e.target.value); setErro(""); }}
                  placeholder="Informe o posto que receberá o combustível"
                  className={input} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="eyebrow text-muted-foreground">Litros transferidos</span>
                  <input required inputMode="decimal" placeholder="0,000"
                    value={litrosTexto}
                    onChange={e => { setLitrosTexto(e.target.value.replace(/[^\d.,]/g, "")); setErro(""); }}
                    className={input + " font-display font-bold num"} />
                </label>
                <div>
                  <span className="eyebrow text-muted-foreground">Preço da bomba (R$/L)</span>
                  <div className={input + " font-display font-bold num"}>{formatBRL(precos[combustivel])}</div>
                </div>
              </div>

              <label className="block">
                <span className="eyebrow text-muted-foreground">Observação (opcional)</span>
                <input value={observacao} maxLength={200}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Ex.: transferência autorizada pelo gerente"
                  className={input} />
              </label>

              <div className="rounded-2xl border border-primary/25 bg-primary-soft p-4">
                <p className="eyebrow text-primary">Valor equivalente para conferência</p>
                <p className="mt-1 font-display text-3xl font-bold num text-primary">
                  {formatBRL(transferencia?.valorEquivalente ?? 0)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatLitros(transferencia?.litros ?? 0)} · Não é venda nem dinheiro recebido.
                </p>
              </div>
              {erro && <p role="alert" className="text-sm font-semibold text-danger">{erro}</p>}
              <button type="submit" disabled={!transferencia || !destino.trim()}
                className="w-full rounded-xl bg-total px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-all disabled:cursor-not-allowed disabled:opacity-40">
                Registrar transferência
              </button>
              <p className="text-xs text-muted-foreground">
                Esta movimentação justifica o giro da bomba e representa saída definitiva do estoque
                do posto de origem. Será guardada com o turno para o futuro painel do gerente.
              </p>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
