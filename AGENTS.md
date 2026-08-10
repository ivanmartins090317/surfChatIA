# AGENTS.md

Constituição do projeto para agentes de IA. Este arquivo é contrato **read-only**: o agente **não altera** sem aprovação explícita.

> SaaS que analisa vídeos e imagens de surf para feedback técnico de performance e especificação de pranchas via IA.
>
> **Idioma:** responda sempre em **português (pt-BR)** — textos de UI, commits e comunicação com o usuário.

---

## Stack

- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript
- **UI:** React · Tailwind CSS · shadcn/ui · Radix · Lucide
- **Backend:** Supabase (Auth, Postgres, Storage, RLS) via Server Actions / Route Handlers
- **IA:** camada isolada em `lib/ai/` (prompts, parsing, tipos)
- **Validação:** Zod em toda entrada server-side
- **Estado de URL:** `nuqs` quando aplicável
- **Testes:** Vitest (`npm test`)
- **Package manager:** npm

---

## Produto e escopo

Consulte `docs/PRD.md` para requisitos completos. Resumo do MVP:

| Módulo | Prioridade | Descrição |
|--------|------------|-----------|
| Auth e perfil | P0 | Conta Supabase, perfil (nível, peso, altura, tipo de onda) |
| Análise de performance | P0 | Upload de vídeo/imagem/link → feedback técnico estruturado |
| Prancha mágica | P0 | Cadastro com fotos → ficha técnica gerada por IA |
| Compatibilidade de prancha | P1 | Comparar prancha candidata com perfil e prancha mágica |

Fora do MVP: PDF, comparação lado a lado de sessões, features de coach/shaper.

---

## Arquitetura (nunca pule camadas)

```
UI (RSC/Client) → Server Action / Route Handler → Service → Supabase
```

1. **Server-first** — dados e mutações no servidor; UI é apresentação.
2. **Banco só via services/actions** — nunca query Supabase direto em componente.
3. **IA isolada** — toda chamada a modelo passa por `lib/ai/`; telas/actions só orquestram.
4. **RLS obrigatório** — cada usuário só acessa seus dados; revalidar autorização server-side.

### Estrutura preferida

Monólito modular (ADR-001). Preferir **fatias verticais por feature**, mantendo a cadeia de camadas:

```
app/                          # Rotas App Router (RSC por padrão)
components/<feature>/         # UI da feature (kebab-case)
actions/<feature>-actions.ts  # Server Actions (orquestram)
services/<feature>-service.ts # Lógica de negócio e acesso a dados
lib/ai/                       # Única porta de IA (prompts, parsers, tipos)
lib/supabase/                 # Clients server/browser
lib/domain/                   # Tipos/regras de domínio (crítico)
specs/<feature>.md            # Spec aprovada da feature
supabase/migrations/          # Schema SQL + RLS
docs/                         # PRD, Design System, Security, architecture
.cursor/rules/                # Regras Cursor (.mdc)
```

Diretrizes:

- Agrupar o que muda junto por feature (`components/`, `actions/`, `services/`, trechos de `lib/ai/` relacionados).
- Evitar layers horizontais distantes para a mesma feature sem necessidade.
- Preferir **Deep Modules**: interface estreita, lógica junta, helpers no mesmo arquivo quando couber.
- Nomes **grepáveis e específicos** (evitar `dataProcessor`, `utils2`, `helper`).
- Arquivo ideal até **~300 linhas**; dividir por domínio/feature antes de crescer. Nunca passar de **~1000 linhas**.

---

## Pode

- Criar e editar arquivos da **feature atual** (ex.: `components/<feature>/`, `actions/<feature>-*`, `services/<feature>-*`, parsers/prompts relacionados em `lib/ai/`)
- Criar testes unitários e de aceite relacionados à Spec aprovada
- Rodar comandos de verificação locais (`typecheck`, `lint`, `test`)
- Ler o restante do codebase e `docs/` para contexto
- Propor mudanças fora do escopo (**sem aplicar** até aprovação explícita)

---

## Não pode

- Alterar este `AGENTS.md` sem pedido explícito
- Alterar Spec aprovada em `specs/` sem pedido explícito
- Mexer em **paths críticos** sem pedido explícito (lista abaixo)
- Criar migration / mudar schema de banco sem aprovação
- Adicionar dependência nova sem aprovação
- `git push`, merge em `main`/`master`, deploy
- Criar commit sem o usuário pedir
- Sobrescrever `.env` sem confirmação explícita
- Editar PRD ou docs de produto sem solicitação explícita

---

## Paths críticos (autonomia tight)

Só alterar com pedido explícito + Spec aprovada + review humano:

- `lib/domain/**`
- `lib/supabase/**`
- `lib/ai/**` (contratos, client e prompts compartilhados)
- `lib/security/**`
- `**/auth/**`, `actions/auth*`, `services/profile*`
- `**/billing/**`, planos/créditos (quando existirem)
- `supabase/migrations/**`
- `.env*`
- CI/CD e configs de produção (`.github/workflows/**`, `next.config.*`, `vercel.json`, Sentry de prod)
- `middleware.ts`

---

## Autonomia por tarefa

No início de cada feature, declarar um nível:

| Nível | Review humano |
|-------|----------------|
| `tight` | Revisa plano, Spec e diff |
| `medium` | Revisa Spec e resultado dos testes |
| `loose` | Revisa só Done (Spec + comandos verdes) |

- **Default:** `medium`
- **Paths críticos:** sempre `tight`

---

## Fluxo obrigatório por feature

