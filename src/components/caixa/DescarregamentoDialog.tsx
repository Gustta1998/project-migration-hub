import { useState, type FormEvent } from "react";
import { Droplet, Fuel } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatLitros, type Combustivel, type Lancamento } from "@/lib/caixa";
import { formatDataBR } from "@/lib/abertura";
import { calcularDescarregamento } from "@/lib/descarregamento";

type Props = {
  responsavel: string;
  onClose: () => void;
  onSave: (l: Omit<Lancamento, "id" | "criadoEm">) => void;
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-semibold num outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";

export function DescarregamentoDialog({ responsavel, onClose, onSave }: Props) {
  const [combustivel, setCombustivel] = useState<Combustivel | null>(null);
  const [antesCm, setAntesCm] = useState("");
  const [antesLitros, setAntesLitros] = useState("");
  const [depoisCm, setDepoisCm] = useState("");
  const [depoisLitros, setDepoisLitros] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const medicao = calcularDescarregamento(antesCm, antesLitros, depoisCm, depoisLitros);
  const num = (v: string) => v.replace(/[^\d.,]/g, "");

  const salvar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!combustivel) return setErro("Selecione gasolina ou diesel.");
    if (!medicao) return setErro("Preencha as quatro medições. As leituras depois devem ser maiores que as anteriores.");
    onSave({
      tipo: "descarregamento",
      valor: 0,
      combustivel,
      litros: medicao.totalLitros,
      descargaAntesCm: medicao.antesCm,
      descargaAntesLitros: medicao.antesLitros,
      descargaDepoisCm: medicao.depoisCm,
      descargaDepoisLitros: medicao.depoisLitros,
      responsavel,
      observacao: observacao.trim() || undefined,
    });
  };

  const campo = (titulo: string, valor: string, setValor: (v: string) => void, unidade: string) => (
    <label className="block">
      <span className="eyebrow text-muted-foreground">{titulo} ({unidade})</span>
      <input
        required inputMode="decimal" placeholder={unidade === "cm" ? "0,0" : "0,000"}
        value={valor} onChange={e => { setValor(num(e.target.value)); setErro(""); }}
        className={inputClass} />
    </label>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-3xl border-border p-0 sm:max-w-lg">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border px-6 py-5 text-left">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Fuel className="h-5 w-5" />
          </span>
          <div>
            <DialogTitle className="font-display text-2xl font-bold">Descarregamento</DialogTitle>
            <DialogDescription>Entrada de combustível no tanque</DialogDescription>
          </div>
        </DialogHeader>
        <form onSubmit={salvar} className="space-y-5 px-6 py-5">
          <div className="rounded-xl bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            <strong className="text-foreground">{responsavel}</strong> · {formatDataBR(new Date())} · Horário registrado automaticamente
          </div>

          <div>
            <span className="eyebrow text-muted-foreground">1. Selecione primeiro o combustível</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["gasolina", "diesel"] as const).map((c) => (
                <button
                  key={c} type="button" aria-pressed={combustivel === c}
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
              <div className="rounded-2xl border border-border p-4">
                <h3 className="mb-3 font-display text-lg font-bold">ANTES do descarregamento</h3>
                <div className="grid grid-cols-2 gap-3">
                  {campo("Medida", antesCm, setAntesCm, "cm")}
                  {campo("Quantidade", antesLitros, setAntesLitros, "L")}
                </div>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <h3 className="mb-3 font-display text-lg font-bold">DEPOIS do descarregamento</h3>
                <div className="grid grid-cols-2 gap-3">
                  {campo("Medida", depoisCm, setDepoisCm, "cm")}
                  {campo("Quantidade", depoisLitros, setDepoisLitros, "L")}
                </div>
              </div>
              <div className="rounded-2xl border border-primary/25 bg-primary-soft p-4">
                <p className="eyebrow text-primary">Total descarregado</p>
                <p className="mt-1 font-display text-3xl font-extrabold num text-primary">
                  {medicao ? formatLitros(medicao.totalLitros) : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Litros depois − litros antes. Centímetros são medidos separadamente.</p>
              </div>
              <label className="block">
                <span className="eyebrow text-muted-foreground">Observação (opcional)</span>
                <input maxLength={200} value={observacao} onChange={e => setObservacao(e.target.value)}
                  placeholder="Informações sobre o recebimento" className={inputClass + " font-normal"} />
              </label>
              {erro && <p role="alert" className="text-sm font-semibold text-danger">{erro}</p>}
              <div className="flex items-center justify-end">
                <button type="submit" disabled={!medicao}
                  className="rounded-xl bg-total px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-40">
                  Registrar descarregamento
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Registro de estoque: não altera o valor do caixa nem as vendas. Os dados serão guardados com o turno para futura integração ao sistema do gerente.
              </p>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
