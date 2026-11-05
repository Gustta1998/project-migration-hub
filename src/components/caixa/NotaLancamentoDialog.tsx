import { useEffect, useState, type FormEvent } from "react";
import { Droplet, FileText } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { parseNumeroBR, formatDataBR } from "@/lib/abertura";
import {
  formatBRL, formatLitros, type Combustivel, type Lancamento, type Precos,
} from "@/lib/caixa";

type TipoNota = "notas" | "cliente_outras_notas";
type PagamentoNota = "avista" | "prazo";
type DestinoNota = "Nota Infra" | "Secretaria de Saúde" | "Secretaria de Educação" | "Câmara Municipal" | "Outros";

const DESTINOS: DestinoNota[] = [
  "Nota Infra", "Secretaria de Saúde", "Secretaria de Educação", "Câmara Municipal", "Outros",
];
const inputClass = "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30";

interface Props {
  tipo: TipoNota;
  precos: Precos;
  onClose: () => void;
  onSave: (l: Omit<Lancamento, "id" | "criadoEm">) => void;
}

export function NotaLancamentoDialog({ tipo, precos, onClose, onSave }: Props) {
  const [combustivel, setCombustivel] = useState<Combustivel>("gasolina");
  const [litrosTexto, setLitrosTexto] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [destino, setDestino] = useState<DestinoNota>("Nota Infra");
  const [outroDestino, setOutroDestino] = useState("");
  const [pagamento, setPagamento] = useState<PagamentoNota>("avista");
  const [erro, setErro] = useState("");

  useEffect(() => {
    setCombustivel("gasolina");
    setLitrosTexto("");
    setResponsavel("");
    setDestino("Nota Infra");
    setOutroDestino("");
    setPagamento("avista");
    setErro("");
  }, [tipo]);

  const cliente = tipo === "cliente_outras_notas";
  const litros = parseNumeroBR(litrosTexto);
  const preco = precos[combustivel];
  const total = litros !== null && litros > 0 ? Math.round(litros * preco * 100) / 100 : 0;
  const destinoFinal = destino === "Outros" ? outroDestino.trim() : destino;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nome = responsavel.trim();
    if (!nome) return setErro(cliente ? "Informe o nome do cliente." : "Informe o responsável.");
    if (litros === null || !Number.isFinite(litros) || litros <= 0) {
      return setErro("Informe uma quantidade de litros maior que zero.");
    }
    if (!Number.isFinite(preco) || preco <= 0 || total <= 0) {
      return setErro("O preço do combustível na abertura do caixa precisa ser válido.");
    }
    if (!cliente && !destinoFinal) return setErro("Informe o destino da nota.");

    onSave({
      tipo,
      valor: total,
      combustivel,
      litros,
      precoLitro: preco,
      responsavel: nome,
      destinoNota: cliente ? undefined : destinoFinal,
      modalidade: cliente ? pagamento : undefined,
      observacao: cliente
        ? nome + " · " + (pagamento === "avista" ? "Pago à vista" : "A prazo")
        : destinoFinal + " · " + nome,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-3xl border-border p-0 sm:max-w-lg">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border px-6 py-5 text-left">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <DialogTitle className="font-display text-2xl font-bold">
              {cliente ? "Cliente outras notas" : "Notas"}
            </DialogTitle>
            <DialogDescription>
              {cliente ? "Abastecimento de clientes e terceiros" : "Registro de abastecimento por nota"}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5 px-6 py-5">
          <div>
            <span className="eyebrow text-muted-foreground">Combustível</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["gasolina", "diesel"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCombustivel(c); setErro(""); }}
                  aria-pressed={combustivel === c}
                  className={
                    "flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left transition-colors " +
                    (combustivel === c
                      ? (c === "gasolina" ? "border-gasolina bg-gasolina-soft" : "border-diesel bg-diesel-soft")
                      : "border-border hover:border-muted-foreground/40")
                  }
                >
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Droplet className={"h-4 w-4 " + (c === "gasolina" ? "text-gasolina" : "text-diesel")} fill="currentColor" />
                    {c === "gasolina" ? "Gasolina" : "Diesel"}
                  </span>
                  <span className="text-xs text-muted-foreground num">
                    {formatBRL(precos[c])}/L
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="eyebrow text-muted-foreground">Litros abastecidos</span>
              <input
                autoFocus
                required
                inputMode="decimal"
                placeholder="0,000"
                value={litrosTexto}
                onChange={(e) => { setLitrosTexto(e.target.value.replace(/[^\d.,]/g, "")); setErro(""); }}
                className={inputClass + " font-display text-lg font-bold num"}
              />
            </label>
            <div>
              <span className="eyebrow text-muted-foreground">Preço por litro</span>
              <div className={inputClass + " font-display font-bold num"} aria-label="Preço definido na abertura do caixa">
                {formatBRL(preco)}
              </div>
            </div>
          </div>

          <label className="block">
            <span className="eyebrow text-muted-foreground">{cliente ? "Nome do cliente" : "Nome do responsável"}</span>
            <input
              required
              maxLength={120}
              value={responsavel}
              onChange={(e) => { setResponsavel(e.target.value); setErro(""); }}
              placeholder={cliente ? "Nome do cliente" : "Quem recebeu o abastecimento"}
              className={inputClass}
            />
          </label>

          {!cliente && (
            <div>
              <label htmlFor="destino-nota" className="eyebrow text-muted-foreground">Destino da nota</label>
              <select
                id="destino-nota"
                value={destino}
                onChange={(e) => { setDestino(e.target.value as DestinoNota); setErro(""); }}
                className={inputClass}
              >
                {DESTINOS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {destino === "Outros" && (
                <label className="mt-3 block">
                  <span className="eyebrow text-muted-foreground">Especifique o destino</span>
                  <input
                    required
                    maxLength={120}
                    value={outroDestino}
                    onChange={(e) => { setOutroDestino(e.target.value); setErro(""); }}
                    placeholder="Informe o destino"
                    className={inputClass}
                  />
                </label>
              )}
            </div>
          )}

          {cliente && (
            <div>
              <span className="eyebrow text-muted-foreground">Forma de pagamento</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(["avista", "prazo"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPagamento(p)}
                    aria-pressed={pagamento === p}
                    className={
                      "rounded-xl border-2 px-3 py-3 text-sm font-bold transition-colors " +
                      (pagamento === p
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground/40")
                    }
                  >
                    {p === "avista" ? "Pagou à vista" : "Pagar a prazo"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
            <div>
              <p className="eyebrow text-muted-foreground">Valor total calculado</p>
              <p className="font-display text-3xl font-bold num">{formatBRL(total)}</p>
              <p className="text-xs text-muted-foreground">
                {litros !== null && litros > 0 ? formatLitros(litros) : "0,000 L"} · {formatDataBR(new Date())}
              </p>
            </div>
            <button
              type="submit"
              disabled={total <= 0}
              className="rounded-xl bg-total px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              Registrar
            </button>
          </div>
          {erro && <p role="alert" className="text-sm font-semibold text-danger">{erro}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
