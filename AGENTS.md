<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Cash-register math (totals, liters, per-payment breakdown) lives only in `src/lib/caixa.ts` and is covered by `src/lib/caixa.test.ts`; UI components under `src/components/caixa/` only display it, so numbers stay consistent everywhere.
- Shift opening (validation, turnos, local persistence of the open caixa) lives in `src/lib/abertura.ts` with tests in `src/lib/abertura.test.ts`; `/` shows the opening flow until a caixa session exists, then the PDV, so the PDV never runs without opening data.
