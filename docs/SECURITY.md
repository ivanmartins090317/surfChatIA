# Padrões de Segurança — Surf Performance & Board AI

> **Versão:** 1.0 · **Base:** OWASP Top 10 (2021) + OWASP Top 10 for LLM Applications · **Stack:** Next.js (App Router) · Supabase (Auth, Postgres, Storage, RLS) · camada de IA.
>
> Fonte única de verdade de segurança. Toda feature deve passar pelo [checklist final](#checklist-de-seguranca-definition-of-done) antes do merge.

---

## Princípios

1. **Zero trust no cliente.** Nenhuma decisão de segurança (autorização, validação, limites) confia em dados vindos do browser. Tudo é revalidado no servidor.
2. **Defense in depth.** RLS no banco **e** checagem na action/service — nunca só uma camada.
3. **Menor privilégio.** Cada chave, role e query recebe o mínimo necessário.
4. **Fail secure.** Em dúvida/erro, negue o acesso e não vaze detalhes internos.
5. **Segredos fora do código.** Sempre em `.env`/secret manager, nunca versionados nem no bundle client.

---

## OWASP Top 10 (Web) aplicado ao projeto

### A01 — Broken Access Control
- **RLS obrigatório** em toda tabela; policies por `auth.uid()`. Sem RLS = tabela proibida.
- Autorização revalidada em **toda** Server Action / Route Handler (`getUser()` server-side), nunca inferida do client.
- IDs de recurso sempre filtrados pelo dono; nunca confie em `userId` vindo do body/params (IDOR).
- **Nunca** usar a `service_role` key em código acessível ao cliente; ela ignora RLS.

### A02 — Cryptographic Failures
- HTTPS em tudo. Cookies de sessão `HttpOnly`, `Secure`, `SameSite=Lax`.
- Senhas e hashing são responsabilidade do Supabase Auth — nunca implementar hashing próprio.
- Nada de PII/segredo em `localStorage` ou em logs. Buckets de mídia privados por padrão.

### A03 — Injection
- Acesso a dados **apenas** via client Supabase/queries parametrizadas — sem SQL concatenado.
- Validar e tipar toda entrada no servidor com **Zod** antes de usar (body, params, searchParams, form data).
- Sanitizar qualquer HTML renderizado; evitar `dangerouslySetInnerHTML`. Saída de IA é tratada como **não confiável** (ver LLM01).

### A04 — Insecure Design
- Modelar limites por feature (tamanho/duração de upload, nº de análises) desde o design.
- Fluxos de IA assíncronos com estados explícitos e timeouts; sem operação sem limite.

### A05 — Security Misconfiguration
- Segredos só em variáveis de ambiente **validadas no startup** (Zod). `NEXT_PUBLIC_*` só para o que é realmente público.
- Headers de segurança em `next.config`: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`.
- Sem stack trace/detalhe de erro para o usuário (ver A09). CORS restrito às origens necessárias.

### A06 — Vulnerable & Outdated Components
- Dependências fixadas; rodar `npm audit` na CI e atualizar libs críticas com regularidade.
- Não introduzir dependência sem necessidade real (reduz superfície de ataque).

### A07 — Identification & Authentication Failures
- Auth via Supabase Auth; rotas protegidas por **middleware** + checagem server-side na action.
- Sessão renovada no servidor; logout invalida sessão. Rate limit em login/signup/reset.
- E-mail confirmado antes de acesso a recursos sensíveis, quando aplicável.

### A08 — Software & Data Integrity Failures
- Validar tipo/tamanho de arquivos de upload no servidor (MIME real, não só extensão).
- Nunca `eval`/execução dinâmica de conteúdo remoto ou de saída de IA.
- Lockfile versionado; builds reprodutíveis.

### A09 — Security Logging & Monitoring Failures
- Logar eventos de auth, falhas de autorização e erros de IA — **sem** PII, tokens ou segredos.
- Mensagem genérica para o usuário; detalhe técnico só no log do servidor.

### A10 — Server-Side Request Forgery (SSRF)
- **Crítico:** o módulo aceita **links de vídeo (YouTube/Instagram)**. Toda URL fornecida pelo usuário deve ser validada contra allowlist de domínios, esquema `https` apenas, e **bloquear IPs internos/privados** (127.0.0.0/8, 10/8, 169.254/16, etc.).
- Nunca repassar URL do usuário direto para `fetch` do servidor sem validação.

---

## OWASP Top 10 for LLM (camada de IA)

A saída e a entrada de modelos de IA são **superfície de ataque**. Toda IA vive em `lib/ai/`.

- **LLM01 — Prompt Injection:** trate texto/imagens do usuário como não confiáveis. Separe instruções do sistema do conteúdo do usuário; nunca deixe a saída da IA disparar ações privilegiadas (deletar, alterar dados) sem validação/confirmação server-side.
- **LLM02 — Insecure Output Handling:** valide/parseie a saída da IA (ex.: Zod) antes de persistir ou renderizar. Nunca renderizar saída como HTML/markdown sem sanitização.
- **LLM04 — Model DoS / custo:** rate limit e limites de tamanho de entrada por usuário; timeouts. Evita abuso e explosão de custo.
- **LLM06 — Sensitive Information Disclosure:** não injetar segredos nem PII de outros usuários no prompt. Só o contexto do próprio usuário.
- **LLM08 — Excessive Agency:** a IA **descreve/analisa**, não executa. Qualquer mutação passa por service com autorização própria.
- **LLM10 — Prompt/API key leakage:** chave do provedor de IA só no servidor (`lib/ai/`), nunca exposta ao client.

---

## Upload de mídia (Supabase Storage)

- Buckets **privados**; acesso via URLs assinadas de curta duração.
- Validar no servidor: MIME real, extensão permitida, tamanho e (para vídeo) duração máxima.
- Nome de arquivo gerado pelo servidor (UUID) — nunca usar o nome do cliente diretamente (path traversal).
- Storage policies alinhadas ao dono (`auth.uid()`), espelhando a RLS das tabelas.

---

## Segredos e ambiente

- Variáveis validadas com Zod no startup (fail-fast). App não sobe com config inválida.
- `.env` **nunca** versionado; manter `.env.example` sem valores reais.
- `service_role`, chaves de IA e webhooks: **apenas server-side**. Só `NEXT_PUBLIC_*` chega ao browser.

---

## Checklist de segurança (Definition of Done)

- [ ] RLS ativa e testada na(s) tabela(s) tocada(s)
- [ ] Autorização revalidada server-side em toda action/handler (sem confiar no client)
- [ ] Entradas validadas com Zod (body, params, form, searchParams)
- [ ] Sem segredo no client/bundle; `service_role` só no servidor
- [ ] Uploads: MIME/tamanho/duração validados; bucket privado; nome gerado pelo servidor
- [ ] URLs de usuário (links de vídeo) passam por allowlist + bloqueio de IP interno (SSRF)
- [ ] Saída de IA validada/sanitizada antes de persistir/renderizar (LLM02)
- [ ] Rate limit em auth e endpoints de IA
- [ ] Erros genéricos ao usuário; logs sem PII/segredos
- [ ] Headers de segurança configurados
