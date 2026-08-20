# Implementação · Billing AbacatePay (Trilhas D + H)

| Campo | Valor |
|-------|--------|
| **Status** | implementado (código) · homologação manual pendente |
| **Spec** | [`specs/2026-08-20-billing-abacatepay.md`](../../specs/2026-08-20-billing-abacatepay.md) |
| **Plano** | [`docs/state/PLANO_GO_LIVE_COBRANCA.md`](../state/PLANO_GO_LIVE_COBRANCA.md) Trilhas D + H |
| **Data** | 2026-08-20 |

## Entregue

### Schema

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/011_billing_abacatepay.sql` | `subscriptions`, `billing_webhook_events`, `billing_checkout_sessions`, RPCs atômicos |

### Domínio / gateway

| Arquivo | Descrição |
|---------|-----------|
| `lib/domain/billing.ts` | Tipos, ofertas, external ref |
| `lib/billing/billing-catalog.ts` | Catálogo + product IDs via env |
| `lib/billing/abacatepay-client.ts` | Checkout assinatura/pack + cancel API |
| `lib/billing/abacatepay-webhook-parser.ts` | Parser flexível do payload v2 |
| `lib/billing/abacatepay-webhook.ts` | Segurança HMAC + secret (delega processamento) |

### Serviços / actions

| Arquivo | Descrição |
|---------|-----------|
| `services/billing-service.ts` | Checkout, cancel, webhook idempotente, summary |
| `actions/billing-actions.ts` | Server actions autenticadas |

### HTTP / UI

| Arquivo | Descrição |
|---------|-----------|
| `app/api/webhooks/abacatepay/route.ts` | Webhook (já existia; processamento completo) |
| `app/(app)/planos/page.tsx` | CTAs checkout reais + toast retorno |
| `app/(app)/billing/page.tsx` | Cobrança: plano, status, cancelamento |
| `components/billing/*` | CheckoutButton, CancelSubscription, toast |

### Testes

| Arquivo | Cobertura |
|---------|-----------|
| `lib/__tests__/billing-catalog.test.ts` | Catálogo, external ref, valor |
| `lib/__tests__/abacatepay-webhook-parser.test.ts` | Parser payload |
| `lib/__tests__/billing-service.test.ts` | Pack, assinatura, idempotência, cancel |
| `lib/__tests__/abacatepay-webhook.test.ts` | Segurança HMAC (existente) |

### Config

| Arquivo | Descrição |
|---------|-----------|
| `lib/env.ts` | Vars AbacatePay opcionais |
| `.env.example` | API key, webhook secret, product IDs |

## Evidências Done

```text
npm run typecheck  → OK
npm run lint       → OK
npm test           → 99/99 OK
```

## Pendências (homologação / Trilha D)

- [ ] `npm run db:push` com migration `011` no Supabase remoto
- [ ] Owner: conta AbacatePay, produtos no painel, webhook de teste
- [ ] Preencher `ABACATEPAY_*` na Vercel + smoke E2E Dev mode
- [ ] Política de reembolso automático (evento `checkout.refunded` — só log hoje)

## Decisões

- **Retorno pós-checkout:** `/planos?checkout=success|cancelled` + toast
- **Cancelamento:** API in-app `POST /subscriptions/cancel`; plano pago vigente até `current_period_end`
- **Reset mensal:** na renovação webhook (`subscription.renewed`), não cron separado
