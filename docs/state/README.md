# Estado do projeto

Documento vivo com **pendências abertas**, prioridades e próximos passos. Atualize ao concluir itens ou ao iniciar nova sessão.

| Documento | Conteúdo |
|-----------|----------|
| [PENDENCIAS.md](./PENDENCIAS.md) | **Plano de lançamento SaaS** — checklist por etapa (MVP → prod → monetização → go-live) |
| [Relatório de testes manuais](../relatorio-testes-manuais.html) | Homologação E2E (POP-QA-SURF-001) — 26 TCs, evidências em `docs/evidencias/` |
| [Implementação](../implementation/README.md) | Registro do que já foi entregue |
| [Bugs corrigidos](./fixed_tasks/README.md) | Bugs de produção já corrigidos — sintoma, causa raiz e validação |
| [Planos e limites](../PLANOS_E_LIMITES.md) | Estratégia SaaS — créditos, planos e monetização |

**Última atualização:** 17/07/2026 — Fase A da especialização da IA de performance implementada (taxonomia de manobras, confiança, mais frames, `gpt-4o`); validação com mídia real em andamento pelo usuário.

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
| 🟡 **IA** — Especialização performance | Validação real da Fase A · Fases B–E | 3 |
| ✅ Concluído | MVP core · 26/26 TCs · IA visão match | — |

**Próximo passo:** validar Fase A da especialização de IA com mídia real (em andamento) · depois Etapa 2 — landing + `/planos`.
