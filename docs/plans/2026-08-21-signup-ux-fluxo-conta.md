# Plano — UX do fluxo de criação de conta (signup)

| Campo | Valor |
|-------|--------|
| **Status** | `planejado` — aguardando aprovação antes de implementar |
| **Autonomia** | `tight` (auth, `lib/supabase/**`, `middleware.ts`) |
| **Data** | 2026-08-21 |
| **Owner** | Ivan Martins (ModernXLab) |
| **Origem** | Testes com usuários reais + research de auth (conversa 21/08/2026) |
| **Refs** | [PRD §4.1](../PRD.md) · [SECURITY.md §A07](../SECURITY.md) · [DEPLOY_VERCEL.md](../DEPLOY_VERCEL.md) · [PLANO_GO_LIVE — Trilha E](../state/PLANO_GO_LIVE_COBRANCA.md) |

---

## Objetivo

Eliminar confusão no cadastro (`/signup`) identificada em testes com usuários: loop de reenvio do formulário e instruções pouco claras sobre confirmação de e-mail — **sem alterar a stack de auth** (continua Supabase Auth + Server Actions).

---

## Problemas observados (testes com usuários)

### Problema 1 — Fica na mesma tela e tenta cadastrar de novo

**Comportamento atual**

- Após sucesso, `SignUpForm` exibe alert verde na mesma página
- Formulário e botão **"Criar conta"** permanecem ativos
- Usuário interpreta que não funcionou e reenvia o cadastro
- Segunda tentativa pode gerar erro genérico do Supabase → mais frustração

**Causa no código**

- `components/auth/signup-form.tsx` — `setSuccess(...)` sem redirect nem desabilitar o form

### Problema 2 — Mensagem de validação de e-mail confusa

**Comportamento atual**

- Copy: *"Conta criada! Verifique seu e-mail (se confirmado no Supabase) e faça login."*
- Jargão técnico (`Supabase`) exposto ao usuário final
- Não indica **onde** olhar, **o que** clicar, **quando** fazer login
- E-mail padrão do Supabase chega em **inglês**, remetente genérico (`noreply@mail.app.supabase.io`)

**Contexto infra (em andamento pelo owner)**

- Domínio adquirido: **modernxlab.com.br**
- App previsto: **surf.modernxlab.com.br** (Vercel)
- SMTP: **Resend** integrado ao Supabase (Trilha E go-live)

---

## Solução proposta — visão geral

Dividir em **duas fases** independentes:

| Fase | Escopo | Quem | Bloqueia signup UX? |
|------|--------|------|---------------------|
| **A — App (código)** | Redirect signup → login + banners + copy + `emailRedirectTo` | Dev | Não |
| **B — Infra (painéis)** | Domínio Vercel, Resend verified, SMTP Supabase, templates PT-BR | Owner | Melhora P2; Fase A já ajuda |

```mermaid
flowchart TD
  A[/signup — preenche form] --> B[signUpAction]
  B -->|erro| C[Alert vermelho em /signup]
  B -->|sucesso| D["/login?signup=check-email&email=..."]
  D --> E[Banner: confirme o e-mail]
  E --> F[Usuário abre e-mail e clica no link]
  F --> G["/auth/callback → /login?signup=confirmed"]
  G --> H[Banner verde: e-mail confirmado]
  H --> I[Login → /dashboard]
```

---

## Fase A — Melhorias no app (código)

### A.1 Redirect pós-signup para login

**Comportamento desejado**

1. `signUpAction` retorna sucesso com `{ email }` (já retorna)
2. `SignUpForm` em sucesso → `router.push` para:

   ```text
   /login?signup=check-email&email={encodeURIComponent(email)}
   ```

3. Remover estado `success` inline do signup (sem alert permanente na mesma tela)

**Alternativa descartada:** página intermediária `/signup/success` — adiciona rota e passo extra; redirect para login resolve P1 e P2 com menos superfície.

### A.2 Banner na tela de login (`LoginForm`)

Estender o padrão existente (`?reset=success`, `?error=auth_callback`).