1. **Research** (sem código) — ler PRD/plano/código relacionado
2. **Plano curto** (sem código) — escopo, arquivos prováveis, riscos
3. **Spec** em `specs/<feature>.md` → **esperar aprovação humana**
4. **Implementar** só o que a Spec pede
5. **Verificar Done** (comandos abaixo)
6. **Parar** e reportar evidências no formato da seção final

Tarefas triviais (≤10 linhas, sem impacto sistêmico): Spec pode ser omitida se o usuário dispensar; autonomia permanece `medium` ou `tight` conforme paths.

---

## Done (definição objetiva)

Só declarar Done quando **TODOS** passarem:

```bash
npm run typecheck
npm run lint
npm test
```

E também:

- Cenários da Spec da feature em verde
- Nenhuma mudança fora do escopo sem aprovação
- Resumo do que mudou + arquivos tocados
- Checklist de `docs/SECURITY.md` cumprido quando a feature tocar auth, upload, links, IA ou dados

---

## Como reportar ao final

```md
## Resultado
- Autonomia usada:
- Spec:
- Comandos Done:
- Arquivos alterados:
- Riscos / dúvidas:
- Diff crítico para review humano: sim/não
```

---

## Convenções de código

### TypeScript e React

- Componentes funcionais com `function`; **sem classes**
- **`interface`** sobre `type`; **sem `enum`** — use const objects/mapas
- **Exports nomeados**; diretórios em **kebab-case**
- **`use client` mínimo** — prefira RSC; client só para interação/estado local em componentes pequenos, com `Suspense`
- Ordem de imports: externos → aliases internos → relativos do mesmo domínio

### Clean Code

- SRP: uma responsabilidade por arquivo/função
- Funções ≤ 20–30 linhas; extraia auxiliares nomeados
- Guard clauses / early return; sem `catch` vazio
- Sem dead code, mocks em dev/prod (apenas em testes) ou strings/números mágicos
- Reutilize antes de recriar; não force abstração prematura
- Dependência aponta pra dentro: UI → actions → services → ports/infra; domínio não conhece framework

### Erros e estados de UI

Fluxos assíncronos (upload, análise IA) usam estados explícitos:

`enviando → processando → pronto → erro`

Mensagens de erro devem indicar **causa** e **correção**. Nunca engolir exceções.

---

## UI e Design System

- **Dark-first**, mobile-first, alvos de toque ≥ 44px
- Tokens semânticos do Design System — **sem hex cru** no JSX
- Um CTA primário por tela; conteúdo do usuário (vídeo/prancha) é o foco
- Jargão de surf com explicação curta acessível
- Consulte `docs/DESIGN_SYSTEM.md` (seção 11) antes de criar telas

---

## Segurança (resumo)

Detalhes em `docs/SECURITY.md`. Pontos críticos:

- Zero trust no cliente; defense in depth (RLS + checagem server-side)
- Zod em toda entrada; saída de IA tratada como **não confiável** (validar com Zod antes de persistir/renderizar)
- Segredos só em `.env` validado — **nunca sobrescreva `.env` sem confirmar**
- `service_role` e chaves de IA **apenas server-side**
- Uploads: MIME/tamanho validados, bucket privado, nome gerado pelo servidor
- Links de vídeo: allowlist de domínios + bloqueio SSRF (IPs internos)

---

## Camada de IA (`lib/ai/`)

- Prompts, parsing e tipos ficam aqui — não espalhe lógica de IA em components ou services
- Separe instruções do sistema do conteúdo do usuário (anti prompt injection)
- IA **descreve/analisa** — mutações passam por service com autorização própria
- Rate limit, timeouts e limites de tamanho de entrada por usuário

---

## Git e entrega

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`)
- **Branches:** descritivas (`feature/analise-performance`, `fix/upload-validacao`)
- Só crie commits quando o usuário pedir explicitamente
- Após alterações relevantes: reflita brevemente sobre escalabilidade/manutenibilidade; cubra com testes (≥ 80% quando aplicável)

---

## Documentação de referência

| Documento | Quando consultar |
|-----------|------------------|
| `docs/PRD.md` | Escopo, user stories, prioridades, entidades |
| `docs/PLANO_EXECUCAO.md` | Roadmap do MVP — fases, entregáveis, schemas |
| `docs/DESIGN_SYSTEM.md` | Antes de criar qualquer tela |
| `docs/SECURITY.md` | Antes do merge — RLS, SSRF, LLM, uploads |
| `docs/PLANOS_E_LIMITES.md` | Planos SaaS, créditos, limites |
| `docs/architecture/` | ADRs e mapa de módulos |
| `specs/<feature>.md` | Contrato da feature em andamento |
| `.cursor/rules/project-general.mdc` | Regras detalhadas sempre ativas |

**Não copie** conteúdo desses docs nas respostas ou no código — leia o arquivo e aplique. Referencie paths em vez de duplicar.

---

## O que evitar

- Query Supabase ou chamada de IA direto em componente
- `use client` em páginas inteiras sem necessidade
- Hardcode de credenciais ou segredos no código
- Renderizar saída de IA como HTML sem sanitização
- Duplicar regras já definidas em `.cursor/rules/` ou `docs/` — leia e aplique
- Escopo fora do pedido — prefira o diff mínimo que resolve o problema

---

## Regras Cursor complementares

Este projeto usa **Project Rules** em `.cursor/rules/` além deste `AGENTS.md`. A regra `project-general.mdc` está sempre ativa.

`AGENTS.md` aninhados em subdiretórios (ex.: `services/AGENTS.md`, `lib/ai/AGENTS.md`) têm precedência sobre o pai quando existirem.

Referência oficial: [Regras — AGENTS.md](https://cursor.com/pt-BR/docs/rules#agentsmd)
