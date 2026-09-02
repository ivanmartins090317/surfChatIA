# Spec: Billing Mercado Pago (substitui AbacatePay)

| Campo | Valor |
|--------|--------|
| **Status** | `draft` — aguarda aprovação humana |
| **Autonomia** | `tight` (billing, domínio, schema, webhooks, env) |
| **Data** | 2026-09-02 |
| **Owner** | time Surf AI Coach |
| **Refs** | [PLANOS_E_LIMITES.md](../docs/PLANOS_E_LIMITES.md) · [specs/2026-08-20-billing-abacatepay.md](./2026-08-20-billing-abacatepay.md) · resposta AbacatePay 02/09/2026 (CARD descontinuado para contas novas) |

---

## Problema

A AbacatePay descontinuou cartão para novas integrações (inclusive sandbox) e não oferece PIX Automático. **Não há recorrência** nessa conta. Surfista e Pro (R$ 39 / R$ 89 por mês) não podem ser cobrados. Packs avulsos via PIX ainda funcionam, mas o modelo comercial do produto depende de assinatura.

O owner já tem conta Mercado Pago e escolheu esse gateway como substituto.

## Objetivo

Trocar o provedor de pagamento de **AbacatePay** para **Mercado Pago**, mantendo as mesmas ofertas, as mesmas RPCs de créditos/plano e a mesma UI (`/planos`, `/billing`).

- **Surfista / Pro:** assinatura mensal via API `POST /preapproval` (Checkout de assinaturas do MP). O surfista paga com **cartão** no fluxo hospedado do MP (`init_point`).
- **Pack S / Pack M:** pagamento avulso via Checkout Pro (`POST /checkout/preferences`). PIX, cartão e boleto ficam a cargo da página do MP.
- Plano e créditos **só** mudam depois de confirmar o recurso na API do MP (webhook + `GET` do pagamento/assinatura). Redirect de retorno **não** credita.

## Fora de escopo

- Dois gateways ao mesmo tempo (AbacatePay + MP)
- Checkout Transparente / Payment Brick no nosso front (sem SDK React no browser)
- PIX Automático / recorrência PIX no MP (se existir, follow-up)
- Plano Coach, upgrade in-app entre Surfista e Pro (continua uma assinatura ativa por usuário)
- Reembolso automático de créditos
- Nova landing / Trilha B / Trilha I
- Editar PRD
- Commit, push, deploy (só se o owner pedir depois do Done local)

## Decisões fechadas nesta spec

1. **Um único gateway:** Mercado Pago. Checkout AbacatePay sai do app. Rota `/api/webhooks/abacatepay` passa a responder **410** (integração encerrada).
2. **Sem product IDs no painel MP:** preços vêm do catálogo interno (`billing-catalog`). Não precisamos de `ABACATEPAY_PRODUCT_*`.
3. **Assinatura sem plano pré-cadastrado no MP:** `POST /preapproval` com `auto_recurring` inline (1 mês, BRL, valor do catálogo).
4. **Dependência nova:** pacote oficial `mercadopago` (Node SDK). Sem `@mercadopago/sdk-react`.
5. **Acesso nunca no `back_url`:** toast de “estamos confirmando” é ok; efeito de negócio só no webhook após `GET` do recurso.
6. **Teste primeiro com credenciais `TEST-`.** Token de produção (`APP_USR-`) só depois do smoke em sandbox.

## Regras de domínio (iguais às da Trilha H, novo provedor)

| Oferta | Tipo | Preço | Efeito |
|--------|------|-------|--------|
| Surfista | assinatura | R$ 39/mês | plano Surfista · 8 créditos/ciclo |
| Pro | assinatura | R$ 89/mês | plano Pro · 30 créditos/ciclo |
| Pack S | avulso | R$ 19 | +5 créditos avulsos · plano inalterado |
| Pack M | avulso | R$ 49 | +15 créditos avulsos · plano inalterado |

