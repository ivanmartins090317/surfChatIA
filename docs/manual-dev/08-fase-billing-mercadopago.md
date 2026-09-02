# Fase · Billing Mercado Pago

| Status | Spec |
| --- | --- |
| implementado (código) · homologação E2E sandbox pendente | [`specs/2026-09-02-billing-mercadopago.md`](../../specs/2026-09-02-billing-mercadopago.md) |

Registro objetivo: [`docs/implementation/2026-09-02-billing-mercadopago.md`](../implementation/2026-09-02-billing-mercadopago.md)

Capítulo histórico da integração anterior: [`06-fase-billing-abacatepay.md`](./06-fase-billing-abacatepay.md)

## O que esta fase entrega

- Checkout **Surfista** e **Pro** via assinatura Mercado Pago (`POST /preapproval`, cartão no `init_point`)
- Checkout **Pack S** e **Pack M** via Checkout Pro (`POST /checkout/preferences` — PIX, cartão ou boleto na página do MP)
- Webhook HMAC (`x-signature` + `x-request-id`) + `GET` do recurso antes de mutar plano/créditos
- Idempotência por `event_id` (`{type}:{data.id}`) nas RPCs já existentes
- `/planos` com CTAs · `/billing` com status, provedor “Mercado Pago” e cancelamento
- Rota `/api/webhooks/abacatepay` responde **410**

**Não entrega:** go-live comercial (Trilha I), reembolso automático de créditos, PIX Automático / recorrência PIX, Checkout Transparente no front, `db:push` remoto.

---

## Pré-requisitos (owner)

1. Aplicação **Surf AI Coach** no [painel de desenvolvedores MP](https://www.mercadopago.com.br/developers/panel/app)
2. Access Token de **teste** (`TEST-...`) no `.env.local` e, depois do smoke, na Vercel
3. Webhooks da aplicação (teste e produção):

   `https://surfiacoach.modernxlab.com.br/api/webhooks/mercadopago`

   Eventos: **Pagamentos (legacy)** + **Planos e assinaturas** (`payment`, `subscription_preapproval`, `subscription_authorized_payment`)
4. Secret de webhook em `MP_WEBHOOK_SECRET`
5. Homologação com **comprador de teste** + cartões de teste do painel
6. Aplicar migration `012_billing_mercadopago.sql` (`npm run db:push`) quando o código estiver no ar

### Variáveis de ambiente (server-only)

```env
MP_ACCESS_TOKEN=TEST-...
MP_WEBHOOK_SECRET=...
```

Opcional no futuro (Brick — fora desta entrega): `NEXT_PUBLIC_MP_PUBLIC_KEY`.

> **Produção (Vercel):** `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` e `NEXT_PUBLIC_SITE_URL=https://surfiacoach.modernxlab.com.br` nas Environment Variables do deploy, não só no `.env.local`. Comece com token `TEST-`; `APP_USR-` só após smoke.

---

## Ofertas (catálogo interno)

| Oferta | Tipo | Preço | Efeito |
|--------|------|-------|--------|
| Surfista | assinatura | R$ 39/mês | plano Surfista · 8 créditos/ciclo |
| Pro | assinatura | R$ 89/mês | plano Pro · 30 créditos/ciclo |
| Pack S | avulso | R$ 19 | +5 créditos · plano inalterado |
| Pack M | avulso | R$ 49 | +15 créditos · plano inalterado |

Não há product IDs no painel MP. O MP recebe `transaction_amount` em reais; o app compara `Math.round(amount * 100)` com `priceCents`.

> **Assinatura MP no Brasil é cartão**, não PIX. Packs podem ser PIX na página do Checkout Pro.

---

## Fluxos principais

### Assinatura

1. `/planos` → Assinar Surfista/Pro
2. Service cria `billing_checkout_sessions` + `POST /preapproval` (`payer_email` da conta, `back_url` = `/planos?checkout=success`)
3. Redirect para `init_point` do MP → cartão (sandbox: cartão de teste)
4. Webhook `subscription_preapproval` → `GET /preapproval` (`authorized`) → RPC `apply_subscription_activation`
5. Renovação: `subscription_authorized_payment` → RPC `apply_subscription_renewal`
6. Se a primeira fatura chegar antes do preapproval authorized: a mesma RPC de ativação roda (event_id distinto)

### Pack

1. `/planos` → Comprar Pack S/M
2. `POST /checkout/preferences` + redirect `init_point`
3. Webhook `payment` `approved` → RPC `apply_pack_purchase`
4. Pagamento de cartão de **assinatura** no tópico `payment` **não** credita pack

### Cancelamento

1. `/billing` → Cancelar → `PUT /preapproval/{id}` `status: cancelled`
2. Webhook confirma → RPC `apply_subscription_cancellation`
3. Acesso pago até `current_period_end`

### Retorno do checkout

Toast em `/planos?checkout=success|cancelled` = confirmação visual. **Créditos/plano só após o webhook.**

---

## Homologação manual (sandbox)

- [ ] Migration `012` aplicada no Supabase remoto
- [ ] `MP_ACCESS_TOKEN` (`TEST-`) e `MP_WEBHOOK_SECRET` na Vercel (ou túnel local)
- [ ] Comprar Pack S com PIX/cartão de teste → saldo +5, plano inalterado
- [ ] Assinar Surfista com cartão de teste → plano Surfista, 8 créditos/ciclo
- [ ] Recarregar `/billing` após o webhook (não imediatamente no redirect)
- [ ] Cancelar em `/billing` → status cancelada, acesso até o fim do período
- [ ] POST em `/api/webhooks/abacatepay` → **410**
- [ ] Evento duplicado não duplica crédito

Token de produção (`APP_USR-`) só depois deste smoke.

---

## Comandos

```bash
npm run typecheck
npm run lint
npm test
npm run db:push   # migration 012 — só com o owner
```

Webhook local exige túnel HTTPS apontando para `/api/webhooks/mercadopago` (o MP não chama `localhost`).

---

## Próximo passo

Homologação E2E sandbox + `db:push` 012 + env na Vercel. Pendências: [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md).
