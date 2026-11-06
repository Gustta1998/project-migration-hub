/**
 * Recursos de demonstração só ficam disponíveis em desenvolvimento local
 * ou quando a página roda dentro do editor do Lovable.
 *
 * Em navegadores Chromium, ancestorOrigins identifica de forma estável o
 * contêiner do editor mesmo após navegar para fechamento e voltar ao PDV.
 * document.referrer é apenas fallback: ele pode mudar durante a navegação.
 */
const CHAVE_PREVIA = "posto-almeida:previa-lovable-confirmada";

export function modoTesteAtivo(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  try {
    // Nunca expor controles de teste numa página publicada aberta diretamente.
    if (window.self === window.top) return false;

    const ancestors = window.location.ancestorOrigins;
    const editorAncestral = ancestors
      ? Array.from(ancestors).some((origin) => /^https:\/\/lovable\.dev$/.test(origin))
      : false;
    const editorReferente = /^https:\/\/lovable\.dev\/projects\//.test(document.referrer);
    if (editorAncestral || editorReferente) {
      window.sessionStorage.setItem(CHAVE_PREVIA, "1");
      return true;
    }
    // Fallback para navegador sem ancestorOrigins depois de uma navegação
    // interna: a confirmação foi registrada anteriormente nesta sessão.
    return window.sessionStorage.getItem(CHAVE_PREVIA) === "1";
  } catch {
    return false;
  }
}
