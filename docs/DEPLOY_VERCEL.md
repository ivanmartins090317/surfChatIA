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
| `SUPABASE_SERVICE_ROLE_KEY` | Opcional | Só se usar operações admin server-side |
| `OPENAI_API_KEY` | ✅ | `sk-...` — server-only |

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
| Rate limit in-memory | Perde estado entre instâncias — migrar Postgres na Etapa 2.2 |
| ffmpeg (vídeo) | Bundle pesado; pode exigir Vercel Pro e cold start maior |
| Timeout IA | 55s em Vercel (`lib/ai/client.ts`); `maxDuration = 60` no layout autenticado |
| Domínio customizado | Opcional — Vercel → Settings → Domains |

---

## 7. Checklist Etapa 2.1

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
