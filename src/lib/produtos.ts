/** Catálogo temporário somente leitura para o frentista.
 * Futuramente será alimentado pelo painel autenticado do gerente.
 * Nunca habilitar edição de preços nesta interface.
 */
export const CATALOGO_PRODUTOS = [
  { id: "picole", nome: "Picolé", categoria: "freezer", precoCentavos: 500 },
  { id: "cremosinho-quadrado", nome: "Cremosinho quadrado", categoria: "freezer", precoCentavos: 300 },
  { id: "geladinho", nome: "Geladinho", categoria: "freezer", precoCentavos: 100 },
  { id: "arla", nome: "Arla", categoria: "lubrificantes", precoCentavos: 12500 },
] as const;

export type CategoriaProduto = (typeof CATALOGO_PRODUTOS)[number]["categoria"];
export type ProdutoPosto = (typeof CATALOGO_PRODUTOS)[number];

export function totalProdutoCentavos(precoCentavos: number, quantidade: number): number {
  if (!Number.isSafeInteger(precoCentavos) || precoCentavos <= 0 ||
      !Number.isSafeInteger(quantidade) || quantidade <= 0) return 0;
  const total = precoCentavos * quantidade;
  return Number.isSafeInteger(total) ? total : 0;
}
