# Fase · UX do fluxo de criação de conta

| Status | Spec / registro |
| --- | --- |
| Fase A implementada (código) · homologação manual pendente | [`docs/implementation/2026-08-21-signup-ux-fluxo-conta.md`](../implementation/2026-08-21-signup-ux-fluxo-conta.md) |

## O que esta fase entrega

- Redirect imediato do cadastro para login (sem alerta permanente na tela de signup)
- Banner **Conta criada** com e-mail, passos numerados e rodapé orientativo
- Campo e-mail pré-preenchido no login após cadastro
- Link de confirmação retorna ao login com banner **E-mail confirmado**
- Microcopy preventivo no formulário de cadastro
- Mensagem específica quando o e-mail já possui conta (com link para entrar)
- `emailRedirectTo` configurado no signUp via URL pública do app

## O que não entrega

- SMTP customizado, templates PT-BR ou remetente próprio (Fase B — owner, Trilha E)
- OAuth, magic link ou página intermediária “cadastro concluído”
- Unificação de layout de recuperação de senha
- Detecção automática em runtime de “confirmação de e-mail desligada” no painel Supabase

---

## Fluxos principais

### Cadastro → login (aguardando confirmação)

1. Surfista preenche `/signup` e envia o formulário
2. `signUpAction` cria conta com `emailRedirectTo` apontando para `/auth/callback?next=/login?signup=confirmed`
3. Cliente redireciona para `/login?signup=check-email&email={email}`
4. Login exibe banner informativo e pré-preenche o e-mail

### Confirmação de e-mail → login

1. Surfista clica no link do e-mail (Supabase)
2. `/auth/callback` troca o código por sessão, confirma o e-mail, faz **sign-out** e redireciona para `/login?signup=confirmed`
3. Login exibe banner de sucesso; surfista entra com senha → `/dashboard`

### Erros

| Cenário | Comportamento |
| --- | --- |
| E-mail já cadastrado (erro identificável) | Permanece em `/signup` — “Este e-mail já tem conta.” + link Entrar |
| Outros erros de cadastro | Permanece em `/signup` — mensagem genérica |
| Link inválido/expirado | `/login?error=auth_callback` — alerta destructive |

---

## Variante sem confirmação de e-mail (owner)

Se o owner **desativar** “Confirm email” no painel Supabase Auth:

- O fluxo de redirect pós-signup continua igual (login com banner de passos)
- Para homologação com essa variante, o banner esperado é **Conta criada. Faça login agora.** — sem passos de confirmação
- **Nesta entrega:** o app sempre exibe o banner com passos (confirmação ON). Ajuste de copy para variante sem confirmação fica documentado aqui para quando o owner confirmar o estado no painel

Checklist owner:

1. Supabase → Authentication → Providers → Email → toggle “Confirm email”
2. Se OFF: considerar ajuste futuro no banner `check-email` ou aceitar passos como inofensivos (login funciona imediatamente)

---

## Homologação manual

Cenário POP-QA sugerido:

- [ ] Criar conta nova em `/signup` — verificar redirect para login com banner e e-mail preenchido
- [ ] Abrir e-mail de confirmação — clicar no link
- [ ] Verificar login com banner “E-mail confirmado” (não ir direto ao dashboard)
- [ ] Entrar com senha → dashboard
- [ ] Tentar cadastrar e-mail existente — mensagem específica + link Entrar
- [ ] Link expirado/inválido — erro em login com orientação de recuperação

**Ambiente local:** `NEXT_PUBLIC_SITE_URL=http://localhost:3000` e redirect URL `http://localhost:3000/auth/callback` no Supabase.

**Produção (Fase B):** após Trilha E, repetir com domínio próprio e e-mail PT-BR.

---

## Arquivos principais

| Área | Path |
| --- | --- |
| Helpers | `lib/auth/signup-redirect.ts` |
| Signup UI | `components/auth/signup-form.tsx` |
| Login UI | `components/auth/login-form.tsx` |
| Server Action | `actions/auth-actions.ts` |
| Callback | `app/auth/callback/route.ts` |
| Testes | `lib/__tests__/auth-signup-redirect.test.ts` |

---

## Comandos úteis

```bash
npm run dev
npm run test -- lib/__tests__/auth-signup-redirect.test.ts
npm run typecheck && npm run lint && npm test
```

## Próximo passo

- Homologação manual (POP-QA) do fluxo completo
- Trilha E: domínio + SMTP + templates PT-BR — [`docs/state/PLANO_GO_LIVE_COBRANCA.md`](../state/PLANO_GO_LIVE_COBRANCA.md)
