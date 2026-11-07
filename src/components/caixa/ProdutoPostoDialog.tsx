import { useState, type FormEvent } from "react";
import { ShoppingBasket, Snowflake, Wrench, Minus, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL, type Lancamento } from "@/lib/caixa";
import {
  CATALOGO_PRODUTOS, totalProdutoCentavos, type CategoriaProduto,
} from "@/lib/produtos";

interface Props {
  onClose: () => void;
  onSave: (l: Omit<Lancamento, "id" | "criadoEm">) => void;
}

export function ProdutoPostoDialog({ onClose, onSave }: Props) {
  const [categoria, setCategoria] = useState<CategoriaProduto>("freezer");
  const [produtoId, setProdutoId] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number>(1);
  const [erro, setErro] = useState("");

  const produtos = CATALOGO_PRODUTOS.filter((p) => p.categoria === categoria);
  const selecionado = CATALOGO_PRODUTOS.find((p) => p.id === produtoId && p.categoria === categoria);
  const totalCentavos = selecionado ? totalProdutoCentavos(selecionado.precoCentavos, quantidade) : 0;

  const selecionarCategoria = (nova: CategoriaProduto) => {
    setCategoria(nova);
    setProdutoId("");
    setQuantidade(1);
    setErro("");
  };

  const salvar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selecionado || totalCentavos <= 0) {
      setErro("Selecione um produto e informe uma quantidade válida.");
      return;
    }
    onSave({
      tipo: "produto_posto",
      valor: totalCentavos / 100,
      produtoId: selecionado.id,
      produtoNome: selecionado.nome,
      produtoCategoria: selecionado.categoria,
      quantidadeProduto: quantidade,
      precoUnitarioProduto: selecionado.precoCentavos / 100,
      observacao: selecionado.nome + " · " + quantidade + " un. · " + formatBRL(selecionado.precoCentavos / 100) + "/un.",
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-3xl border-border p-0 sm:max-w-lg">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border px-6 py-5 text-left">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShoppingBasket className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="font-display text-2xl font-bold">Produto Posto</DialogTitle>
            <DialogDescription>Venda de produtos do freezer e lubrificantes</DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={salvar} className="space-y-5 px-6 py-5">
          <div>
            <span className="eyebrow text-muted-foreground">Categoria</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => selecionarCategoria("freezer")}
                aria-pressed={categoria === "freezer"}
                className={"flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition-colors " +
                  (categoria === "freezer" ? "border-primary bg-primary/10 text-primary shadow-card" : "border-border text-muted-foreground hover:border-muted-foreground/40")}>
                <Snowflake className="h-4 w-4" /> Freezer
              </button>
              <button type="button" onClick={() => selecionarCategoria("lubrificantes")}
                aria-pressed={categoria === "lubrificantes"}
                className={"flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition-colors " +
                  (categoria === "lubrificantes" ? "border-primary bg-primary/10 text-primary shadow-card" : "border-border text-muted-foreground hover:border-muted-foreground/40")}>
                <Wrench className="h-4 w-4" /> Lubrificantes
              </button>
            </div>
          </div>

          <div>
            <span className="eyebrow text-muted-foreground">Selecione o produto</span>
            <div className="mt-1.5 grid gap-2">
              {produtos.map((produto) => (
                <button key={produto.id} type="button"
                  aria-pressed={produtoId === produto.id}
                  onClick={() => { setProdutoId(produto.id); setQuantidade(1); setErro(""); }}
                  className={"flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors " +
                    (produtoId === produto.id ? "border-primary bg-primary/10 shadow-card" : "border-border hover:border-muted-foreground/40")}>
                  <span className="min-w-0 text-sm font-bold">{produto.nome}</span>
                  <span className="shrink-0 font-display font-bold num">{formatBRL(produto.precoCentavos / 100)}</span>
                </button>
              ))}
            </div>
          </div>

          {selecionado && (
            <div className="rounded-2xl border border-border bg-secondary/40 p-4">
              <span className="eyebrow text-muted-foreground">Quantidade (unidades)</span>
              <div className="mt-2 flex items-center gap-3">
                <button type="button" aria-label="Diminuir quantidade"
                  onClick={() => setQuantidade((n) => Math.max(1, n - 1))}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card transition-colors hover:bg-secondary">
                  <Minus className="h-4 w-4" />
                </button>
                <input type="number" inputMode="numeric" min="1" max="9999" step="1"
                  value={quantidade}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setQuantidade(Number.isInteger(n) && n >= 1 && n <= 9999 ? n : 0);
                    setErro("");
                  }}
                  aria-label="Quantidade do produto"
                  className="h-10 w-20 rounded-xl border border-input bg-card text-center font-display text-xl font-bold num outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
                <button type="button" aria-label="Aumentar quantidade"
                  onClick={() => setQuantidade((n) => Math.min(9999, n + 1))}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card transition-colors hover:bg-secondary">
                  <Plus className="h-4 w-4" />
                </button>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatBRL(selecionado.precoCentavos / 100)} por unidade
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div>
              <p className="eyebrow text-muted-foreground">Total da venda</p>
              <p className="font-display text-3xl font-bold num">{formatBRL(totalCentavos / 100)}</p>
            </div>
            <button type="submit" disabled={!selecionado || totalCentavos <= 0}
              className="rounded-xl bg-total px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
              Registrar
            </button>
          </div>
          {erro && <p role="alert" className="text-sm font-semibold text-danger">{erro}</p>}
          <p className="text-xs text-muted-foreground">Catálogo somente leitura. A inclusão de produtos e a alteração de preços serão exclusivas do futuro painel do gerente.</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