- Uma assinatura `pending` ou `active` por surfista.
- Pack com assinatura ativa: só soma créditos avulsos.
- Cancelamento: MP `PUT /preapproval/{id}` com `status: canceled`. Plano pago vale até `current_period_end`.
- Idempotência: `billing_webhook_events.event_id` (já existe). Evento MP = `{type}:{data.id}` (ex.: `payment:123456`).
- Valor pago deve bater com `offer.priceCents` (MP usa reais; converter `transaction_amount * 100` com arredondamento seguro).
- `external_reference` = `surf:{userId}:{offerKey}` (já existe `buildBillingExternalRef`).

### Provider no banco

`subscriptions.provider` ganha valor `mercadopago`. Manter `abacatepay` no check para linhas antigas (nenhuma assinatura real hoje). Default da coluna passa a `mercadopago`.

Migration nova: `supabase/migrations/012_billing_mercadopago.sql` (aprovação de schema obrigatória).

### Mapeamento de eventos MP → RPCs atuais

| Tópico MP | Recurso a buscar | Condição | RPC |
|-----------|------------------|----------|-----|
| `payment` | `GET /v1/payments/{id}` | `status === approved` e oferta pack | `apply_pack_purchase` |
| `subscription_preapproval` | `GET /preapproval/{id}` | `status === authorized` e oferta assinatura | `apply_subscription_activation` |
| `subscription_authorized_payment` | `GET /authorized_payments/{id}` | cobrança `approved` / `processed` | `apply_subscription_renewal` (primeira cobrança: se ativação já rodou, idempotência evita duplicar) |
| `subscription_preapproval` | `GET /preapproval/{id}` | `status === cancelled` ou `paused` | `apply_subscription_cancellation` (paused trata como cancelado para o app nesta entrega) |

Se o primeiro `authorized_payment` chegar antes do `preapproval` authorized: ativar se ainda não houver assinatura active (mesma RPC de ativação, `event_id` distinto). Sem crédito duplicado.

Pagamento `rejected` / `cancelled` / `pending`: logar, não mutar plano.

## Segurança

- `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` só no servidor.
- Webhook: validar HMAC `x-signature` + `x-request-id` (docs oficiais MP). Sem secret válido → **401**.
- Sempre **buscar o recurso** na API. Nunca creditar só com o body da notificação.
- Responder **200** só depois de persistir o efeito (ou constatar duplicata). Falha interna → **500** para o MP retentar.
- Webhook público (sem cookie de sessão). Mutação via `service_role` / RPC `security definer` (já é o padrão).
- Não logar token, secret, nem PII do pagador.

## Ambiente

```env
MP_ACCESS_TOKEN=TEST-...          # server-only
MP_WEBHOOK_SECRET=...             # secret do painel de Webhooks MP
```

Opcional, só se no futuro usarmos Brick (não nesta entrega): `NEXT_PUBLIC_MP_PUBLIC_KEY`.

Checkout pronto quando `MP_ACCESS_TOKEN` existir. Sem product IDs.

Webhook de produção:

`https://surfiacoach.modernxlab.com.br/api/webhooks/mercadopago`

Tópicos no painel MP: `payment`, `subscription_preapproval`, `subscription_authorized_payment`.

Local: ngrok/túnel + mesma rota; ou só testes unitários + smoke em produção sandbox.

## Fluxos

### Assinatura

1. Surfista autenticado → `/planos` → Assinar Surfista/Pro.
2. Service cria `billing_checkout_sessions` (`external_ref`) e `POST /preapproval` (`status: pending`, `payer_email` do usuário autenticado, `back_url` = `{site}/planos?checkout=success`).
3. Redirect para `init_point` do MP.
4. Surfista paga com cartão de teste (sandbox) ou cartão real (produção).
5. Webhook → `GET /preapproval` → RPC ativação.
6. Renovação mensal → `subscription_authorized_payment` → RPC renovação.

### Pack

1. `/planos` → Comprar Pack S/M.
2. `POST /checkout/preferences` com item (título, quantidade 1, `unit_price` em reais), `external_reference`, `notification_url`, `back_urls` (success / pending / failure).
3. Redirect para `init_point`.
4. Webhook `payment` approved → RPC pack.

### Cancelamento

1. `/billing` → Cancelar.
2. `PUT /preapproval/{external_id}` `status: canceled`.
3. Webhook confirma → RPC cancelamento. Acesso até fim do período.

## UI

