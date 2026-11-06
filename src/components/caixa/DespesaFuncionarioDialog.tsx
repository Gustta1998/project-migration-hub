import { useState, type FormEvent } from "react";
import { Banknote, Droplet, HandCoins, UserRound, Wallet } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { parseNumeroBR } from "@/lib/abertura";
import {
  FUNCIONARIOS, TIPOS_DESPESA_FUNCIONARIO, formatBRL, formatLitros,
  type Funcionario, type TipoDespesaFuncionario, type Lancamento, type Precos,
} from "@/lib/caixa";

interface Props {
  precos: Precos;
  onClose: () => void;
  onSave: (l: Omit<Lancamento, "id" | "criadoEm">) => void;
}

const campo = "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30";
const icones = { vale: HandCoins, gasolina: Droplet, diesel: Droplet, dinheiro: Banknote };

export function DespesaFuncionarioDialog({ precos, onClose, onSave }: Props) {
  const [funcionario, setFuncionario] = useState<Funcionario | "">("");
  const [categoria, setCategoria] = useState<TipoDespesaFuncionario | "">("");
  const [valorTexto, setValorTexto] = useState("");
  const [litrosTexto, setLitrosTexto] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");

  const combustivel = categoria === "gasolina" || categoria === "diesel" ? categoria : undefined;
  const litros = parseNumeroBR(litrosTexto);
  const precoLitro = combustivel ? precos[combustivel] : undefined;
  const valorDigitado = parseNumeroBR(valorTexto);
  const valor = combustivel
    ? litros !== null && litros > 0 && precoLitro && precoLitro > 0
      ? Math.round(litros * precoLitro * 100) / 100
      : 0
    : valorDigitado !== null && valorDigitado > 0
      ? Math.round(valorDigitado * 100) / 100
      : 0;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!funcionario) return setErro("Selecione um funcionário.");
    if (!categoria) return setErro("Selecione Vale, Gasolina, Diesel ou Dinheiro.");
    if (combustivel && (litros === null || !Number.isFinite(litros) || litros <= 0)) {
      return setErro("Informe a quantidade abastecida em litros.");
    }
    if (!Number.isFinite(valor) || valor <= 0) return setErro("Informe um valor válido maior que zero.");
    const descricaoTipo = TIPOS_DESPESA_FUNCIONARIO.find((t) => t.id === categoria)?.label ?? categoria;
    const descricao = [funcionario, descricaoTipo, combustivel && litros !== null ? formatLitros(litros) : "", observacao.trim()]
      .filter(Boolean).join(" · ");
    onSave({
      tipo: "despesas",
      valor,
      funcionario,
      tipoDespesaFuncionario: categoria,
      combustivel,
      litros: combustivel ? litros! : undefined,
      precoLitro,
      observacao: descricao,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-3xl border-border p-0 sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border px-6 py-5 text-left">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <DialogTitle className="font-display text-2xl font-bold">Despesas</DialogTitle>
            <DialogDescription>Retiradas e abastecimentos de funcionários</DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5 px-6 py-5">
          <label className="block">
            <span className="eyebrow text-muted-foreground">Funcionário</span>
            <div className="relative mt-1.5">
              <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <select
                required
                value={funcionario}
                onChange={(e) => {
                  setFuncionario(e.target.value as Funcionario | "");
                  setCategoria("");
                  setValorTexto("");
                  setLitrosTexto("");
                  setErro("");
                }}
                className={campo + " mt-0 pl-9"}
              >
                <option value="">Selecione um funcionário</option>
                {FUNCIONARIOS.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
              </select>
            </div>
          </label>

          {funcionario && (
            <div>
              <span className="eyebrow text-muted-foreground">O que o funcionário retirou?</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {TIPOS_DESPESA_FUNCIONARIO.map(({ id, label }) => {
                  const Icon = icones[id];
                  const ativo = categoria === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => { setCategoria(id); setValorTexto(""); setLitrosTexto(""); setErro(""); }}
                      className={
                        "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition-colors " +
                        (ativo
                          ? "border-primary bg-primary/10 text-primary shadow-card"
                          : "border-border text-muted-foreground hover:border-muted-foreground/40")
                      }
                    >
                      <Icon className={"h-4 w-4 " + (id === "gasolina" ? "text-gasolina" : id === "diesel" ? "text-diesel" : "")} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {categoria && (
            <>
              {combustivel ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="eyebrow text-muted-foreground">Litros de {combustivel}</span>
                    <input
                      required
                      autoFocus
                      inputMode="decimal"
                      placeholder="0,000"
                      value={litrosTexto}
                      onChange={(e) => { setLitrosTexto(e.target.value.replace(/[^\d.,]/g, "")); setErro(""); }}
                      className={campo + " font-display text-lg font-bold num"}
                    />
                  </label>
                  <div>
                    <span className="eyebrow text-muted-foreground">Preço por litro</span>
                    <div className={campo + " font-display font-bold num"}>{formatBRL(precoLitro ?? 0)}</div>
                  </div>
                </div>
              ) : (
                <label className="block">
                  <span className="eyebrow text-muted-foreground">Valor de {categoria === "vale" ? "vale" : "dinheiro"}</span>
                  <div className="mt-1.5 flex items-center rounded-2xl border border-input bg-background px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
                    <span className="font-display text-xl font-bold text-muted-foreground">R$</span>
                    <input
                      required
                      autoFocus
                      inputMode="decimal"
                      placeholder="0,00"
                      value={valorTexto}
                      onChange={(e) => { setValorTexto(e.target.value.replace(/[^\d.,]/g, "")); setErro(""); }}
                      className="w-full bg-transparent px-2 py-3 font-display text-3xl font-bold num outline-none placeholder:text-muted-foreground/40"
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <span className="eyebrow text-muted-foreground">Observação (opcional)</span>
                <input
                  value={observacao}
                  maxLength={160}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Informação adicional"
                  className={campo}
                />
              </label>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <span className="eyebrow text-muted-foreground">Total da despesa</span>
                  <p className="font-display text-2xl font-bold num">{formatBRL(valor)}</p>
                </div>
                <button
                  type="submit"
                  disabled={valor <= 0}
                  className="rounded-xl bg-total px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  Registrar
                </button>
              </div>
            </>
          )}
          {erro && <p role="alert" className="text-sm font-semibold text-danger">{erro}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
