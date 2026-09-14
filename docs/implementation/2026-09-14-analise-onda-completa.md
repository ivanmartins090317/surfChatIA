# Implementação · Análise da onda completa (vídeo)

| Campo | Valor |
|-------|--------|
| **Status** | implementado (código) · pintura da foto **desligada** (owner 14/09) · homologação gabarito (2 vídeos) pendente |
| **Spec** | [`specs/2026-09-14-analise-onda-completa.md`](../../specs/2026-09-14-analise-onda-completa.md) |
| **Plano** | [`docs/plans/2026-09-14-analise-onda-completa.md`](../plans/2026-09-14-analise-onda-completa.md) |
| **Data** | 2026-09-14 |
| **Autonomia** | `tight` (IA, domínio e mídia privada) |

## Entregue

### IA

| Arquivo | Descrição |
|---------|-----------|
| `lib/ai/performance-prompt.ts` | Prompt de vídeo: fases da ride, cadência de drop, não elogiar falha, leitura de seção |
| `lib/ai/performance-parser.ts` | Zod de `fases[]` + `leitura_da_secao`; descarta `coaching_image_path` da IA |
| `lib/ai/wave-coaching.ts` | Fases + `WAVE_COACHING_VISUAL_ENABLED = false` (não agenda pintura) |
| `lib/ai/edit-coaching-image.ts` | Validação MIME/tamanho da foto anotada |
| `lib/ai/client.ts` | `editUserImage` (`gpt-image-1`, `input_fidelity: high`) |
| `lib/ai/usage-log.ts` | Kind `image_edit` (sem estimar custo de mini) |
| `lib/ai/cost-baseline.ts` | Vídeo ~8 frames |

### Domínio / mídia

| Arquivo | Descrição |
|---------|-----------|
| `lib/domain/types.ts` | `WavePhase`, `leitura_da_secao`, `coaching_visual_status` |
| `lib/domain/analysis-display.ts` | Timeline, rótulo de identificação, coleta de paths LGPD |
| `lib/media/video-frame-sampling.ts` | `VIDEO_FRAME_COUNT = 8` (mínimo mobile = 2) |
| `lib/media/storage-path.ts` | `{userId}/{mediaId}/coaching/{analysisId}/{uuid}.png` |

### Actions / services

| Arquivo | Descrição |
|---------|-----------|
| `services/analysis-service.ts` | Persiste fases no `done`; agenda coaching sem segundo crédito |
| `services/wave-coaching-service.ts` | Passo 2: até 3 edições; fallback se falhar |
| `services/media-service.ts` | `persistCoachingImage` |
| `services/account-privacy-service.ts` | Exclusão apaga fotos da session **e** coachings |
| `actions/analysis-actions.ts` | `generateWaveCoachingVisualsAction` (idempotente, sem débito) |

### UI

| Arquivo | Descrição |
|---------|-----------|
| `components/performance-analysis/wave-phase-timeline.tsx` | Timeline RSC com foto original da fase |
| `components/performance-analysis/wave-phase-card.tsx` | Card da fase: foto, qualidade, certeza rotulada, dicas |
| `components/performance-analysis/performance-result-view.tsx` | Ordem: score → timeline → leitura → resumo |
| `app/(app)/analyses/[id]/page.tsx` | URLs assinadas das fotos originais da session |

### Testes

| Arquivo | Descrição |
|---------|-----------|
| `lib/__tests__/wave-phase-coaching.test.ts` | Parser, fases, teto 3, rótulo, prompts, PNG |
| `lib/__tests__/video-frame-sampling.test.ts` | 8 timestamps (via `VIDEO_FRAME_COUNT`) |
| `lib/__tests__/media-video-frames.test.ts` | Ownership do path de coaching |
| `lib/__tests__/ai-usage-log.test.ts` | Kind `image_edit` |

## Evidências Done

```text
npm run typecheck  → exit 0
npm run lint       → exit 0
npm test           → 157 passed (19 files)
npm run build      → exit 0
```

Sem migration (path de coaching no `result_json`).

## Pendências

- [ ] Homologação gabarito: point lento + beach break (checklist da Spec, sem pintura)
- [ ] Medir `ai.usage` (8 visões) após a primeira dezena
- Pintura da foto (nível C): **desligada** após teste do owner (14/09). Código permanece atrás de `WAVE_COACHING_VISUAL_ENABLED`.

## Segurança (checklist aplicável)

- Saída de IA (JSON e PNG) validada antes de persistir/mostrar (`parsePerformanceResult`, `validateCoachingImageBytes`)
- Foto anotada nunca reenviada para nova análise; path gerado no servidor; bucket privado
- Autorização server-side (sessão + dono) na action de coaching; sem segundo débito
- Exclusão de conta remove `frame_paths` e `coaching_image_path`
- Sem migration / RLS nova; policies do prefixo `{userId}/` cobrem `/coaching/`
- Rate limit da análise textual permanece; coaching é continuação do mesmo ciclo (1 crédito)