- Copy de erro da AbacatePay (cartão desabilitado) **sai**.
- CTAs iguais (Assinar / Comprar). Sem `use client` extra além do botão de checkout já existente.
- Toast de retorno `/planos?checkout=success|cancelled` permanece: sucesso = “pagamento em confirmação”; créditos aparecem quando o webhook processar.
- Textos de cobrança: “Mercado Pago” no lugar de “AbacatePay” onde o usuário vê o provedor.

## Arquitetura (camadas)

`UI → billing-actions → billing-service → lib/billing/mercadopago-* → API MP`

`billing-service` deixa de chamar AbacatePay. Parsers/client AbacatePay podem ser removidos (não deixar mortos).

## Escopo de arquivos

| Área | Paths |
|------|--------|
| Spec | `specs/2026-09-02-billing-mercadopago.md` |
| Schema | `supabase/migrations/012_billing_mercadopago.sql` *(crítico)* |
| Domínio | `lib/domain/billing.ts` *(crítico, `provider`)* |
| Gateway | `lib/billing/mercadopago-*.ts` *(novo, crítico)*; remover `lib/billing/abacatepay-*` |
| Catálogo / env | `lib/billing/billing-catalog.ts`, `lib/env.ts`, `.env.example` |
| Service / actions | `services/billing-service.ts`, `actions/billing-actions.ts` |
| Webhook | `app/api/webhooks/mercadopago/route.ts` *(novo)*; `app/api/webhooks/abacatepay/route.ts` → 410 |
| UI | `app/(app)/planos/**`, `app/(app)/billing/**`, `components/billing/**` |
| Testes | `lib/__tests__/mercadopago*.ts`, `lib/__tests__/billing-*.ts`; apagar testes AbacatePay órfãos |
| Docs vivos | implementation, manual-dev, PENDENCIAS, PLANO_GO_LIVE, close-phase |
| Deps | `package.json` (`mercadopago`) |

**Não alterar:** `lib/ai/**`, `middleware.ts`, PRD, Termos, fluxos de análise.

## Critérios de Done

- [ ] Spec aprovada por escrito nesta conversa
- [ ] Checkout Surfista, Pro, Pack S, Pack M via Mercado Pago
- [ ] Webhook HMAC + fetch do recurso + RPCs existentes
- [ ] Idempotência coberta por teste
- [ ] Valor divergente do catálogo não credita
- [ ] Cancelamento in-app chama API MP
- [ ] AbacatePay fora do caminho feliz (410 no webhook antigo)
- [ ] Migration 012 documentada; `db:push` só com o owner
- [ ] `npm run typecheck` · `lint` · `test`
- [ ] Docs vivos (close-phase)
- [ ] Checklist SECURITY.md (webhook, segredos, RLS)

## Tarefas do owner (não são código)

1. [developers.mercadopago.com](https://www.mercadopago.com.br/developers/panel/app) → criar/usar aplicação **Surf AI Coach**.
2. Copiar **Access Token de teste** (`TEST-...`) e, depois do smoke, o de produção.
3. Webhooks da aplicação: URL de produção acima + secret; tópicos listados.
4. Passar token e secret para `.env.local` e Vercel (eu **não** gravo `.env` sem confirmação).
5. Homologar com **comprador de teste** do MP (cartão de teste do painel). Assinatura usa cartão; pack pode usar PIX de teste.
6. Aplicar migration 012 no Supabase remoto quando o código estiver pronto.

## Riscos

- Assinatura MP no Brasil é **cartão**, não PIX. Pack continua podendo ser PIX.
- Conta MP precisa estar apta a receber (produção). Sandbox funciona com usuários de teste mesmo antes do KYC completo; confirmar no painel.
- Primeira cobrança vs `preapproval` authorized pode chegar fora de ordem; a spec já trata.
- `transaction_amount` do MP é em reais (39.00), catálogo interno em centavos (3900).

## Aprovação

- [ ] Spec aprovada para implementação (responda **aprovado** nesta conversa)
- [ ] Autorizo dependência `mercadopago`
- [ ] Autorizo migration `012_billing_mercadopago.sql`
- [ ] Autorizo alteração de `lib/domain/billing.ts` (`provider`)
