/**
 * Ações de teste ficam disponíveis no servidor local de desenvolvimento ou
 * quando a aplicação é renderizada DENTRO da prévia do editor Lovable.
 * Não expõe os controles em uma página publicada aberta diretamente.
 */
export function modoTesteAtivo(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    return window.self !== window.top &&
      /^https:\/\/lovable\.dev\/projects\//.test(document.referrer);
  } catch {
    return false;
  }
}
