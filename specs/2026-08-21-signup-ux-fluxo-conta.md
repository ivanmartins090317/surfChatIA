# Spec: UX do fluxo de criação de conta (signup)

| Campo | Valor |
|-------|--------|
| **Status** | `draft` |
| **Autonomia** | `tight` (auth, `lib/supabase/**`, retorno de confirmação de e-mail) |
| **Data** | 2026-08-21 |
| **Owner** | Ivan Martins (ModernXLab) |
| **Refs** | [Plano aprovado](../docs/plans/2026-08-21-signup-ux-fluxo-conta.md) · [PRD §4.1](../docs/PRD.md) · [SECURITY.md §A07](../docs/SECURITY.md) · [PLANO_GO_LIVE — Trilha E](../docs/state/PLANO_GO_LIVE_COBRANCA.md) |

---

## Problema

Testes com usuários reais mostraram duas fricções no cadastro:

1. **Loop de reenvio:** após criar a conta com sucesso, o surfista permanece na mesma tela de cadastro, com formulário e botão ainda ativos. Interpreta que não funcionou e tenta cadastrar de novo — gerando erro genérico e mais frustração.
2. **Instruções confusas:** a mensagem atual mistura jargão técnico, não diz onde olhar no e-mail, o que clicar nem quando fazer login. O e-mail padrão chega em inglês, com remetente genérico, reforçando a dúvida.

A stack de autenticação **não muda**; o objetivo é orientar melhor o surfista no app e alinhar o retorno do link de confirmação.

## Objetivo

Depois de criar a conta, o surfista deve ser **levado imediatamente à tela de login** com instruções claras e passo a passo sobre confirmação de e-mail. Ao confirmar pelo link recebido, deve voltar ao login com feedback positivo e conseguir entrar no app sem ambiguidade.

**Fase A (app):** redirect, banners, microcopy e destino correto do link de confirmação — pode ser entregue antes da infra de e-mail customizada.

**Fase B (operacional — owner):** domínio, remetente próprio, SMTP e templates em português — complementa a experiência no e-mail recebido, mas não bloqueia a Fase A.

## Fora de escopo

- OAuth, magic link ou outros provedores de login
- Página intermediária dedicada só para “cadastro concluído”
- Persistência de aceite legal no banco (trilha LGPD separada)
- Unificar layout de recuperação de senha com o layout padrão de auth
- Alteração da política de confirmação de e-mail no painel do provedor (owner decide; app adapta copy se confirmação estiver desligada)
- Nova dependência npm
- Mudanças em billing, créditos, análise IA ou dashboard além do fluxo pós-login já existente

---

## Regras de domínio

### Cadastro bem-sucedido

- Ao concluir o cadastro com sucesso, o surfista **não permanece** na tela de cadastro.
- O app redireciona para a **tela de login** em modo “aguardando confirmação de e-mail”, informando o endereço usado no cadastro.
- O formulário de cadastro **não** exibe alerta de sucesso permanente na mesma tela.

### Orientação na tela de login (aguardando confirmação)

- Banner informativo com título **Conta criada**.
- Corpo com o e-mail completo e passos numerados:
  1. Abrir a caixa de entrada (e pasta de **spam** ou **lixo eletrônico**).
  2. Clicar em **Confirmar e-mail** no e-mail do Surf AI Coach.
  3. Voltar à tela de login e entrar com a senha criada no cadastro.
- Rodapé menor: *“Não recebeu? Aguarde alguns minutos ou confira se digitou o e-mail certo.”*
- Campo de e-mail no login **pré-preenchido** com o endereço informado no cadastro.
- Ícone e variante visual seguem o Design System (alerta de sucesso/informativo).

### Orientação na tela de login (e-mail confirmado)

- Após o surfista clicar no link de confirmação do e-mail e o app validar o retorno, a tela de login exibe banner de sucesso:
  - **E-mail confirmado.** Faça login com a senha que você criou.

### Microcopy preventivo no cadastro

- Antes de enviar o formulário, o surfista vê:
  - *“Após criar a conta, enviaremos um **e-mail de confirmação**. Você será direcionado para a tela de login.”*

### Link de confirmação no e-mail

