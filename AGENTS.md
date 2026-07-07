# Surf Performance & Board AI — Instruções do Agent

> SaaS que analisa vídeos e imagens de surf para feedback técnico de performance e especificação de pranchas via IA.
>
> **Idioma:** responda sempre em **português (pt-BR)** — textos de UI, commits e comunicação com o usuário.

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

## Stack

- **Frontend:** Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui · Radix · Lucide
- **Backend:** Supabase (Auth, Postgres, Storage, RLS) via Server Actions / Route Handlers
- **IA:** camada isolada em `lib/ai/` (prompts, parsing, tipos)
- **Validação:** Zod em toda entrada server-side
- **Estado de URL:** `nuqs` quando aplicável

---

## Arquitetura (nunca pule camadas)

```
UI (RSC/Client) → Server Action / Route Handler → Service → Supabase
```

1. **Server-first** — dados e mutações no servidor; UI é apresentação.
2. **Banco só via services/actions** — nunca query Supabase direto em componente.
3. **IA isolada** — toda chamada a modelo passa por `lib/ai/`; telas/actions só orquestram.
4. **RLS obrigatório** — cada usuário só acessa seus dados; revalidar autorização server-side.

### Estrutura de diretórios esperada

```
app/                    # Rotas App Router (RSC por padrão)
components/             # UI por feature (kebab-case)
  board-spec/
  performance-analysis/
lib/
  ai/                   # Prompts, client IA, parsers — única porta de IA
  supabase/             # Clients server/browser
services/               # Lógica de negócio e acesso a dados
actions/                # Server Actions (orquestram services)
docs/                   # PRD, Design System, Security
.cursor/rules/          # Regras Cursor (.mdc)
```

Ao criar código novo, siga essa estrutura. Arquivos > 300 linhas devem ser divididos por domínio/feature.

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

### Erros e estados de UI

Fluxos assíncronos (upload, análise IA) usam estados explícitos:

`enviando → processando → pronto → erro`

Mensagens de erro devem indicar **causa** e **correção**. Nunca engolir exceções.

---

## Documentação de referência

| Documento | Quando consultar |
|-----------|------------------|
| `docs/PRD.md` | Escopo, user stories, prioridades, entidades |
| `docs/PLANO_EXECUCAO.md` | **Roadmap do MVP** — fases, entregáveis, schemas, critérios de saída |
| `docs/DESIGN_SYSTEM.md` | **Antes de criar qualquer tela** — tokens, componentes, padrões por módulo, a11y |
| `docs/SECURITY.md` | **Antes do merge** — RLS, SSRF (links de vídeo), LLM, uploads, checklist DoD |
| `docs/PLANOS_E_LIMITES.md` | Planos SaaS, créditos, limites de uso e roadmap de monetização |
| `.cursor/rules/project-general.mdc` | Regras detalhadas sempre ativas no Agent |

**Não copie** conteúdo desses docs nas respostas ou no código — leia o arquivo e aplique. Referencie paths em vez de duplicar.

---

## UI e Design System

- **Dark-first**, mobile-first, alvos de toque ≥ 44px
- Tokens semânticos do Design System — **sem hex cru** no JSX
- Um CTA primário por tela; conteúdo do usuário (vídeo/prancha) é o foco
- Jargão de surf com explicação curta acessível
- Consulte a seção 11 do Design System para padrões de tela por módulo

---

## Segurança (resumo)

Detalhes em `docs/SECURITY.md`. Pontos críticos:

- Zero trust no cliente; defense in depth (RLS + checagem server-side)
- Zod em toda entrada; saída de IA tratada como **não confiável** (validar com Zod antes de persistir/renderizar)
- Segredos só em `.env` validado — **nunca sobrescreva `.env` sem confirmar**
- `service_role` e chaves de IA **apenas server-side**
- Uploads: MIME/tamanho validados, bucket privado, nome gerado pelo servidor
- Links de vídeo: allowlist de domínios + bloqueio SSRF (IPs internos)

Cumpra o checklist de segurança em `docs/SECURITY.md` antes de considerar uma feature pronta.

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

## O que evitar

- Query Supabase ou chamada de IA direto em componente
- `use client` em páginas inteiras sem necessidade
- Hardcode de credenciais ou segredos no código
- Renderizar saída de IA como HTML sem sanitização
- Duplicar regras já definidas em `.cursor/rules/` ou `docs/` — leia e aplique
- Editar PRD ou docs sem solicitação explícita do usuário
- Escopo fora do pedido — prefira o diff mínimo que resolve o problema

---

## Regras Cursor complementares

Este projeto usa **Project Rules** em `.cursor/rules/` além deste `AGENTS.md`. A regra `project-general.mdc` está sempre ativa.

Para instruções granulares por área, `AGENTS.md` aninhados em subdiretórios podem ser adicionados futuramente (ex.: `services/AGENTS.md`, `lib/ai/AGENTS.md`) — instruções mais específicas têm precedência sobre as do diretório pai.

Referência oficial: [Regras — AGENTS.md](https://cursor.com/pt-BR/docs/rules#agentsmd)
