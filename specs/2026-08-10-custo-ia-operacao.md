# Spec: Custo IA + operação (Trilha G)

| Campo | Valor |
|-------|--------|
| **Status** | `done` |
| **Autonomia** | `tight` (toca `lib/ai/` — path crítico) |
| **Data** | 2026-08-10 |
| **Owner** | time Surf AI Coach |
| **Refs** | [PLANO_GO_LIVE_COBRANCA.md](../docs/state/PLANO_GO_LIVE_COBRANCA.md) Trilha G · [PLANOS_E_LIMITES.md](../docs/PLANOS_E_LIMITES.md) · plano aprovado na conversa |

---

## Problema

O produto já debita créditos, mas o **custo real de IA por análise** (performance / board / match) não está medido. Sem isso, os preços Surfista/Pro são hipótese e há risco de margem negativa antes de ads ou cobrança pública.

## Objetivo

1. Instrumentar logs de `usage` (tokens) por chamada OpenAI, sem PII.
2. Medir / estimar custo médio por tipo de análise e validar margem vs planos.
3. Fechar alertas operacionais (Sentry IA/upload) e rotina semanal de revisão OpenAI.
4. Documentar conclusão Go/No-Go de preços.

## Fora de escopo

- Troca de modelo (`gpt-4o`) — Trilha F
- Gateway / cobrança — Trilhas D/H
- Persistir tokens/custo no Postgres (sem migration)
- Dashboard admin de $$, alerta Slack/budget automático

---

## Regras de domínio

### Medição

- Cada chamada de IA registra, no servidor, metadados de uso: modelo, tipo (`text` | `vision`), quantidade de imagens (se visão), `prompt_tokens`, `completion_tokens`, `total_tokens`.
- Logs **não** incluem prompt, resposta, base64, e-mail ou IDs de usuário.
- Custo estimado em USD:  
  `custo = (prompt_tokens * preço_input + completion_tokens * preço_output) / 1_000_000`  
  (preços oficiais do modelo ativo; visão embutida nos `prompt_tokens` reportados pela API).

### Amostra mínima (validação operacional)

- ≥3 análises de performance (mistura imagem e vídeo/frames)
- ≥2 prancha mágica (`board_spec`)
- ≥1 compatibilidade (`board_match`)
- Cruzar logs de tokens com delta no painel OpenAI Billing no mesmo período

### Margem / Go-No-Go

- Receita por crédito Surfista: R$ 39 / 8 ≈ **R$ 4,87**
- Teto alvo de custo p95 por crédito: **≤ ~25%** da receita por crédito ≈ **R$ 1,20** (converter USD→BRL com câmbio do dia da medição)
- Decisão explícita no doc: manter preços / ajustar créditos / subir preço / trocar modelo

### Alertas e operação

- Sentry: alerta para novos issues com tag `area:ai` ou `area:upload`; spike (>5 erros/1h)
- Rotina semanal (≤5 min): OpenAI Usage × nº de débitos em `usage_ledger`; flag se custo/crédito >2× o baseline documentado

---

## Caminho feliz

1. Chamada IA conclui → log estruturado com tokens.
2. Owner roda amostra mínima → anota billing + logs.
3. Doc de conclusão preenche tabela por tipo e margem Surfista/Pro.
4. Alertas Sentry ativos + checklist semanal publicado.
5. Scoreboard Trilha G marcado como concluído.

## Erros e bordas

| Situação | Comportamento esperado |
|----------|------------------------|
| `response.usage` ausente | Log com tokens `null` / zero; análise segue normal |
| Sentry DSN ausente | Breadcrumb/uso de Sentry é no-op; `console` estruturado permanece |
| Falha da API OpenAI | Sem log de usage de sucesso; erro existente via `reportServerError` |

## Critérios de Done

- [x] Spec aprovada (esta)
- [x] Instrumentação em `lib/ai/` + teste unitário do helper de usage
- [x] Doc em `docs/implementation/` com custo/tipo, margem e decisão
- [x] Alertas Sentry documentados/confirmados + rotina semanal
- [x] Scoreboard Trilha G atualizado no plano go-live
- [x] `npm run typecheck` · `npm run lint` · `npm test` verdes

## Escopo de arquivos permitido

| Área | Paths / globs |
|------|----------------|
| Spec | `specs/2026-08-10-custo-ia-operacao.md` |
| IA | `lib/ai/client.ts`, `lib/ai/usage-log.ts`, `lib/ai/cost-baseline.ts`, testes em `lib/__tests__/**` |
| Docs | `docs/implementation/2026-08-10-custo-ia-operacao.md`, `docs/DEPLOY_VERCEL.md` (alertas/rotina), `docs/state/PLANO_GO_LIVE_COBRANCA.md` (scoreboard) |
| Observabilidade (só se necessário) | `lib/observability/**` — breadcrumb mínimo |

Paths críticos (`lib/ai/**`): Spec aprovada via plano da conversa + review humano do diff.

## Notas / decisões abertas

- Preços OpenAI oficiais do `gpt-4o-mini` devem ser citados com data no doc de conclusão.
- Se a amostra real não puder rodar no mesmo dia (sem mídia/billing), o doc usa estimativa por tokens + preços oficiais e marca “pendente validação billing” com protocolo claro — mas a instrumentação e a rotina fecham mesmo assim.
