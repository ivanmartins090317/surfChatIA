# Revisão de Segurança — 13/07/2026

> Revisão formal das seções **§A07** (auth) e **§A10** (SSRF) do [SECURITY.md](../SECURITY.md),  
> alinhada aos TCs homologados e ao checklist Definition of Done.

**Revisor:** sessão de homologação MVP (agent + Ivan Martins)  
**Escopo:** Auth, rotas protegidas, rate limit, SSRF em links de vídeo, RLS, uploads, IA.

---

## §A07 — Identification & Authentication Failures

| Controle | Status | Evidência |
|----------|--------|-----------|
| Auth via Supabase Auth | ✅ | `actions/auth-actions.ts` — signup, login, logout, reset |
| Rotas protegidas por middleware | ✅ | `lib/supabase/middleware.ts` — redirect `/login?redirect=` |
| Checagem server-side nas actions | ✅ | `requireAuthUser()` em todas as actions de mutação/leitura |
| Rate limit login/signup/reset | ✅ | `rateLimitAuthAction` — 10 req / 15 min por e-mail |
| Mensagens genéricas (sem vazar detalhe) | ✅ | Erros de auth não expõem stack/causa interna |
| Logout invalida sessão | ✅ | TC-03, TC-26 |
| Rotas profundas protegidas | ✅ | TC-25 — `/profile`, `/boards/new`, `/analyses/new`, etc. |

**Conclusão §A07:** ✅ Aprovado para MVP. E-mail confirmado depende de config SMTP Supabase (pendência Etapa 2 deploy).

---

## §A10 — Server-Side Request Forgery (SSRF)

| Controle | Status | Evidência |
|----------|--------|-----------|
| Allowlist de domínios (YouTube, Instagram) | ✅ | `lib/security/url-validator.ts` |
| Apenas HTTPS | ✅ | TC-12 + teste unitário `validateExternalVideoUrl` |
| Bloqueio localhost / IPs privados | ✅ | TC-12 + testes unitários |
| URL validada antes de uso server-side | ✅ | `media-service` / actions de análise |
| Sem fetch direto de URL do usuário | ✅ | Links só passam metadados ao prompt de IA |

**Conclusão §A10:** ✅ Aprovado. Revisão formal concluída com TC-12 e suite `security-and-parsers.test.ts`.

---

## Checklist DoD (SECURITY.md) — resumo MVP

| Item | Status | Notas |
|------|--------|-------|
| RLS ativa e testada | ✅ | TC-21, TC-22 — isolamento entre usuários |
| Autorização server-side | ✅ | `user_id` sempre do `requireAuthUser()`, nunca do body |
| Entradas validadas com Zod | ✅ | Parsers IA + validação de upload MIME/tamanho |
| Sem segredo no client | ✅ | `OPENAI_API_KEY` só em `lib/ai/client.ts` server-side |
| Uploads validados + bucket privado | ✅ | TC-10/11/15/22 — `file-type`, paths UUID |
| SSRF em links de vídeo | ✅ | §A10 acima |
| Saída de IA validada (LLM02) | ✅ | Zod em `performance-parser`, `board-spec-parser` |
| Rate limit auth + IA | ✅ | `rate-limit.ts` — auth 10/15min, IA 20/dia |
| Erros genéricos ao usuário | ✅ | `toActionErrorMessage` nas actions |
| Headers de segurança | ✅ | `next.config.ts` — CSP, HSTS, X-Frame-Options, etc. |

---

## Pendências pós-revisão (não bloqueiam Etapa 1)

- Rate limit **in-memory** → migrar para Postgres/Redis na **Etapa 2**
- SMTP Supabase prod para confirmação de e-mail
- Sentry/observabilidade formal na Etapa 2

**Resultado:** Checklist 1.2 concluído para critério de saída da Etapa 1.
