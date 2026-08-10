# Trilha G — Custo IA + operação (conclusão)

> **Data:** 2026-08-10 · **Spec:** [specs/2026-08-10-custo-ia-operacao.md](../../specs/2026-08-10-custo-ia-operacao.md) · **Modelo:** `gpt-4o-mini`  
> **Preços OpenAI (ago/2026):** input **US$ 0,15 / 1M** · output **US$ 0,60 / 1M**  
> **Câmbio de referência:** **US$ 1 = R$ 5,50** (ajustar na validação billing)

---

## 1. Instrumentação entregue

| Item | Onde |
|------|------|
| Extração de `response.usage` + estimativa USD | [`lib/ai/usage-log.ts`](../../lib/ai/usage-log.ts) |
| Log estruturado `ai.usage` (JSON, sem PII) + breadcrumb Sentry | chamado em [`lib/ai/client.ts`](../../lib/ai/client.ts) |
| Baseline e margem Go/No-Go | [`lib/ai/cost-baseline.ts`](../../lib/ai/cost-baseline.ts) |
| Testes | `lib/__tests__/ai-usage-log.test.ts`, `lib/__tests__/ai-cost-baseline.test.ts` |

Formato do log (Vercel → Functions → Logs):

```json
{
  "event": "ai.usage",
  "model": "gpt-4o-mini",
  "kind": "vision",
  "imageCount": 6,
  "promptTokens": 16000,
  "completionTokens": 950,
  "totalTokens": 16950,
  "estimatedCostUsd": 0.00297
}
```

---

## 2. Baseline de custo por tipo (estimativa calibrada)

Perfis em `AI_COST_BASELINE_PROFILES` — derivados do tamanho dos prompts + visão `detail: high` (vídeo ≈ 6 frames). **Não substituem** o cruzamento com OpenAI Billing (protocolo §4).

| Tipo | n perfil | Tokens médios (prompt + completion) | Imagens | Custo médio USD | Custo médio BRL |
|------|----------|-------------------------------------|---------|-----------------|-----------------|
| performance (imagem) | 1 | 5 500 + 850 | 1 | **0,001335** | **R$ 0,0073** |
| performance (vídeo) | 1 | 16 000 + 950 | 6 | **0,002970** | **R$ 0,0163** |
| board_spec (texto) | 1 | 2 800 + 1 100 | 0 | **0,001080** | **R$ 0,0059** |
| board_match (~4 fotos) | 1 | 13 000 + 750 | 4 | **0,002400** | **R$ 0,0132** |

**Custo médio ponderado por crédito** (pesos Spec: 1 img + 2 vídeo + 2 board + 1 match):  
**US$ 0,001972 ≈ R$ 0,0108**

**p95 operacional (pior caso baseline = vídeo):** US$ 0,00297 ≈ R$ 0,0163

Comparação com projeção em [PLANOS_E_LIMITES.md](../PLANOS_E_LIMITES.md) (R$ 0,10–0,40 / vídeo): o baseline atual com `gpt-4o-mini` está **abaixo** da faixa conservadora do doc — margem confortável.

### Status da amostra real

| Item | Status |
|------|--------|
| Instrumentação pronta para capturar tokens reais | ✅ |
| Amostra mínima (≥3 perf / ≥2 board / ≥1 match) cruzada com Billing | ⏳ **pendente validação owner** (protocolo §4) |
| Baseline usado para Go/No-Go de preços | ✅ estimativa + testes; revalidar após §4 |

---

## 3. Margem vs Surfista / Pro

Critério Spec: custo p95 por crédito ≤ **25%** da receita por crédito no Surfista (R$ 39 / 8 ≈ R$ 4,87 → teto ≈ R$ 1,20).

