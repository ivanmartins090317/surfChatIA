# Incidente — Falha no upload de análise (Storage + limite de tamanho)

> **Status:** ✅ Resolvido  
> **Severidade:** Alta — bloqueava análises por upload de arquivo (vídeo) em `/analyses/new`  
> **Módulo:** Análise de performance → upload client-side → Supabase Storage  
> **Ambiente:** Projeto Supabase `oxzwhxauqsoozezuciqr` (plano Free) · app local / produção  
> **Data:** 2026-08-10

---

## Sintoma

Na tela **Nova análise** (`/analyses/new`), aba **Arquivo**, o surfista selecionava um vídeo e via estados contraditórios ou erros genéricos:

1. **Fase A** — banner vermelho:
   ```
   Falha no upload. Verifique sua conexão e tente novamente.
   ```
   DevTools mostrava falhas de `fonts.googleapis.com` (ruído de CSP); o log relevante era no Storage.

2. **Fase B** (após recriar buckets) — o dropzone aceitava o arquivo com check verde (“pronto para analisar”), ex.: `MVI_9313.MP4` **73,8 MB**, e só no envio aparecia:
   ```
   Arquivo acima do limite permitido. Comprima o vídeo ou envie um link.
   ```

Créditos e sessão estavam ok (ex.: “2 créditos”). Aba **Link** / fluxos só de leitura não eram o foco do incidente.

---

## Timeline

| Quando | Evento |
|--------|--------|
| ~22:03 UTC-3 | Usuário reporta falha genérica de upload na análise |
| Diagnóstico 1 | Storage API: `NoSuchBucket` para `media` e `boards` |
| Correção 1 | Migration `009_ensure_storage_buckets.sql` + policies RLS reaplicadas; mensagens de erro mais específicas |
| ~22:10 | Retry: OPTIONS 200 no path do objeto; POST rejeitado por tamanho |
| Diagnóstico 2 | App/bucket em **100 MB**; **Global file size** do Supabase Free = **50 MB** |
| Correção 2 | `MAX_VIDEO_BYTES` → 50 MB; migration `010_align_media_bucket_size_limit.sql`; validação na seleção alinhada ao limite real |

---

## Causa raiz

Dois problemas em sequência (o segundo só ficou visível depois do primeiro):

### 1. Buckets Storage ausentes

- A migration `005_storage_buckets.sql` constava como aplicada no histórico remoto, mas as linhas em `storage.buckets` **não existiam** (drift / remoção posterior / materialização incompleta).
- O upload client-side (`lib/media/upload-client.ts` → `storage.from("media").upload`) falhava com `NoSuchBucket`.
- A UI engolia o erro real e mostrava “verifique sua conexão”.

### 2. Limite global Free (50 MB) vs produto (100 MB)

- Documentação/produto e o app validavam vídeo até **100 MB** (`MAX_VIDEO_BYTES`).
- Bucket `media` foi recriado com `file_size_limit = 100 MB`.
- No plano **Free**, o [Global file size](https://supabase.com/docs/guides/storage/uploads/file-limits) do projeto **não pode passar de 50 MB** e prevalece sobre o limite do bucket.
- Vídeo de **73,8 MB** passava na validação do cliente e era rejeitado no Storage (`maximum allowed size` / equivalente → mensagem de “acima do limite”).

---

## Correção

### Infra / banco

| Migration | Efeito |
|-----------|--------|
| `supabase/migrations/009_ensure_storage_buckets.sql` | Garante buckets privados `media` (100 MB→depois alinhado) e `boards` (10 MB); reaplica policies RLS de `storage.objects` de forma idempotente |
| `supabase/migrations/010_align_media_bucket_size_limit.sql` | `media.file_size_limit = 52428800` (50 MB), alinhado ao Free |

Aplicadas com `npm run db:push`.

### App

- `lib/media/upload-limits.ts` — `MAX_VIDEO_BYTES = 50 * 1024 * 1024`; helpers `videoOversizeMessage` / `imageOversizeMessage`
- Dropzone e `media-service` passam a usar esses helpers (sem “100 MB” hardcoded)
- `lib/media/upload-error-message.ts` + `upload-client.ts` — mapeiam erros do Storage (bucket, tamanho, RLS, conflito) e checam sessão antes do upload
- Testes: `lib/__tests__/upload-error-message.test.ts`, cenários de vídeo em `lib/__tests__/security-and-parsers.test.ts`
- `next.config.ts` — comentário do `bodySizeLimit` alinhado a 50 MB

---

## Validação

- [x] Após `009`: upload anônimo no Storage deixa de retornar `NoSuchBucket` e passa a falhar em RLS (`AccessDenied`) — bucket existe
- [x] `storage.buckets` remoto contém `media` e `boards` com limites esperados
- [x] Após alinhar a 50 MB: arquivo > 50 MB é rejeitado **na seleção** (não só no Storage)
- [x] `npx vitest run lib/__tests__/upload-error-message.test.ts lib/__tests__/security-and-parsers.test.ts` — verdes
- [ ] Smoke manual: vídeo ≤ 50 MB completa análise; vídeo > 50 MB é barrado no dropzone com mensagem clara

---

## Lições / follow-up

1. **Limite efetivo = min(app, bucket, global do plano).** Validação do cliente deve espelhar o teto real da infra, não só a intenção de produto.
2. **Erros genéricos de upload escondem drift de infra** — mapear `NoSuchBucket`, 413 e RLS acelera o próximo incidente.
3. **Histórico de migration ≠ estado do Storage** — vale checar `storage.buckets` (SQL) e um probe de upload após `db:push` de buckets.
4. **Follow-up de produto:** `docs/PLANOS_E_LIMITES.md` ainda cita vídeo **100 MB**. Opções:
   - manter **50 MB** enquanto o projeto estiver no Free; ou
   - upgrade Supabase **Pro** + Global file size ≥ 100 MB no Dashboard e voltar `MAX_VIDEO_BYTES` / bucket / docs para 100 MB.
5. Para o vídeo de 73,8 MB no Free: comprimir, usar aba **Link**, ou subir o plano do Supabase.

---

## Referências

- [Supabase — File size limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
- `lib/media/upload-client.ts` · `lib/media/upload-limits.ts` · `lib/media/upload-error-message.ts`
- `components/performance-analysis/new-analysis-form.tsx` · `media-file-dropzone.tsx`
- `services/media-service.ts`
- `supabase/migrations/005_storage_buckets.sql` · `009_ensure_storage_buckets.sql` · `010_align_media_bucket_size_limit.sql`
- Bugs relacionados (código): [`fixed_tasks/2026-07-27-fix-extracao-frames-video-mobile.md`](../fixed_tasks/2026-07-27-fix-extracao-frames-video-mobile.md), [`fixed_tasks/2026-07-14-csp-bloqueia-extracao-video-navegador.md`](../fixed_tasks/2026-07-14-csp-bloqueia-extracao-video-navegador.md)