| Query param | Variante | Copy (banner success/info) |
|-------------|----------|----------------------------|
| `signup=check-email` | info/success | Ver seção [Copy — banner login](#copy--banner-login) |
| `signup=confirmed` | success | **E-mail confirmado.** Faça login com a senha que você criou. |

**Detalhes UX**

- Exibir e-mail completo (param `email`) — usuário sabe qual caixa abrir
- **Pré-preencher** campo e-mail no form de login
- Ícone envelope / check conforme Design System (`Alert variant="success"`)
- Rodapé do banner: *"Não recebeu? Verifique spam. Já confirmou? Use o formulário abaixo."*

### A.3 Microcopy preventivo no signup (antes do submit)

Adicionar texto abaixo do botão ou acima do checkbox legal:

> Após criar a conta, enviaremos um **e-mail de confirmação**. Você será direcionado para a tela de login.

### A.4 `emailRedirectTo` no `signUp`

Em `actions/auth-actions.ts`, ao chamar `supabase.auth.signUp`:

```typescript
options: {
  data: { display_name: ... },
  emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/login?signup=confirmed`,
}
```

Garante que o link do e-mail leve ao login com banner de confirmação, após `exchangeCodeForSession` em `app/auth/callback/route.ts`.

**Validar:** `resolveRedirectPath` em `auth/callback/route.ts` aceita `next` com query string aninhada ou ajustar para path fixo + param dedicado se necessário na implementação.

### A.5 Erro “e-mail já cadastrado” (opcional — fase A.2)

Se Supabase retornar erro identificável de usuário existente:

- Mensagem: *"Este e-mail já tem conta. [Entrar](/login)"*
- Evita loop na segunda tentativa

Manter mensagem genérica para outros erros (§A07 SECURITY).

### A.6 Arquivos prováveis (implementação)

| Arquivo | Alteração |
|---------|-----------|
| `components/auth/signup-form.tsx` | Redirect; remover success inline; microcopy |
| `components/auth/login-form.tsx` | Banners `check-email` / `confirmed`; pré-fill email |
| `actions/auth-actions.ts` | `emailRedirectTo`; opcional mapeamento erro duplicado |
| `app/auth/callback/route.ts` | Revisar `resolveRedirectPath` se `next` com query falhar |
| `lib/__tests__/auth-signup-redirect.test.ts` | Novo — helpers de URL/query (se extrair funções puras) |

**Fora de escopo Fase A**

- OAuth / magic link
- Persistência de aceite legal no banco (LGPD audit trail — feature separada)
- Página `/signup/success` dedicada
- Unificar layout de forgot/reset com `AuthLayout` (melhoria paralela, não bloqueante)

---

## Fase B — Infra e e-mail (owner / painéis)

Complementa a Fase A. Reduz spam/confusão no e-mail recebido.

### B.1 Domínio e Vercel

| Item | Valor |
|------|--------|
| Domínio raiz | `modernxlab.com.br` |
| App Surf AI Coach | `surf.modernxlab.com.br` |
| Env Vercel | `NEXT_PUBLIC_SITE_URL=https://surf.modernxlab.com.br` |
| Redeploy | Obrigatório após alterar env |

Checklist: [DEPLOY_VERCEL.md § Domínio customizado](../DEPLOY_VERCEL.md)

### B.2 Resend

1. Verificar domínio `modernxlab.com.br` ou `surf.modernxlab.com.br` (DNS no Registro.br)
2. API key dedicada: `supabase-surf-auth` (Sending access, domínio restrito)
3. Múltiplas keys permitidas — uma por integração/SaaS

### B.3 Supabase — SMTP

**Authentication → Emails → SMTP Settings**

| Campo | Valor |
|-------|--------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | API key Resend (`re_...`) |
| Sender email | `noreply@surf.modernxlab.com.br` |
| Sender name | `Surf AI Coach` |

### B.4 Supabase — URL Configuration

| Campo | Valor |
|-------|--------|
| Site URL | `https://surf.modernxlab.com.br` |
| Redirect URLs | `https://surf.modernxlab.com.br/auth/callback` |
| | `http://localhost:3000/auth/callback` |

### B.5 Templates de e-mail Supabase (PT-BR)

**Confirm signup — Subject**

```text
Confirme seu e-mail — Surf AI Coach
```

**Confirm signup — Body (HTML)**

```html
<h2>Confirme seu e-mail</h2>
<p>Olá! Você criou uma conta no <strong>Surf AI Coach</strong>.</p>
<p>Clique no botão abaixo para confirmar seu e-mail e depois faça login no app.</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar e-mail</a></p>
<p>Se você não criou esta conta, ignore este e-mail.</p>
<p>Não recebeu? Verifique a pasta de spam ou lixo eletrônico.</p>
<p>— ModernXLab</p>
```

**Reset password — Subject**

```text
Redefinir senha — Surf AI Coach
```

**Reset password — Body (HTML)**

```html
<h2>Redefinir senha</h2>
<p>Recebemos um pedido para redefinir a senha da sua conta no Surf AI Coach.</p>
<p><a href="{{ .ConfirmationURL }}">Criar nova senha</a></p>
<p>Se não foi você, ignore este e-mail.</p>
<p>— ModernXLab</p>
```

