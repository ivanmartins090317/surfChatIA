# Fase · Produção (deploy + observabilidade)

| Status | Spec / registro |
| --- | --- |
| concluída | [`docs/DEPLOY_VERCEL.md`](../DEPLOY_VERCEL.md) · migration `007_rate_limit.sql` |

## O que esta fase entrega

- Deploy na Vercel (região `gru1`, `maxDuration` 60s)
- Variáveis de produção (Supabase, OpenAI, `NEXT_PUBLIC_SITE_URL`)
- Redirect URLs Supabase Auth
- Rate limit **persistido** em Postgres (`check_rate_limit` RPC)
- Sentry (`@sentry/nextjs`, scrub PII, tags `area:ai|upload|rate-limit`)
- Smoke test prod: signup → análise → prancha mágica

Não entrega: domínio próprio, SMTP customizado, landing marketing.

---

## Fluxo de deploy

1. Push na `main` → Vercel build automático
2. Confirmar env em **Settings → Environment Variables**
3. `npm run db:push` no Supabase de produção
4. Atualizar Site URL + Redirect URLs no Supabase Auth
5. Smoke test na URL `.vercel.app`

Detalhes: [`docs/DEPLOY_VERCEL.md`](../DEPLOY_VERCEL.md)

---

## Rate limit

- Bucket anti-abuso IA: 20/dia por usuário (além da cota de créditos)
- Auth: bucket por e-mail
- Implementação: `services/rate-limit-service.ts` + RPC Postgres

---

## Homologação manual

- [ ] Login/signup em prod
- [ ] Uma análise completa em prod (link ou upload)
- [ ] Verificar issue Sentry em erro simulado (opcional, dev route)
- [ ] Confirmar rate limit após muitas tentativas (staging ou conta de teste)

---

## Comandos

```bash
npm run build
npm run db:push
```

---

## Próximo passo

Créditos: [04-fase-creditos-paywall.md](./04-fase-creditos-paywall.md)
