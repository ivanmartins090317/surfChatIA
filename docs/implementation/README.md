# Registro de implementação

Histórico do que foi construído no projeto, organizado por data e alinhado ao [Plano de Execução](../PLANO_EXECUCAO.md) e [Plano Go-Live](../state/PLANO_GO_LIVE_COBRANCA.md).

**Convenção de nome:** `YYYY-MM-DD-slug.md` · ao fechar fase, usar skill `.cursor/skills/close-phase/SKILL.md`.

| Data | Documento | Resumo |
|------|-----------|--------|
| 2026-07-03 | [2026-07-03-fundacao-mvp-inicial.md](./2026-07-03-fundacao-mvp-inicial.md) | Setup Next.js + Supabase, migrations, módulos MVP |
| 2026-07-17 | [2026-07-17-plano-especializacao-ia-performance.md](./2026-07-17-plano-especializacao-ia-performance.md) | Plano IA performance (Fase A parcialmente implementada) |
| 2026-07-27 | [fixed_tasks/2026-07-27-…](../state/fixed_tasks/2026-07-27-fix-extracao-frames-video-mobile.md) | Fix frames vídeo mobile |
| 2026-08-10 | [2026-08-10-creditos-paywall.md](./2026-08-10-creditos-paywall.md) | Trilha A: créditos, ledger, paywall, planos exemplo |
| 2026-08-10 | [2026-08-10-legal-lgpd.md](./2026-08-10-legal-lgpd.md) | Trilha C: Termos, Privacidade, aceite, export/exclusão |
| 2026-08-10 | [2026-08-10-custo-ia-operacao.md](./2026-08-10-custo-ia-operacao.md) | Trilha G: instrumentação `ai.usage`, baseline, margem |
| 2026-08-20 | [2026-08-20-billing-abacatepay.md](./2026-08-20-billing-abacatepay.md) | Trilhas D+H: AbacatePay checkout, webhooks, billing UI |
| 2026-08-21 | [2026-08-21-signup-ux-fluxo-conta.md](./2026-08-21-signup-ux-fluxo-conta.md) | UX signup: redirect login, banners confirmação, callback |
| 2026-09-02 | [2026-09-02-billing-mercadopago.md](./2026-09-02-billing-mercadopago.md) | Trilhas D+H: Mercado Pago substitui AbacatePay |
| 2026-09-02 | [2026-09-02-analise-video-frames-sem-armazenar-original.md](./2026-09-02-analise-video-frames-sem-armazenar-original.md) | Vídeo: só frames no Storage; teto 500 MB / 90 s |
| 2026-09-10 | [2026-09-10-match-depende-prancha-magica.md](./2026-09-10-match-depende-prancha-magica.md) | Match integrado a Pranchas; gate UX exige mágica `ready` |

## Convenção dos checklists

- `[x]` — implementado no código (arquivo/migration/service/UI existente)
- `[ ]` — pendente: validação manual, deploy, teste E2E ou configuração de ambiente

## Manual do dev

Capítulos explicativos e homologação: [`docs/manual-dev/README.md`](../manual-dev/README.md)
