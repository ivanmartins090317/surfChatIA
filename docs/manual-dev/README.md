# Manual do desenvolvedor · Surf AI Coach

Guia de arquitetura, fases implementadas, homologação manual e operação do ambiente.

**Stack:** Next.js (App Router) · Supabase · OpenAI (`lib/ai/`) · Vercel · Sentry

---

## Índice

| Documento | Conteúdo |
| --- | --- |
| [01-arquitetura.md](./01-arquitetura.md) | Visão geral, camadas, módulos e integrações |
| [02-fase-mvp-core.md](./02-fase-mvp-core.md) | MVP: auth, perfil, análise, prancha, compatibilidade |
| [03-fase-producao-deploy.md](./03-fase-producao-deploy.md) | Deploy Vercel, rate limit Postgres, Sentry |
| [04-fase-creditos-paywall.md](./04-fase-creditos-paywall.md) | Créditos, ledger, paywall, planos de exemplo |
| [05-fase-legal-lgpd.md](./05-fase-legal-lgpd.md) | Termos, privacidade, aceite, export/exclusão |
| [06-fase-billing-abacatepay.md](./06-fase-billing-abacatepay.md) | Histórico AbacatePay (substituído) |
| [07-fase-signup-ux-fluxo-conta.md](./07-fase-signup-ux-fluxo-conta.md) | UX signup: redirect, banners, confirmação de e-mail |
| [08-fase-billing-mercadopago.md](./08-fase-billing-mercadopago.md) | Mercado Pago: checkout, webhooks, cobrança |
| [09-fase-analise-video-frames.md](./09-fase-analise-video-frames.md) | Vídeo por frames sem armazenar o MP4 |

## Documentos relacionados

| Onde | Para quê |
| --- | --- |
| [`docs/implementation/`](../implementation/README.md) | Registro objetivo do que foi entregue |
| [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md) | Checklist histórico por etapa |
| [`docs/state/PLANO_GO_LIVE_COBRANCA.md`](../state/PLANO_GO_LIVE_COBRANCA.md) | Scoreboard go-live + cobrança (trilhas A–I) |
| [`docs/relatorio-testes-manuais.html`](../relatorio-testes-manuais.html) | Homologação E2E (26 TCs) |
| [`docs/DEPLOY_VERCEL.md`](../DEPLOY_VERCEL.md) | Deploy, env e alertas |
| [`docs/SECURITY.md`](../SECURITY.md) | Checklist de segurança |
| [`AGENTS.md`](../../AGENTS.md) | Constituição do projeto para agentes |

## Fases / trilhas

| Fase / trilha | Status | Manual |
| --- | --- | --- |
| MVP core | concluída (código) · E2E 26/26 | [02-fase-mvp-core.md](./02-fase-mvp-core.md) |
| Produção (deploy + observabilidade) | concluída | [03-fase-producao-deploy.md](./03-fase-producao-deploy.md) |
| A · Créditos + paywall | concluída (código) | [04-fase-creditos-paywall.md](./04-fase-creditos-paywall.md) |
| C · Legal / LGPD | concluída (código) | [05-fase-legal-lgpd.md](./05-fase-legal-lgpd.md) |
| H · Billing AbacatePay | histórico (substituído pelo MP) | [06-fase-billing-abacatepay.md](./06-fase-billing-abacatepay.md) |
| Signup UX (Fase A) | implementado (código) · homologação manual pendente | [07-fase-signup-ux-fluxo-conta.md](./07-fase-signup-ux-fluxo-conta.md) |
| H · Billing Mercado Pago | implementado (código) · homologação sandbox pendente | [08-fase-billing-mercadopago.md](./08-fase-billing-mercadopago.md) |
| Análise vídeo por frames | implementado (código) · `db:push` 013 + homologação pendentes | [09-fase-analise-video-frames.md](./09-fase-analise-video-frames.md) |
| B · Landing | pendente | — |
| D · Gateway (conta/painel) | app MP criada · `db:push` 012 + E2E pendentes | [08-fase-billing-mercadopago.md](./08-fase-billing-mercadopago.md) |

## Comandos do dia a dia

```bash
npm run dev              # http://localhost:3000
npm run typecheck
npm run lint
npm run test
npm run build
npm run db:push          # migrations no Supabase remoto (ver skill supabase-migrations)
```

## Regra de manutenção

Ao **fechar cada fase** (skill `.cursor/skills/close-phase/SKILL.md`):

1. Registrar entregáveis em `docs/implementation/`
2. Adicionar capítulo em `docs/manual-dev/` (este manual)
3. Atualizar `docs/state/PENDENCIAS.md` e scoreboard em `PLANO_GO_LIVE_COBRANCA.md` quando aplicável