- O link enviado ao surfista, após confirmação, deve levá-lo de volta ao app e, em seguida, à **tela de login** no estado “e-mail confirmado” — não à área logada diretamente.
- O destino usa a URL pública configurada do app (produção ou desenvolvimento local).

### Erros no cadastro

- Falhas permanecem na **tela de cadastro** com mensagem clara (causa + o que fazer).
- Se o e-mail **já possui conta**, mensagem específica com convite para **entrar** — evita loop de reenvio.
- Demais erros mantêm mensagem genérica (não revelar se e-mail existe — §A07 SECURITY).
- Limite de tentativas: mensagem de aguardar alguns minutos (comportamento já existente).

### Erros no retorno do link de confirmação

- Link inválido ou expirado: tela de login com alerta de erro e orientação para solicitar novo link (padrão já usado em recuperação de senha).

### Confirmação de e-mail desligada (variante)

- Se o owner desativar “confirmar e-mail” no painel do provedor, o banner pós-cadastro usa variante **Conta criada. Faça login agora.** — sem passos de confirmação.
- Implementação documenta como detectar/configurar essa variante (checklist owner; não inferir automaticamente em runtime nesta entrega, salvo decisão explícita na implementação).

### Segurança

- Zero confiança no cliente para estado de autenticação.
- Parâmetros de URL na tela de login são apenas **contexto de UX** (e-mail, tipo de banner) — não substituem validação server-side no login.
- Mensagens ao surfista não expõem nomes de infraestrutura (provedor de auth, SMTP, etc.).
- Rate limit e validação de entrada permanecem como hoje.

---

## Caminho feliz

### Fase A — App

1. Surfista acessa a **tela de cadastro**, preenche nome, e-mail, senha e aceita termos legais.
2. Lê o microcopy preventivo sobre e-mail de confirmação e redirect para login.
3. Clica **Criar conta** → cadastro processado com sucesso.
4. É **redirecionado** para a **tela de login** (não fica na tela de cadastro).
5. Vê banner **Conta criada** com e-mail e três passos numerados; campo e-mail já preenchido.
6. Abre o e-mail, clica em **Confirmar e-mail**.
7. App processa o retorno e abre a **tela de login** com banner **E-mail confirmado**.
8. Informa e-mail e senha → entra no app → **área principal** (dashboard).

### Fase B — Infra e e-mail (owner, complementar)

1. Owner configura domínio do app (`surf.modernxlab.com.br`), URL pública e redeploy.
2. Owner verifica domínio no Resend, configura SMTP no Supabase e templates PT-BR.
3. Surfista recebe e-mail com remetente **Surf AI Coach**, assunto e corpo em português.
4. Link do e-mail abre o app em produção sem erro de retorno.
5. Fluxo de redefinição de senha continua funcionando com o mesmo SMTP.

---

## Erros e bordas

| Situação | Comportamento esperado |
|----------|------------------------|
| Cadastro com e-mail/senha inválidos | Permanece na tela de cadastro; mensagem pedindo e-mail válido e senha ≥ 8 caracteres |
| Termos legais não aceitos | Permanece na tela de cadastro; mensagem pedindo aceite dos Termos e Política |
| Muitas tentativas de cadastro/login | Mensagem para aguardar alguns minutos |
| E-mail já cadastrado (erro identificável do provedor) | Permanece na tela de cadastro; *“Este e-mail já tem conta.”* + link para entrar |
| Outro erro no cadastro | Mensagem genérica; sugere verificar e-mail ou tentar outro |
| Surfista tenta cadastrar de novo após sucesso | Não ocorre na prática — já foi redirecionado ao login |
| Link de confirmação inválido/expirado | Tela de login com erro; orientar a solicitar novo link |
| Retorno do link com destino malformado | App saneia para destino seguro (login ou recuperação); nunca redirecionar para URL externa |
| E-mail não chega (spam, atraso) | Banner já orienta spam; rodapé sugere aguardar e conferir e-mail digitado |
| Confirmação de e-mail desligada no painel | Banner pós-cadastro sem passo de confirmação; login imediato possível após cadastro |
| Login antes de confirmar e-mail (confirmação ON) | Mensagem de credenciais incorretas ou equivalente genérica do provedor — sem expor “e-mail não confirmado” de forma que permita enumeração |
| Acesso direto à tela de login com parâmetros de contexto | Banners exibidos conforme parâmetros; formulário funciona normalmente |
| Ambiente local vs produção | Link de confirmação usa URL pública correta de cada ambiente |