### B.6 Auth — Confirm email

**Authentication → Providers → Email**

- Enable Email provider: **ON**
- Confirm email: **ON** (cadastro exige confirmação antes do login)

Se **Confirm email** estiver OFF, ajustar banner Fase A para variante `signup=success` (*"Conta criada. Faça login agora."*) sem instrução de confirmação.

---

## Copy — banner login

### `signup=check-email`

**Título:** Conta criada

**Corpo:**

> Enviamos um link de confirmação para **{email}**.
>
> 1. Abra sua caixa de entrada (e a pasta de **spam** ou **lixo eletrônico**).
> 2. Clique em **Confirmar e-mail** no e-mail do Surf AI Coach.
> 3. Volte aqui e faça login com a senha que você criou.

**Rodapé (texto menor):**

> Não recebeu? Aguarde alguns minutos ou confira se digitou o e-mail certo.

### `signup=confirmed`

**Corpo:**

> **E-mail confirmado.** Faça login com a senha que você criou.

---

## Caminho feliz (critérios de aceite)

### Fase A (app)

- [ ] Usuário preenche `/signup` → clica **Criar conta** → é levado a `/login` (não permanece no signup)
- [ ] Login exibe banner com e-mail e passos numerados (`signup=check-email`)
- [ ] Campo e-mail pré-preenchido no login
- [ ] Após clicar link no e-mail → callback → login com `signup=confirmed`
- [ ] Login bem-sucedido → `/dashboard`
- [ ] Erro no signup permanece em `/signup` com mensagem clara
- [ ] `npm run typecheck` · `npm run lint` · `npm test` verdes

### Fase B (infra)

- [ ] E-mail de confirmação remetente `Surf AI Coach <noreply@surf.modernxlab.com.br>`
- [ ] Assunto e corpo em PT-BR
- [ ] Link do e-mail abre `surf.modernxlab.com.br/auth/callback...` sem erro
- [ ] Reset de senha funciona com mesmo SMTP

### Homologação manual (POP-QA)

Atualizar ou estender TC de signup (FL-01):

1. Criar conta nova → redirect login → banner visível
2. Confirmar e-mail → login → dashboard
3. Tentar recriar mesma conta → mensagem útil (não loop confuso)

---

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| `next` com query aninhada quebra callback | Testar E2E; ajustar `resolveRedirectPath` ou usar path dedicado |
| Confirm email OFF vs copy de confirmação | Detectar via doc/checklist owner; variante de banner sem passo 2 |
| E-mail cai no spam | SPF/DKIM Resend + copy menciona spam; Fase B |
| Autonomia tight em auth paths | Spec aprovada + review humano antes do merge |
| Aceite legal não persistido | Fora deste plano; registrar backlog LGPD se necessário |

---

## Dependências

| Dependência | Status (21/08/2026) |
|-------------|---------------------|
| Domínio modernxlab.com.br | ✅ Comprado |
| Vercel `surf.modernxlab.com.br` | ⏳ Owner |
| Resend domínio verified | ⏳ Owner |
| Supabase SMTP Resend | ⏳ Owner |
| Aprovação deste plano / Spec | ⏳ Pendente |
| Implementação Fase A | ⏳ Após aprovação |

---

## Ordem de execução recomendada

```text
1. Owner: Vercel domínio + NEXT_PUBLIC_SITE_URL + redeploy
2. Owner: Resend DNS + Supabase SMTP + templates PT-BR + URLs Auth
3. Dev: Spec aprovada → Fase A (código)
4. Homologação: signup → e-mail → confirm → login → dashboard
5. Fechar docs vivos (implementation + manual-dev + PENDENCIAS) após Done
```

**Fase A pode começar antes da Fase B concluída** — redirect e banners já reduzem P1; P2 melhora quando SMTP custom estiver ativo.

---

## Próximo passo

1. **Owner aprova** este plano (ou solicita ajustes)
2. Promover para **`specs/2026-08-21-signup-ux-fluxo-conta.md`** (contrato de implementação) se desejado
3. Implementar Fase A após aprovação explícita

---

## Referências técnicas atuais

| Artefato | Caminho |
|----------|---------|
| Action signup | `actions/auth-actions.ts` |
| Form signup | `components/auth/signup-form.tsx` |
| Form login | `components/auth/login-form.tsx` |
| Callback OAuth/PKCE | `app/auth/callback/route.ts` |
| Middleware auth | `lib/supabase/middleware.ts` |
| Site URL helper | `lib/site-url.ts` |
| Trigger profile + cota free | `supabase/migrations/008_credits_usage.sql` |
