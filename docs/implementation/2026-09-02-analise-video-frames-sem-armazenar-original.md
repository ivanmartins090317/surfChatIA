# Implementação · Análise de vídeo por frames (sem MP4 no Storage)

| Campo | Valor |
|-------|--------|
| **Status** | implementado (código) · `db:push` 013 + homologação manual pendentes |
| **Spec** | [`specs/2026-09-02-analise-video-frames-sem-armazenar-original.md`](../../specs/2026-09-02-analise-video-frames-sem-armazenar-original.md) |
| **Plano** | [`docs/plans/2026-09-02-analise-video-frames-sem-armazenar-original.md`](../plans/2026-09-02-analise-video-frames-sem-armazenar-original.md) |
| **Data** | 2026-09-02 |
| **Autonomia** | `tight` |

## Entregue

### Schema

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/013_media_frame_paths.sql` | Coluna `media_items.frame_paths text[] not null default '{}'` |

### Domínio / mídia

| Arquivo | Descrição |
|---------|-----------|
| `lib/domain/types.ts` | `MediaItem.frame_paths` |
| `lib/media/upload-limits.ts` | Teto dispositivo 500 MB · duração 90 s · copy dropzone / legado |
| `lib/media/storage-path.ts` | `buildMediaFrameStoragePath` |
| `lib/media/extract-video-frames-browser.ts` | Recusa duração > 90 s antes da extração |

### Actions / services

| Arquivo | Descrição |
|---------|-----------|
| `actions/analysis-actions.ts` | Vídeo: persiste frames (sem MP4); atalho `createAnalysisFromFileAction` recusa vídeo |
| `services/media-service.ts` | `persistMediaVideoFrames`; prepare de vídeo sem `storage_path` |
| `services/analysis-service.ts` | Reanálise via `frame_paths`; legado com mensagem clara |
| `services/account-privacy-service.ts` | Exclusão remove paths em `frame_paths` |

### UI

| Arquivo | Descrição |
|---------|-----------|
| `components/performance-analysis/new-analysis-form.tsx` | Fluxo vídeo sem upload do original; progresso lendo → extraindo → analisando |
| `components/performance-analysis/media-file-dropzone.tsx` | Copy 90 s / 500 MB + microcopy |
| `components/performance-analysis/analysis-media-header.tsx` | Miniaturas das fotos da session |

### Testes

| Arquivo | Descrição |
|---------|-----------|
| `lib/__tests__/media-video-frames.test.ts` | Limites, paths, mensagem de legado |
| `lib/__tests__/security-and-parsers.test.ts` | Aceita > 50 MB; rejeita > 500 MB |
| `lib/__tests__/upload-error-message.test.ts` | Mensagem alinhada a 500 MB |

## Evidências Done

```text
npm run typecheck  → exit 0
npm run lint       → exit 0
npm test           → 125 passed
```

## Pendências

- [ ] `npm run db:push` da migration **013** (confirmação do owner)
- [ ] Homologação manual: vídeo > 50 MB ≤ 500 MB / ≤ 90 s → bucket só com `.../frames/*.jpg`
- [ ] Reanálise de item novo vs legado (mensagem de análise antiga)
- [ ] Exclusão de conta limpa JPEGs de `frame_paths`

## Segurança (checklist aplicável)

- Validação Zod de 2–6 frames JPEG na complete action
- Paths gerados no servidor; ownership via RLS + prefixo `{userId}/`
- Bucket privado; exclusão LGPD inclui `frame_paths`
- Saída de IA continua via parser existente
