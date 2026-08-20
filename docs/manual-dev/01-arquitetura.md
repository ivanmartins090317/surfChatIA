# Arquitetura · Surf AI Coach

| Status | Refs |
| --- | --- |
| referência viva | [ADR-001](../architecture/ADR-001-monolito-modular-nextjs.md) · [mapa de módulos](../architecture/2026-08-06-mapa-contexto-modulos.md) |

## Camadas (obrigatório)

```text
UI (RSC/Client) → Server Action / Route Handler → Service → Supabase
```

- **IA:** sempre via `lib/ai/` (prompts, parsers, client)
- **Domínio:** tipos e regras em `lib/domain/`
- **Segurança:** rate limit, SSRF, validação Zod em `lib/security/` e services

## Módulos principais

| Módulo | Caminhos |
| --- | --- |
| Auth / perfil | `actions/auth-actions.ts`, `services/profile-service.ts`, `lib/supabase/` |
| Mídia | `services/media-service.ts`, `lib/media/` |
| Análise performance | `actions/analysis-actions.ts`, `services/analysis-service.ts`, `lib/ai/performance-*` |
| Prancha mágica | `services/board-service.ts`, `lib/ai/board-*` |
| Compatibilidade | `services/board-match-service.ts` |
| Créditos | `services/usage-service.ts`, migration `008_credits_usage.sql` |
| Legal / privacidade | `components/legal/`, `services/account-privacy-service.ts` |
| UI | `app/`, `components/` |

## Integrações externas

| Sistema | Papel |
| --- | --- |
| Supabase Auth + Postgres + Storage | identidade, dados, mídia (RLS) |
| OpenAI | visão + texto (`lib/ai/client.ts`) |
| Sentry | erros em produção |
| Browser (ffmpeg/canvas) | extração de frames de vídeo no client |

## Docs vivos (workflow)

| Pasta | Pergunta |
| --- | --- |
| `docs/implementation/` | O que foi entregue? |
| `docs/manual-dev/` | Como funciona e homologar? |
| `docs/state/PENDENCIAS.md` | O que ainda falta? |

Fechamento: `.cursor/skills/close-phase/SKILL.md`
