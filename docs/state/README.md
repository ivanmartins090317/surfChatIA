# Estado do projeto

Documento vivo com **pendências abertas**, prioridades e próximos passos. Atualize ao concluir itens ou ao iniciar nova sessão.

| Documento | Conteúdo |
|-----------|----------|
| [PENDENCIAS.md](./PENDENCIAS.md) | **Plano de lançamento SaaS** — checklist por etapa (MVP → prod → monetização → go-live) |
| [Relatório de testes manuais](../relatorio-testes-manuais.html) | Homologação E2E (POP-QA-SURF-001) — 26 TCs, evidências em `docs/evidencias/` |
| [Implementação](../implementation/README.md) | Registro do que já foi entregue |
| [Planos e limites](../PLANOS_E_LIMITES.md) | Estratégia SaaS — créditos, planos e monetização |

**Última atualização:** 13/07/2026 — IA visão board-match validada E2E · 26/26 TCs

## Convenção

- `[ ]` — pendente
- `[x]` — concluído (mover para `docs/implementation/` na próxima sessão registrada)

## Resumo rápido

| Etapa | Foco | Abertos |
|-------|------|---------|
| 🟡 **1** — MVP fechado | DoD visual §15 | 1 |
| 🔴 **2** — Produção | Deploy Vercel, rate limit, observabilidade | 10 |
| 🟡 **3** — Monetização | Créditos, ledger, paywall | 11 |
| 🟢 **4** — Pagamentos | Stripe/MP, webhooks, planos | 9 |
| 🟢 **5** — Go-live | Legal LGPD, beta, lançamento | 7 |
| ✅ Concluído | MVP core · 26/26 TCs · IA visão match | — |

**Próximo passo:** Etapa 2 — deploy Vercel + variáveis de produção.
