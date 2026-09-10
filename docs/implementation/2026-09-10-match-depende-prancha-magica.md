# Implementação · Match depende de prancha mágica (gate UX)

| Campo | Valor |
|-------|--------|
| **Status** | implementado (código) · homologação manual pendente |
| **Spec** | [`specs/2026-09-10-match-depende-prancha-magica.md`](../../specs/2026-09-10-match-depende-prancha-magica.md) |
| **Plano** | [`docs/plans/2026-09-10-match-integrado-pranchas.md`](../plans/2026-09-10-match-integrado-pranchas.md) |
| **Data** | 2026-09-10 |
| **Autonomia** | `medium` |

## Entregue

### Navegação e UI

| Arquivo | Descrição |
|---------|-----------|
| `components/layout/app-nav.tsx` | Remove Match como item irmão da nav principal |
| `components/board-spec/match-magic-gate.ts` | Helpers puros do gate UX + copies da Spec |
| `components/board-spec/match-magic-gate-panel.tsx` | Painel de bloqueio amigável (deep link) |
| `components/board-spec/boards-match-section.tsx` | Seção Match no hub de Pranchas |
| `components/board-spec/board-match-form.tsx` | Referência mágica **obrigatória** na UI; sem “só com perfil” |
| `app/(app)/boards/page.tsx` | Hub com CTA/empty de Match conforme gate |
| `app/(app)/boards/[id]/page.tsx` | CTA Match só com ficha `ready` (+ pré-seleção `?board=`) |
| `app/(app)/compatibility/page.tsx` | Histórico legado preservado; “Nova” só com mágica pronta |
| `app/(app)/compatibility/new/page.tsx` | Gate UX sem mágica pronta; form com referência obrigatória |
| `app/(app)/dashboard/page.tsx` | CTA Match só com mágica pronta; senão aponta para cadastro/Pranchas |

### Produto / docs

| Arquivo | Descrição |
|---------|-----------|
| `docs/PRD.md` §4.4 | Mágica `ready` como pré-requisito do fluxo de produto do Match |

### Testes

| Arquivo | Descrição |
|---------|-----------|
| `lib/__tests__/match-magic-gate.test.ts` | Gate, copy, CTA, deep link e pré-seleção de referência |

## Decisão explícita (aceita)

O **backend continua aceitando** Match sem referência. O gate desta entrega é **somente UX**. Não houve mudança em services/actions, schema ou billing.

## Evidências Done

```text
npm run typecheck  → exit 0
npm run lint       → exit 0
npm test           → 134 passed (17 files)
```

## Pendências

- [ ] Homologação manual: nav sem Match; hub/detalhe com CTA; deep link `/compatibility/new` sem mágica; form exige referência; histórico legado listável
- [ ] Dashboard: CTA Match só com `ready`; sem `ready` aponta para cadastrar/aguardar
