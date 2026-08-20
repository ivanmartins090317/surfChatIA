# Fase C · Legal / LGPD

| Status | Spec |
| --- | --- |
| concluída (código) · texto aprovado pelo owner | [`specs/2026-08-10-legal-lgpd.md`](../../specs/2026-08-10-legal-lgpd.md) |

Registro objetivo: [`docs/implementation/2026-08-10-legal-lgpd.md`](../implementation/2026-08-10-legal-lgpd.md)

## O que esta fase entrega

- Páginas públicas: `/termos`, `/privacidade`, `/reembolso`
- Rodapé completo (`SiteFooter`) na landing e área logada
- Aceite explícito de Termos + Privacidade no signup
- Aviso de cookies essenciais (dispensável)
- Exportação de dados e exclusão de conta no perfil
- Placeholders do controlador editáveis em `components/legal/controller-placeholder`

Não entrega: revisão por advogado externo, política amarrada a gateway específico.

---

## Fluxos principais

### Visitante

1. Abre `/termos` ou `/privacidade` **sem login** (middleware: `isLegalPublicPath`)

### Cadastro

1. `/signup` → checkbox aceite obrigatório
2. Sem aceite → erro; com aceite → conta criada

### Titular logado

1. `/profile` → exportar dados (JSON legível)
2. Exclusão → confirmação explícita → logout + dados removidos

---

## Arquivos-chave

| Área | Caminhos |
| --- | --- |
| Páginas | `app/termos/`, `app/privacidade/`, `app/reembolso/` |
| Componentes | `components/legal/site-footer.tsx`, `*-document.tsx` |
| Serviço | `services/account-privacy-service.ts` |
| Middleware | `components/legal/public-paths.ts` |
| Testes | `lib/__tests__/account-privacy.test.ts` |

---

## Homologação manual

- [ ] Três páginas legais abrem sem login
- [ ] Footer na landing (`/`) e no app autenticado
- [ ] Signup sem checkbox → bloqueado
- [ ] Export gera pacote com dados do usuário
- [ ] Exclusão pede confirmação e encerra sessão

---

## Comandos

```bash
npm run test -- lib/__tests__/account-privacy.test.ts
```

---

## Próximo passo

Pagamentos (AbacatePay): Trilha D/H em [`docs/state/PLANO_GO_LIVE_COBRANCA.md`](../state/PLANO_GO_LIVE_COBRANCA.md)
