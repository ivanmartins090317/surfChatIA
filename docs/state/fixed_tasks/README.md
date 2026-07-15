# Bugs corrigidos

Registro de bugs de produção (ou achados em revisão) já corrigidos e validados. Cada arquivo documenta: sintoma, causa raiz, correção aplicada e validação — para consulta rápida caso o problema volte a aparecer.

| Data | Documento | Resumo |
|------|-----------|--------|
| 2026-07-14 | [2026-07-14-csp-bloqueia-extracao-video-navegador.md](./2026-07-14-csp-bloqueia-extracao-video-navegador.md) | CSP sem `media-src` bloqueava extração de frames de vídeo no navegador (blob:) em produção na Vercel |

## Convenção

- Nome do arquivo: `AAAA-MM-DD-slug-curto-do-bug.md`
- Seções fixas: **Sintoma** → **Causa raiz** → **Correção** → **Validação** → **Commit**
