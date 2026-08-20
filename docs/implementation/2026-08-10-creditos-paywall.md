# Trilha A · Créditos + paywall

| Campo | Valor |
| --- | --- |
| **Status** | concluída (código) · homologação manual parcial |
| **Spec** | [`specs/2026-08-10-creditos-paywall.md`](../../specs/2026-08-10-creditos-paywall.md) |
| **Plano** | [`docs/state/PLANO_GO_LIVE_COBRANCA.md`](../state/PLANO_GO_LIVE_COBRANCA.md) Trilha A |
| **Data** | 2026-08-10 |

## Objetivo

Introduzir créditos no plano grátis (2 totais para novos signups), débito atômico só no sucesso, paywall e ledger auditável — sem gateway de pagamento.

## Entregue

### Banco

| Arquivo | Conteúdo |
| --- | --- |
| `008_credits_usage.sql` | Colunas em `profiles`, tabela `usage_ledger`, RLS, RPC débito/reserva |

### Service / domínio

| Arquivo | Conteúdo |
| --- | --- |
| `services/usage-service.ts` | `getCreditsSnapshot`, `canStartAnalysis`, reserve/debit/release |
| `lib/domain/credits.ts` | Labels e helpers |
| Integração | `analysis-service`, `board-service`, `board-match-service`, actions |

### UI

| Arquivo | Conteúdo |
| --- | --- |
| `components/credits/credits-summary.tsx` | Contador + `CreditsPaywall` |
| `app/(app)/layout.tsx` | Badge no shell |
| `app/(app)/planos/page.tsx` | Planos de exemplo (sem checkout) |

### Testes

- `lib/__tests__/credits.test.ts` — regras de débito, reserva, free quota

## Evidências de Done

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm test` | OK (incl. credits) |
| `npm run db:push` | Migration 008 aplicada em prod (nota 10/08/2026) |

## Pendências menores

- Homologação manual completa dos cenários da Spec (conta antiga, paywall vs rate limit)
- Sincronizar checklist em `PENDENCIAS.md` com scoreboard Trilha A

## Manual do dev

[`docs/manual-dev/04-fase-creditos-paywall.md`](../manual-dev/04-fase-creditos-paywall.md)