| Plano | Preço | Créditos | Receita/crédito | Custo IA/crédito (média) | Share custo | Uso cheio IA/mês | Go/No-Go |
|-------|-------|----------|-----------------|--------------------------|-------------|------------------|----------|
| Surfista | R$ 39 | 8 | R$ 4,875 | R$ 0,0108 | **0,22%** | R$ 0,09 | **GO** |
| Pro | R$ 89 | 30 | R$ 2,967 | R$ 0,0108 | **0,37%** | R$ 0,33 | **GO** |
| Pro (uso médio ~15) | R$ 89 | 15 usados | — | — | — | R$ 0,16 | **GO** |

Stress (se custo real for **50×** o baseline, ~R$ 0,54/crédito): Surfista share ≈ 11% — ainda **GO**.  
Só quebraria o teto de 25% com custo ≈ **R$ 1,22/crédito** (~110× o baseline atual) — cenário de modelo muito mais caro (`gpt-4o` full) ou abuso extremo de frames.

### Decisão

**Manter preços** Surfista R$ 39 (8) e Pro R$ 89 (30) e packs S/M.  
**Não** subir modelo para `gpt-4o` só por margem (Trilha F decide por qualidade).  
Reavaliar se a amostra billing (§4) mostrar custo/crédito **> 2×** o baseline (flag da rotina semanal).

---

## 4. Protocolo — amostra controlada + OpenAI Billing

Executar em prod (ou staging com a **mesma** `OPENAI_API_KEY` de billing):

1. Anotar horário início (UTC) e saldo/gasto do dia em [OpenAI Usage](https://platform.openai.com/usage).
2. Rodar no app:
   - 3× performance (pelo menos 1 imagem + 1 vídeo com frames)
   - 2× prancha mágica
   - 1× compatibilidade
3. Em Vercel Logs, filtrar `ai.usage` e copiar tokens/`estimatedCostUsd` por chamada.
4. Após ~15 min, anotar delta de custo no Billing OpenAI no mesmo intervalo.
5. Preencher tabela real (substituir §2):

| Tipo | n | tokens médios | custo médio (log) | custo Billing alocado | vs baseline |
|------|---|---------------|-------------------|-----------------------|-------------|
| performance | | | | | |
| board_spec | | | | | |
| board_match | | | | | |

6. Se `|billing − soma(logs)| / billing > 20%`, investigar retries/falhas ou outra key.
7. Atualizar este doc + `AI_COST_BASELINE_PROFILES` com médias reais.

---

## 5. Alertas Sentry + rotina semanal

### Alertas (Sentry → Alerts)

Configurar / confirmar em produção (já sugeridos em [DEPLOY_VERCEL.md](../DEPLOY_VERCEL.md) §7):

1. **Issue novo** com tag `area` = `ai` **ou** `upload` → notificar e-mail do owner  
2. **Spike:** > **5** eventos de erro em **1 hora** (mesmo projeto) → notificar  

Teste rápido: `GET /api/dev/sentry-test` (só com DSN) ou erro real de upload/IA.

### Checklist semanal (≤ 5 min) — toda segunda

- [ ] OpenAI → Usage: gasto USD da última semana  
- [ ] Supabase → contar débitos em `usage_ledger` (`credits_delta < 0`) na mesma janela  
- [ ] `custo_por_crédito_USD ≈ gasto_OpenAI / nº_débitos`  
- [ ] Comparar com baseline **US$ 0,001972** — **flag** se > **2×** (US$ 0,00394)  
- [ ] Sentry: issues abertos `area:ai` / `area:upload` sem dono?  
- [ ] Se flag: abrir nota em `docs/state/` e pausar ads / upgrade de modelo até entender

---

## 6. Resultado Trilha G

| Critério Done | Status |
|---------------|--------|
| Custo/análise conhecido (baseline + instrumento) | ✅ |
| Preços validados (Go) antes de ads | ✅ (com revalidação billing §4) |
| Alertas + rotina semanal documentados | ✅ |
| Scoreboard G no plano go-live | ✅ |

**Autonomia:** `tight` · Diff crítico `lib/ai/**`: sim (review humano recomendado).