---

## Critérios de Done

### Fase A (implementação dev)

- [ ] Cadastro bem-sucedido redireciona para login — surfista não permanece na tela de cadastro
- [ ] Banner “Conta criada” com e-mail, passos numerados e rodapé conforme copy aprovada
- [ ] Campo e-mail pré-preenchido no login após cadastro
- [ ] Link de confirmação retorna à tela de login com banner “E-mail confirmado”
- [ ] Login após confirmação leva à área principal do app
- [ ] Erros de cadastro permanecem na tela de cadastro com mensagens claras
- [ ] E-mail já cadastrado exibe mensagem específica com link para entrar (quando erro for identificável)
- [ ] Microcopy preventivo visível na tela de cadastro antes do submit
- [ ] Nenhuma menção a infraestrutura técnica nas mensagens ao surfista
- [ ] Testes unitários cobrindo helpers de URL/contexto de redirect (se extraídos)
- [ ] Checklist aplicável de `docs/SECURITY.md` (§A07, rate limit, mensagens genéricas)
- [ ] Homologação manual POP-QA: criar conta → banner login → confirmar e-mail → login → dashboard
- [ ] `npm run typecheck` · `npm run lint` · `npm test` verdes
- [ ] Docs vivos: `docs/implementation/` + `docs/manual-dev/` + `docs/state/PENDENCIAS.md` (skill `close-phase`)

### Fase B (owner — homologação operacional)

- [ ] E-mail de confirmação remetente `Surf AI Coach <noreply@surf.modernxlab.com.br>`
- [ ] Assunto e corpo em PT-BR (cadastro e reset de senha)
- [ ] Link do e-mail abre app em produção sem erro de callback
- [ ] Reset de senha funciona com mesmo SMTP
- [ ] Scoreboard Trilha E atualizado em `docs/state/PLANO_GO_LIVE_COBRANCA.md`

---

## Escopo de arquivos permitido

| Área | Paths / globs |
|------|----------------|
| Spec | `specs/2026-08-21-signup-ux-fluxo-conta.md` |
| Formulários auth | `components/auth/signup-form.tsx`, `components/auth/login-form.tsx` |
| Actions auth | `actions/auth-actions.ts` *(crítico)* |
| Retorno de confirmação | `app/auth/callback/route.ts` *(crítico)* |
| URL pública | `lib/site-url.ts` *(somente se necessário para destino do link)* |
| Helpers puros (opcional) | `lib/auth/**` *(novo, se extrair construção de URLs/contexto)* |
| Testes | `lib/__tests__/auth-signup-redirect.test.ts` *(novo)*, testes existentes de auth se impactados |
| Docs vivos | `docs/implementation/**`, `docs/manual-dev/**`, `docs/state/PENDENCIAS.md`, `docs/state/PLANO_GO_LIVE_COBRANCA.md` *(Trilha E)* |

**Não alterar nesta feature (salvo aprovação explícita extra):** `lib/supabase/**` (client/middleware), `middleware.ts` raiz, `supabase/migrations/**`, billing, `lib/ai/**`, PRD, fluxos OAuth, persistência LGPD de aceite legal.

---

## Notas / decisões abertas

1. **Query aninhada no retorno:** destino do link de confirmação pode incluir parâmetros de contexto na URL de login — validar se o sanitizador de redirect aceita ou ajustar para path fixo + parâmetro dedicado.
2. **Detecção de e-mail duplicado:** depende da mensagem/código retornado pelo provedor; se não for identificável de forma confiável, manter mensagem genérica (item opcional A.5 do plano).
3. **Variante sem confirmação de e-mail:** documentar no manual-dev; banner alternativo definido acima — owner confirma estado no painel Supabase.
4. **Fase B em paralelo:** dev pode entregar Fase A antes do SMTP custom; homologação E2E completa depende da Trilha E.
5. **Persistência do e-mail no login:** preferir parâmetro na URL no redirect pós-cadastro; evitar armazenamento local desnecessário.

---

## Aprovação

- [ ] Spec aprovada para implementação (assinatura / data do responsável)
