import { useEffect, useState } from "react";
import { Droplet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatLitros,
  tipoInfo,
  type Combustivel,
  type Lancamento,
  type Precos,
  type TipoLancamento,
} from "@/lib/caixa";
import { CATEGORIA_TILE, TIPO_ICON } from "./icons";
import { NotaLancamentoDialog } from "./NotaLancamentoDialog";
import { DespesaFuncionarioDialog } from "./DespesaFuncionarioDialog";
import { ProdutoPostoDialog } from "./ProdutoPostoDialog";

interface Props {
  tipo: TipoLancamento | null;
  precos: Precos;
  onClose: () => void;
  onSave: (l: Omit<Lancamento, "id" | "criadoEm">) => void;
}

export function LancamentoDialog({ tipo, precos, onClose, onSave }: Props) {
  const [valor, setValor] = useState("");
  const [combustivel, setCombustivel] = useState<Combustivel>("gasolina");
  const [modalidade, setModalidade] = useState<"debito" | "credito">("credito");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (tipo) {
      setValor("");
      setCombustivel(tipo === "venda_diesel_dinheiro" ? "diesel" : "gasolina");
      setModalidade("credito");
      setObs("");
    }
  }, [tipo]);

  if (!tipo) return null;
  if (tipo === "notas" || tipo === "cliente_outras_notas") {
    return <NotaLancamentoDialog tipo={tipo} precos={precos} onClose={onClose} onSave={onSave} />;
  }
  if (tipo === "despesas") {
    return <DespesaFuncionarioDialog precos={precos} onClose={onClose} onSave={onSave} />;
  }
  if (tipo === "produto_posto") {
    return <ProdutoPostoDialog onClose={onClose} onSave={onSave} />;
  }
  const info = tipoInfo(tipo);
  const Icon = TIPO_ICON[tipo];
  const isVenda = info.categoria === "venda";
  const num = Number(valor.replace(/\./g, "").replace(",", ".")) || 0;
  const combustivelSelecionado = tipo === "venda_diesel_dinheiro" ? "diesel" : combustivel;
  const litros = isVenda ? num / precos[combustivelSelecionado] : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (num <= 0) return;
    onSave({
      tipo,
      valor: Math.round(num * 100) / 100,
      combustivel: isVenda ? combustivelSelecionado : undefined,
      modalidade: tipo === "cartoes" ? modalidade : isVenda ? "avista" : undefined,
      litros: tipo === "venda_diesel_dinheiro" ? Math.round(litros * 1000) / 1000 : undefined,
      precoLitro: tipo === "venda_diesel_dinheiro" ? precos.diesel : undefined,
      observacao: obs.trim() || undefined,
    });
  };

  return (
    <Dialog open={!!tipo} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-0 overflow-hidden rounded-3xl border-border p-0 sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border px-6 py-5 text-left">
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${CATEGORIA_TILE[info.categoria]}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <DialogTitle className="font-display text-2xl font-bold">{info.label}</DialogTitle>
            <DialogDescription>{info.descricao}</DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5 px-6 py-5">
          <label className="block">
            <span className="eyebrow text-muted-foreground">Valor</span>
            <div className="mt-1.5 flex items-center rounded-2xl border border-input bg-background px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
              <span className="font-display text-xl font-bold text-muted-foreground">R$</span>
              <input
                autoFocus
                inputMode="decimal"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value.replace(/[^\d.,]/g, ""))}
                className="w-full bg-transparent px-2 py-3 font-display text-3xl font-bold num outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          </label>

          {isVenda && tipo !== "venda_diesel_dinheiro" && (
            <div>
              <span className="eyebrow text-muted-foreground">Combustível</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(["gasolina", "diesel"] as const).map((c) => {
                  const active = combustivel === c;
                  const tone =
                    c === "gasolina"
                      ? "border-gasolina bg-gasolina-soft"
                      : "border-diesel bg-diesel-soft";
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCombustivel(c)}
                      className={`flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
                        active ? tone : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-bold">
                        <Droplet
                          className={`h-4 w-4 ${c === "gasolina" ? "text-gasolina" : "text-diesel"}`}
                          fill="currentColor"
                        />
                        {c === "gasolina" ? "Gasolina" : "Diesel"}
                      </span>
                      <span className="text-xs text-muted-foreground num">
                        R$ {precos[c].toFixed(2).replace(".", ",")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tipo === "cartoes" && (
            <div>
              <span className="eyebrow text-muted-foreground">Modalidade</span>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
                {(["debito", "credito"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModalidade(m)}
                    className={`rounded-lg border-2 py-2 text-sm font-bold transition-colors ${
                      modalidade === m
                        ? "border-primary bg-primary/10 text-primary shadow-card"
                        : "border-transparent text-muted-foreground hover:border-muted-foreground/40"
                    }`}
                  >
                    {m === "debito" ? "Débito" : "Crédito"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isVenda && (
            <label className="block">
              <span className="eyebrow text-muted-foreground">Observação</span>
              <input
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Ex.: troca de óleo, retirada parcial…"
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </label>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-sm text-muted-foreground">
              {isVenda && num > 0 ? (
                <>
                  ≈ <b className="text-foreground num">{formatLitros(litros)}</b>
                </>
              ) : (
                "\u00a0"
              )}
            </p>
            <button
              type="submit"
              disabled={num <= 0}
              className="rounded-xl bg-total px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              Registrar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
