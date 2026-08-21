# UX do fluxo de criação de conta (signup)

| Campo | Valor |
| --- | --- |
| **Status** | Fase A concluída (código) · homologação manual pendente |
| **Spec** | [`specs/2026-08-21-signup-ux-fluxo-conta.md`](../../specs/2026-08-21-signup-ux-fluxo-conta.md) |
| **Plano** | [`docs/plans/2026-08-21-signup-ux-fluxo-conta.md`](../plans/2026-08-21-signup-ux-fluxo-conta.md) · Trilha E (Fase B operacional) |
| **Data** | 2026-08-21 |

## Objetivo

Eliminar loop de reenvio no cadastro e orientar o surfista com banners e microcopy claros entre signup, confirmação de e-mail e login.

## Entregue (Fase A — app)

### Helpers

| Arquivo | Conteúdo |
| --- | --- |
| `lib/auth/signup-redirect.ts` | URLs pós-signup, callback de confirmação, sanitização de redirect, detecção de e-mail duplicado |

### Formulários e actions

| Arquivo | Mudança |
| --- | --- |
| `components/auth/signup-form.tsx` | Redirect pós-sucesso → login; microcopy preventivo; erro de e-mail duplicado com link |
| `components/auth/login-form.tsx` | Banners `check-email` / `confirmed`; e-mail pré-preenchido |
| `actions/auth-actions.ts` | `emailRedirectTo` no signUp; mensagem específica para e-mail já cadastrado |
| `app/auth/callback/route.ts` | Pós-confirmação → sign-out + redirect login `signup=confirmed` |

### Testes

| Arquivo | Cobertura |
| --- | --- |
| `lib/__tests__/auth-signup-redirect.test.ts` | 11 testes — URLs, sanitização, sign-out, erros duplicados |

## Evidências de Done

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm test` | OK — 117 testes (11 novos) |
| `npm run build` | OK |

## Pendências menores

- Homologação manual POP-QA: signup → banner login → confirmar e-mail → login → dashboard
- **Fase B (owner):** SMTP customizado, templates PT-BR, remetente `@dominio` — Trilha E

## Manual do dev

[`docs/manual-dev/07-fase-signup-ux-fluxo-conta.md`](../manual-dev/07-fase-signup-ux-fluxo-conta.md)
