# Fase · Match depende de prancha mágica (gate UX)

| Status | Spec |
| --- | --- |
| implementado (código) · homologação manual pendente | [`specs/2026-09-10-match-depende-prancha-magica.md`](../../specs/2026-09-10-match-depende-prancha-magica.md) |

Registro objetivo: [`docs/implementation/2026-09-10-match-depende-prancha-magica.md`](../implementation/2026-09-10-match-depende-prancha-magica.md)

## O que esta fase entrega

- Match **dentro do fluxo de Pranchas** (descoberta via hub + detalhe)
- Novo Match na UI **só** com pelo menos uma prancha mágica `ready`
- Referência mágica **obrigatória** no formulário novo
- Histórico legado (com e sem referência) **preservado**
- PRD §4.4 alinhado ao pré-requisito de produto

Não entrega: bloqueio no service/action, schema, billing, mudança no conteúdo da IA, remoção das rotas `/compatibility/*`.

---

## Fluxo principal

1. Surfista cadastra prancha mágica e a ficha fica `ready`
2. Em **Pranchas**, vê CTA “Fazer Match” / “Comparar outra prancha”
3. No detalhe `ready`, CTA abre `/compatibility/new?board=<id>` com referência pré-selecionada
4. Envia fotos da candidata (+ medidas opcionais) → resultado em `/compatibility/[id]`
5. Nav principal **não** lista Match; deep links continuam válidos

---

## Arquivos-chave

| Área | Caminhos |
| --- | --- |
| Gate | `components/board-spec/match-magic-gate.ts` |
| Hub / detalhe | `app/(app)/boards/page.tsx`, `app/(app)/boards/[id]/page.tsx` |
| Match | `app/(app)/compatibility/*`, `components/board-spec/board-match-form.tsx` |
| Nav / dashboard | `components/layout/app-nav.tsx`, `app/(app)/dashboard/page.tsx` |
| Testes | `lib/__tests__/match-magic-gate.test.ts` |

---

## Contas de teste / homologação

| Cenário | Como validar |
| --- | --- |
| Sem prancha | Hub e `/compatibility/new` mostram gate + CTA cadastrar |
| Só draft/processing/error | Gate com copy de aguardar ficha |
| Mágica `ready` | CTA Match no hub/detalhe; form exige referência |
| Deep link sem mágica | Gate amigável (não 404) |
| Histórico legado | Matches antigos (com/sem referência) listáveis |
| Nav | Item Match ausente desktop e mobile |
| Dashboard | CTA Match só com `ready` |

---

## Comandos

```bash
npm run test -- lib/__tests__/match-magic-gate.test.ts
npm run typecheck
npm run lint
npm test
```

---

## Próximo passo

Homologação manual (POP-QA) · ver [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
