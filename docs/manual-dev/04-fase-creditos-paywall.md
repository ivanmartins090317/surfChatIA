# Fase A · Créditos + paywall

| Status | Spec |
| --- | --- |
| concluída (código) · homologação manual parcial | [`specs/2026-08-10-creditos-paywall.md`](../../specs/2026-08-10-creditos-paywall.md) |

Registro objetivo: [`docs/implementation/2026-08-10-creditos-paywall.md`](../implementation/2026-08-10-creditos-paywall.md)

## O que esta fase entrega

- Plano grátis: **2 créditos totais** para **novos** signups
- Débito **somente** em análise com sucesso (performance, prancha, match)
- Retry automático em erro de sistema **sem** debitar
- Reanálise voluntária com confirmação
- Badge de créditos no shell + contador no dashboard e telas `/new`
- Paywall com CTA → `/planos` (placeholder, sem checkout real)
- Ledger auditável (`usage_ledger`) + RPC atômica

Não entrega: gateway de pagamento, reset mensal de ciclo, backfill para contas antigas.

---

## Fluxo principal

1. Novo signup → `profiles` com 2 créditos (`free_quota_granted`)
2. Antes de IA: `canStartAnalysis` / reserva em `usage-service`
3. Sucesso → `debitCredit` + linha em `usage_ledger`
4. Falha de sistema → release sem débito (até 2 retries auto)
5. Saldo 0 → `CreditsPaywall` bloqueia upload

---

## Arquivos-chave

| Área | Caminhos |
| --- | --- |
| Schema | `supabase/migrations/008_credits_usage.sql` |
| Serviço | `services/usage-service.ts` |
| Integração | `analysis-service`, `board-service`, `board-match-service` |
| UI | `components/credits/credits-summary.tsx`, `app/(app)/planos/page.tsx` |
| Testes | `lib/__tests__/credits.test.ts` |

---

## Contas de teste

| Cenário | Como validar |
| --- | --- |
| Novo signup | Criar conta nova → badge mostra 2 créditos |
| Conta antiga | Sem backfill → saldo 0 → paywall ao analisar |
| Consumo | 2 análises com sucesso → paywall na 3ª |
| Erro IA | Falha simulada → saldo intacto |

---

## Homologação manual

- [ ] Badge e contadores corretos após cada análise
- [ ] Paywall distinto de mensagem de rate limit diário
- [ ] CTA `/planos` abre página de exemplo
- [ ] Ledger visível no banco (`usage_ledger`) após débito

---

## Comandos

```bash
npm run test -- lib/__tests__/credits.test.ts
npm run db:push   # se migration 008 ainda não aplicada no ambiente
```

---

## Próximo passo

Legal: [05-fase-legal-lgpd.md](./05-fase-legal-lgpd.md) · Go-live: [`docs/state/PLANO_GO_LIVE_COBRANCA.md`](../state/PLANO_GO_LIVE_COBRANCA.md) Trilha H (AbacatePay)
