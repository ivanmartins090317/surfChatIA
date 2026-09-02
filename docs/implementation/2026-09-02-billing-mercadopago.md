# Implementação · Billing Mercado Pago (substitui AbacatePay)

| Campo | Valor |
|-------|--------|
| **Status** | implementado (código) · homologação E2E sandbox pendente |
| **Spec** | [`specs/2026-09-02-billing-mercadopago.md`](../../specs/2026-09-02-billing-mercadopago.md) |
| **Plano** | [`docs/state/PLANO_GO_LIVE_COBRANCA.md`](../state/PLANO_GO_LIVE_COBRANCA.md) Trilhas D + H |
| **Data** | 2026-09-02 |
| **Autonomia** | `tight` |

## Entregue

### Schema

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/012_billing_mercadopago.sql` | `subscriptions.provider` aceita `mercadopago` (mantém `abacatepay` legado); default `mercadopago`; RPC `apply_subscription_activation` grava `mercadopago` |

### Domínio / gateway

| Arquivo | Descrição |
|---------|-----------|
| `lib/domain/billing.ts` | `BillingProvider`, label de UI, `external_ref` |
| `lib/billing/billing-catalog.ts` | Catálogo interno; checkout pronto com `MP_ACCESS_TOKEN` (sem product IDs) |
| `lib/billing/mercadopago-config.ts` | Token, config SDK, sandbox (`TEST-`) |
| `lib/billing/mercadopago-client.ts` | PreApproval (Surfista/Pro) + Preference (packs) + cancel |
| `lib/billing/mercadopago-event-mapper.ts` | Webhook → `BillingGatewayEvent` após `GET` do recurso |
| `lib/billing/mercadopago-webhook.ts` | HMAC `x-signature` + `x-request-id` |
| `lib/billing/billing-gateway-event.ts` | Evento de domínio + `reaisToCents` |

### Serviços / HTTP / UI

| Arquivo | Descrição |
|---------|-----------|
| `services/billing-service.ts` | Checkout, cancel, `processBillingGatewayEvent`, summary |
| `actions/billing-actions.ts` | Passa e-mail autenticado ao checkout |
| `app/api/webhooks/mercadopago/route.ts` | HMAC → fetch recurso → RPC |
| `app/api/webhooks/abacatepay/route.ts` | **410** (integração encerrada) |
| `app/(app)/planos/page.tsx` | CTAs + copy MP / sandbox |
| `app/(app)/billing/page.tsx` | Provedor visível (“Mercado Pago”) |

### Testes

| Arquivo | Cobertura |
|---------|-----------|
| `lib/__tests__/billing-catalog.test.ts` | Token MP, valor, `reaisToCents` |
| `lib/__tests__/mercadopago-webhook.test.ts` | HMAC, parse de notificação |
| `lib/__tests__/billing-service.test.ts` | Pack, assinatura, idempotência, valor errado, renovação-antes-ativação, cancel sem token |

### Config

| Arquivo | Descrição |
|---------|-----------|
| `lib/env.ts` | `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` (opcionais) |
| `.env.example` | Vars MP (sem valores reais) |
| `package.json` | Dependência `mercadopago` ^3.6.0 |

**Removido do caminho feliz:** `lib/billing/abacatepay-*` e testes AbacatePay órfãos.

## Evidências Done

```text
npm run typecheck  → OK
npm run lint       → OK (max-warnings 0)
npm test           → 114 testes OK (15 arquivos)
```

`npm run db:push` da migration `012` **não** foi executado — só com o owner.

## Segurança (checklist `docs/SECURITY.md`)

- Segredos `MP_*` só no servidor; webhook público valida HMAC antes de mutar
- Recurso sempre buscado na API MP (`GET` payment / preapproval / invoice) — body da notificação não credita
- 401 sem assinatura válida; 500 em falha interna (MP retenta); 200 após persistir ou evento ignorado de propósito
- Valor pago comparado ao catálogo (`priceCents`); `event_id` = `{type}:{data.id}` (idempotência já existente)
- RLS das tabelas de billing permanece a da migration 011; RPC `security definer`
- Logs sem token, secret ou PII do pagador

## Pendências (owner)

- [ ] `npm run db:push` com migration `012` no Supabase remoto
- [ ] Vercel: `MP_ACCESS_TOKEN` (`TEST-` primeiro) + `MP_WEBHOOK_SECRET`
- [ ] Homologação E2E sandbox (comprador de teste + cartão de teste)
- [ ] Token de produção (`APP_USR-`) só depois do smoke

## Decisões

- Um único gateway: Mercado Pago. Assinatura = cartão no `init_point`. Packs = Checkout Pro (PIX/cartão/boleto).
- Sem product IDs no painel MP; preços do catálogo interno.
- `back_url` / toast de retorno **não** creditam — só webhook + `GET`.
- Primeira `subscription_authorized_payment` antes do preapproval `authorized` ativa a assinatura (event_id distinto).
