# Arquitetura — Surf AI Coach (estudo)

**Branch:** `study/arquitetura-software`  
**Início:** 2026-08-06  
**Plano no vault:** `30 Estudos/Wiki/2026-08-06-plano-acelerado-arquitetura-software.md`

## Regra desta branch

- Experimentar limites de módulo, ADRs e refactors arquiteturais.
- Não misturar hotfix de produção aqui (isso vai em `main` / branch de feature).
- Merge pra `main` só quando a mudança for proporcional e estável.

## Documentos

| Arquivo | Conteúdo |
| --- | --- |
| `2026-08-06-mapa-contexto-modulos.md` | Diagrama de contexto + módulos atuais |
| `ADR-001-monolito-modular-nextjs.md` | Decisão: monólito modular Next.js |

## Fluxo atual (as-is)

```text
UI (RSC/Client) → Server Action → Service → Supabase / lib/ai / storage
```

## Próximo experimento (dias 7–10)

Feature candidata: **análise de performance** (`createPerformanceAnalysis`).

Motivo: cruza auth, media, IA, rate limit e persistência. É o melhor lugar pra praticar ports/adapters sem reescrever o app.
