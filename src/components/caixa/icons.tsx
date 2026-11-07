import {
  BadgePercent,
  Banknote,
  CreditCard,
  FileStack,
  FileText,
  HandCoins,
  QrCode,
  Receipt,
  ShoppingBasket,
  Smartphone,
  Truck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { Categoria, TipoLancamento } from "@/lib/caixa";

export const TIPO_ICON: Record<TipoLancamento, LucideIcon> = {
  pix_maquininha: QrCode,
  pix_manual: Smartphone,
  cartoes: CreditCard,
  dinheiro: Banknote,
  produto_posto: ShoppingBasket,
  cartao_frota: Truck,
  fit_card: WalletCards,
  notas: FileText,
  cliente_outras_notas: FileStack,
  descontos: BadgePercent,
  sangria: HandCoins,
  despesas: Receipt,
};

/** Icon tile tone per category (light surfaces). */
export const CATEGORIA_TILE: Record<Categoria, string> = {
  venda: "bg-primary-soft text-primary",
  desconto: "bg-warning-soft text-warning-foreground",
  saida: "bg-danger-soft text-danger",
};

/** Icon tile tone per category (ink surfaces). */
export const CATEGORIA_TILE_INK: Record<Categoria, string> = {
  venda: "bg-primary-glow/20 text-primary-glow",
  desconto: "bg-warning/15 text-warning",
  saida: "bg-danger/20 text-danger",
};
