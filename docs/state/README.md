# Estado do projeto

Documento vivo com **pendências abertas**, prioridades e próximos passos. Atualize ao concluir itens ou ao iniciar nova sessão.

| Documento | Conteúdo |
|-----------|----------|
| [**PLANO_GO_LIVE_COBRANCA.md**](./PLANO_GO_LIVE_COBRANCA.md) | **Plano operacional go-live + cobrança** — trilhas paralelas A–I, scoreboard e Done |
| [PENDENCIAS.md](./PENDENCIAS.md) | Plano de lançamento SaaS — checklist histórico por etapa (MVP → prod → monetização) |
| [Relatório de testes manuais](../relatorio-testes-manuais.html) | Homologação E2E (POP-QA-SURF-001) — 26 TCs, evidências em `docs/evidencias/` |
| [Implementação](../implementation/README.md) | Registro do que já foi entregue |
| [Bugs corrigidos](./fixed_tasks/README.md) | Bugs de produção já corrigidos — sintoma, causa raiz e validação |
| [Incidentes resolvidos](./incidentes-resolvidos/README.md) | Incidentes (infra + config + produto) resolvidos — post-mortem curto |
| [Planos e limites](../PLANOS_E_LIMITES.md) | Estratégia SaaS — créditos, planos e monetização |

**Última atualização:** 10/08/2026 — pasta [incidentes-resolvidos](./incidentes-resolvidos/README.md) + incidente de upload Storage/limite 50 MB.

## Convenção

- `[ ]` — pendente
- `[x]` — concluído (mover para `docs/implementation/` na próxima sessão registrada)

## Resumo rápido

Use o scoreboard vivo em [PLANO_GO_LIVE_COBRANCA.md](./PLANO_GO_LIVE_COBRANCA.md). Abaixo, espelho das etapas históricas:

| Etapa / trilha | Foco | Abertos (aprox.) |
|----------------|------|------------------|
| 🟡 **1** — MVP fechado | DoD visual §15 | 1 |
| 🟡 **2** — Produção | Landing `/planos` · domínio/SMTP | ~7 |
| 🔴 **A / 3** — Monetização | Créditos, ledger, paywall | 12 |
| ⏸️ **H / 4** — Pagamentos | Stripe/MP, webhooks (após A+D) | 10 |
| ⏸️ **I / 5** — Go-live | Legal LGPD, beta, lançamento | 5+ |
| 🟡 **F / IA** — Qualidade | Validação real · DoD visual | 4 |
| ✅ Concluído | MVP core · 26/26 TCs · deploy · rate limit · Sentry | — |

**Próximo passo:** abrir em paralelo as trilhas **A** (créditos), **B** (landing), **C** (legal), **D** (escolher Stripe/MP).
