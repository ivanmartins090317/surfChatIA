# Fase · Análise de vídeo por frames (sem armazenar o original)

| Status | Spec |
| --- | --- |
| implementado (código) · homologação manual pendente | [`specs/2026-09-02-analise-video-frames-sem-armazenar-original.md`](../../specs/2026-09-02-analise-video-frames-sem-armazenar-original.md) |

Registro objetivo: [`docs/implementation/2026-09-02-analise-video-frames-sem-armazenar-original.md`](../implementation/2026-09-02-analise-video-frames-sem-armazenar-original.md)

## O que esta fase entrega

- Análise de vídeo **sem enviar o MP4/MOV** ao Storage
- Persistência só das **fotos da session** (2–6 JPEGs) em `frame_paths`
- Limites no aparelho: **500 MB** e **90 s**
- Miniaturas na tela do resultado
- Reanálise de itens **novos** a partir das fotos guardadas
- Mensagem clara para análises **antigas** (só vídeo no Storage, sem frames)

Não entrega: player do original, compressão no cliente, migração de MP4s legados, duração diferente por plano comercial.

---

## Fluxo principal (vídeo)

1. Surfista escolhe MP4/MOV/WebM no aparelho (≤ 500 MB)
2. App lê duração (≤ 90 s) e extrai 2–6 fotos
3. Server cria `media_item`, grava JPEGs em `{userId}/{mediaId}/frames/`, preenche `frame_paths`
4. IA analisa as fotos; tela mostra miniaturas
5. Reanálise relê `frame_paths` (1 crédito se sucesso)

Foto de sessão e link: comportamento anterior.

---

## Arquivos-chave

| Área | Caminhos |
| --- | --- |
| Migration | `supabase/migrations/013_media_frame_paths.sql` |
| Limites / paths | `lib/media/upload-limits.ts`, `lib/media/storage-path.ts` |
| Services | `services/media-service.ts`, `services/analysis-service.ts` |
| UI | `components/performance-analysis/*` |
| Testes | `lib/__tests__/media-video-frames.test.ts` |

---

## Contas de teste / homologação

| Cenário | Como validar |
| --- | --- |
| Vídeo > 50 MB | Arquivo ≤ 500 MB e ≤ 90 s → análise completa; bucket **sem** MP4 |
| Vídeo > 500 MB | Recusa na seleção com mensagem de tamanho |
| Vídeo > 90 s | Recusa na leitura/extração com mensagem de duração |
| Reanálise nova | Confirmar reanálise → novo resultado + débito de crédito |
| Legado | Item antigo só com `storage_path` → mensagem de análise antiga |
| Foto / link | Sem regressão |
| Exclusão | Conta apagada remove JPEGs de `frame_paths` |

---

## Comandos

```bash
npm run test -- lib/__tests__/media-video-frames.test.ts
npm run db:push   # migration 013 — só após confirmação do owner
```

---

## Próximo passo

Homologação manual (POP-QA) + `db:push` 013 · ver [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
