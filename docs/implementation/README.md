# Registro de implementação

Histórico do que foi construído no projeto, organizado por data e alinhado ao [Plano de Execução](../PLANO_EXECUCAO.md).

| Data | Documento | Resumo |
|------|-----------|--------|
| 2026-07-03 | [2026-07-03-fundacao-mvp-inicial.md](./2026-07-03-fundacao-mvp-inicial.md) | Setup do projeto, scaffold Next.js + Supabase, migrations, módulos MVP (auth, perfil, análise, prancha mágica, compatibilidade) |
| 2026-07-17 | [2026-07-17-plano-especializacao-ia-performance.md](./2026-07-17-plano-especializacao-ia-performance.md) | Plano (ainda não implementado) para reduzir erros de nomenclatura de manobra e generalização nos pontos de melhoria: prompt + taxonomia de manobras, extração de frames, eval set, captura de correções humanas, RAG e fine-tuning opcional |
| 2026-07-27 | [2026-07-27-fix-extracao-frames-video-mobile.md](./2026-07-27-fix-extracao-frames-video-mobile.md) | Bug — extração de frames de vídeo (aba Arquivo) falhava em iOS/Android com timeout de seek ou erro de upload; extrator client-side tornado resiliente (DOM attach, timeouts maiores, retry, sucesso parcial) e fluxo reordenado para extrair frames antes do upload |

## Convenção dos checklists

- `[x]` — implementado no código (arquivo/migration/service/UI existente)
- `[ ]` — pendente: validação manual, deploy, teste E2E ou configuração de ambiente
