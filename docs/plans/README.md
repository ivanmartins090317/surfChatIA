# Planos (pré-implementação)

Planos aprovados ou em revisão **antes** de virar Spec (`specs/`) ou código.

| Documento | Status | Conteúdo |
|-----------|--------|----------|
| [2026-08-21-signup-ux-fluxo-conta.md](./2026-08-21-signup-ux-fluxo-conta.md) | Planejado | UX signup → login, confirmação de e-mail, Resend/SMTP |
| [2026-09-02-analise-video-frames-sem-armazenar-original.md](./2026-09-02-analise-video-frames-sem-armazenar-original.md) | Aprovado | Análise de vídeo só com frames; MP4 não sobe para o Storage |
| [2026-09-10-match-integrado-pranchas.md](./2026-09-10-match-integrado-pranchas.md) | Em revisão | Match dentro de Pranchas; gate UX exige mágica `ready` |
| [2026-09-12-ativacao-e-homologacao-mercadopago.md](./2026-09-12-ativacao-e-homologacao-mercadopago.md) | Em aprovação | Ativação operacional, webhook, sandbox e go-live Mercado Pago |

**Workflow:** plano em `docs/plans/` → aprovação owner → Spec em `specs/` → implementação → fechamento em `docs/implementation/` + `docs/manual-dev/` + `docs/state/PENDENCIAS.md`.
