# Fase H · Billing AbacatePay

| Status | Spec |
| --- | --- |
| implementado (código) · homologação manual pendente | [`specs/2026-08-20-billing-abacatepay.md`](../../specs/2026-08-20-billing-abacatepay.md) |

Registro objetivo: [`docs/implementation/2026-08-20-billing-abacatepay.md`](../implementation/2026-08-20-billing-abacatepay.md)

## O que esta fase entrega

- Checkout **Surfista**, **Pro**, **Pack S** e **Pack M** via AbacatePay (Dev mode ou produção)
- Webhook v2: `checkout.completed`, `subscription.completed`, `subscription.renewed`, `subscription.cancelled`
- Idempotência por `event_id` · validação secret + HMAC
- Sincronização plano/créditos via RPC atômica + `usage_ledger`
- Página `/planos` com CTAs · `/billing` com status e cancelamento

**Não entrega:** go-live comercial (Trilha I), reembolso automático de créditos, cron mensal dedicado, painel admin.

---

## Pré-requisitos (Trilha D — owner)

1. Conta AbacatePay com Dev mode
2. Quatro produtos no painel (assinatura mensal Surfista/Pro + packs avulsos S/M)
3. Webhook HTTPS: `https://SEU_DOMINIO/api/webhooks/abacatepay?webhookSecret=SEU_SECRET`
4. Eventos v2: checkout.completed, subscription.completed, subscription.renewed, subscription.cancelled

### Variáveis de ambiente (server-only)

```env
ABACATEPAY_API_KEY=abc_dev_...
ABACATEPAY_WEBHOOK_SECRET=seu-secret
ABACATEPAY_PRODUCT_SURFISTA=prod_...
ABACATEPAY_PRODUCT_PRO=prod_...
ABACATEPAY_PRODUCT_PACK_S=prod_...
ABACATEPAY_PRODUCT_PACK_M=prod_...
```

Registrar IDs dos produtos neste capítulo quando a Trilha D fechar.

| Oferta | Preço | Product ID (AbacatePay Dev) |
|--------|-------|-----------------------------|
| Surfista | R$ 39/mês · 8 créditos | `prod_kgZEYjU5cXtfQXCgGp1cN6TZ` |
| Pro | R$ 89/mês · 30 créditos | `prod_2uMjLTdNsHKwPpfXbepmcb0j` |
| Pack S | R$ 19 · 5 créditos | `prod_gsFmquFPEBqfkrRJBuc6FStj` |
| Pack M | R$ 49 · 15 créditos | `prod_fbEUA6NX21kBJmqu3aP4JT4q` |

> **Nota:** a AbacatePay costuma devolver `checkout.externalId: null` nos webhooks v2 mesmo quando enviamos na criação. O app resolve o surfista via `metadata` (quando presente) ou via `billing_checkout_sessions.gateway_checkout_id` (= `checkout.id` do webhook).

---

## Fluxos principais

### Assinatura

1. Surfista autenticado → `/planos` → **Assinar Surfista/Pro**
2. Redirect para checkout AbacatePay → pagamento (PIX/cartão)
3. Webhook `subscription.completed` → plano atualizado, `credits_period_used = 0`
4. Renovação mensal → `subscription.renewed` → nova cota do ciclo

### Pack avulso

1. `/planos` → **Comprar Pack S/M**
2. Webhook `checkout.completed` → `credits_balance += N` · plano inalterado

### Cancelamento

1. `/billing` → **Cancelar assinatura** → API AbacatePay
2. Webhook `subscription.cancelled` → status cancelado
3. Plano pago e créditos do ciclo vigem até `current_period_end` · depois downgrade grátis

---

## Homologação manual

- [ ] Migration `011_billing_abacatepay.sql` aplicada (`npm run db:push`)
- [ ] Checkout Dev mode: Surfista → plano Surfista + 8 créditos disponíveis
- [ ] Pack S em conta free → +5 créditos avulsos, plano continua grátis
- [ ] Reenvio do mesmo webhook → sem crédito/plano duplicado
- [ ] Cancelamento → status cancelado, acesso até fim do período
- [ ] Secret/assinatura inválidos → 401, sem mutação

### Smoke webhook (curl local)

```bash
# Substituir SECRET, BODY e SIGNATURE
curl -X POST "http://localhost:3000/api/webhooks/abacatepay?webhookSecret=SECRET" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: SIGNATURE" \
  -d 'BODY'
```

Gerar `SIGNATURE` com HMAC-SHA256 do body raw (ver `lib/__tests__/abacatepay-webhook.test.ts`).

---

## Comandos

```bash
npm run test -- lib/__tests__/billing-service.test.ts
npm run db:push   # após revisar migration 011
```

---

## Próximo passo

- Homologação E2E com conta AbacatePay real (Dev mode)
- Trilha I: beta pago + modo live
- Ver [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md) e scoreboard [`PLANO_GO_LIVE_COBRANCA.md`](../state/PLANO_GO_LIVE_COBRANCA.md)
