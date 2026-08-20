# Trilha C · Legal / LGPD

| Campo | Valor |
| --- | --- |
| **Status** | concluída (código) |
| **Spec** | [`specs/2026-08-10-legal-lgpd.md`](../../specs/2026-08-10-legal-lgpd.md) |
| **Plano** | [`docs/state/PLANO_GO_LIVE_COBRANCA.md`](../state/PLANO_GO_LIVE_COBRANCA.md) Trilha C |
| **Data** | 2026-08-10 |

## Objetivo

Publicar Termos, Privacidade e Reembolso; aceite no signup; cookies essenciais; exportação e exclusão de conta (LGPD).

## Entregue

### Páginas e componentes

| Área | Arquivos |
| --- | --- |
| Rotas públicas | `app/termos/`, `app/privacidade/`, `app/reembolso/` |
| Legal UI | `components/legal/site-footer.tsx`, `*-document.tsx`, `cookie-notice.tsx` |
| Signup | aceite obrigatório em `app/signup/` |
| Perfil | export + exclusão de conta |

### Service

| Arquivo | Conteúdo |
| --- | --- |
| `services/account-privacy-service.ts` | Export JSON + delete account |
| `components/legal/public-paths.ts` | Rotas legais no middleware |

### Testes

- `lib/__tests__/account-privacy.test.ts`

## Evidências de Done

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm test` | OK (incl. account-privacy) |

## Pendências menores

- Preencher placeholders definitivos do controlador (`controller-placeholder`)
- Revisar política de reembolso quando AbacatePay (Trilha H) estiver ativo

## Manual do dev

[`docs/manual-dev/05-fase-legal-lgpd.md`](../manual-dev/05-fase-legal-lgpd.md)
