# Deploy na Vercel — Surf Performance & Board AI

> Guia para publicar o MVP em produção (Etapa 2).  
> Repositório: `ivanmartins090317/surfChatIA` · branch `main`.

---

## Pré-requisitos

- [ ] Conta [Vercel](https://vercel.com) (recomendado **Pro** — análises IA levam até 60s; Hobby limita a 10s)
- [ ] Projeto Supabase com migrations aplicadas (`npm run db:push`)
- [ ] `OPENAI_API_KEY` válida
- [ ] Build local OK: `npm run build`

---

## 1. Conectar repositório GitHub

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório **surfChatIA**
3. Framework: **Next.js** (detectado automaticamente)
4. Root Directory: `.` (raiz)
5. Build Command: `npm run build` (padrão)
6. Output: padrão Next.js

Região configurada em `vercel.json`: **gru1** (São Paulo).

---

## 2. Variáveis de ambiente (Vercel → Settings → Environment Variables)

Configure para **Production**, **Preview** e **Development**:

| Variável | Obrigatória | Exemplo / notas |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SITE_URL` | ✅ Prod | `https://seu-app.vercel.app` (URL final do deploy) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | anon ou publishable key |
| `SUPABASE_URL` | ✅ | Mesmo URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | ✅ | Mesma anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Prod | Obrigatória para rate limit persistente (Etapa 2.2) |
| `OPENAI_API_KEY` | ✅ | `sk-...` — server-only |
| `SENTRY_DSN` | Recomendado | Erros server-side (IA, upload, rate limit) |
| `NEXT_PUBLIC_SENTRY_DSN` | Recomendado | Mesmo DSN — erros no browser (`global-error`) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Opcional | Upload de source maps no deploy |
| `SENTRY_AUTH_TOKEN` | Opcional | Token para source maps via CI/Vercel |

**Não** adicione `SUPABASE_DB_PASSWORD` na Vercel (só para CLI local / migrations).

Após o primeiro deploy, atualize `NEXT_PUBLIC_SITE_URL` com a URL real (ex.: `https://surf-chat-ia.vercel.app`).

---

## 3. Supabase Auth — URLs de redirect

No painel Supabase → **Authentication** → **URL Configuration**:

| Campo | Valor |
|-------|--------|
| **Site URL** | `https://seu-app.vercel.app` |
| **Redirect URLs** | `https://seu-app.vercel.app/auth/callback` |
| | `http://localhost:3000/auth/callback` (dev local) |

Salve e teste signup + reset de senha em produção.

### SMTP (recomendado antes do beta)

Supabase → **Project Settings** → **Auth** → SMTP customizado para confirmação de e-mail e reset.

---

## 4. Deploy

### Opção A — Git (recomendado)

Push na `main` → Vercel faz deploy automático após conectar o repo.

### Opção B — CLI

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.vercel.local   # opcional — revisar, não commitar
npx vercel --prod
```

---

## 5. Smoke test pós-deploy

Execute na URL de produção:

1. [ ] Landing `/` carrega
2. [ ] Signup + login
3. [ ] Dashboard autenticado
4. [ ] Nova análise (link YouTube ou imagem)
5. [ ] Prancha mágica (≥3 fotos)
6. [ ] Match de compatibilidade (IA visão)

---

## 6. Limitações conhecidas (beta)

| Item | Status |
|------|--------|
| Rate limit | ✅ Postgres persistente (migration `007_rate_limit`) — requer `SUPABASE_SERVICE_ROLE_KEY` |
| ffmpeg (vídeo) | Bundle pesado; pode exigir Vercel Pro e cold start maior |
| Timeout IA | 55s em Vercel (`lib/ai/client.ts`); `maxDuration = 60` no layout autenticado |
| Domínio customizado | Opcional — Vercel → Settings → Domains |

---

## 7. Etapa 2.2 — Rate limit + observabilidade

### Migration

Após deploy do código, aplique a migration no Supabase de produção:

```bash
npm run db:push
```

Isso cria a tabela `rate_limit_buckets` e a RPC `check_rate_limit`.

### Sentry (recomendado para beta)

1. Acesse [sentry.io/signup](https://sentry.io/signup) (plano **Developer** é grátis)
2. **Create project** → plataforma **Next.js**
3. Nome sugerido: `surf-ai-coach`
4. Copie o **DSN** (formato `https://xxx@oYYY.ingest.sentry.io/ZZZ`)
5. Na **Vercel → Environment Variables** (Production + Preview):

   | Variável | Valor |
   |----------|--------|
   | `SENTRY_DSN` | DSN copiado |
   | `NEXT_PUBLIC_SENTRY_DSN` | **mesmo DSN** |

6. **Redeploy** na Vercel
7. Teste local (dev): adicione as mesmas vars em `.env.local` → `npm run dev` → abra `http://localhost:3000/api/dev/sentry-test`
8. Teste produção: force um erro real (ex.: upload corrompido) ou aguarde o primeiro issue natural

**Alertas sugeridos** (Sentry → Alerts → Create Alert):
- Novo issue com tag `area:ai` ou `area:upload`
- Spike de erros (ex.: >5 em 1h)

E-mails são scrubbed antes do envio (`lib/observability/report-server-error.ts`).

---

## 8. Checklist Etapa 2.1

- [ ] Projeto Vercel criado e conectado ao repositório
- [ ] Variáveis de ambiente configuradas
- [ ] Supabase redirect URLs atualizadas
- [ ] `npm run db:push` no Supabase de produção
- [ ] Smoke test concluído
- [ ] SMTP configurado (opcional beta)

---

## Referências

- [Pendências Etapa 2](./state/PENDENCIAS.md)
- [Segurança](../SECURITY.md)
- `.env.example` na raiz do projeto
