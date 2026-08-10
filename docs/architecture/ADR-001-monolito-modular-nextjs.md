# ADR-001: Usar monólito modular em Next.js

## Status

Aceito (2026-08-06)

## Contexto

O Surf AI Coach é um SaaS em fase de colocar no ar. Time pequeno (essencialmente uma pessoa). Domínio ainda cabe em um produto: auth, mídia, análise de performance, prancha e compatibilidade.

Já existe uma direção no `AGENTS.md`:

```text
UI → Server Action → Service → Supabase
```

A tentação comum seria “já separar microserviços de IA / API / web”. O custo operacional disso (deploys, rede, auth distribuída, observabilidade) não se paga no estágio atual.

## Decisão

Manter **um único deploy** (Next.js App Router + Server Actions), organizado como **monólito modular**:

- Módulos por domínio (auth, media, performance-analysis, board-spec, compatibility).
- Dependências apontando para dentro (presentation → application → domain/ports ← infrastructure).
- Integrações (Supabase, OpenAI, Sentry) atrás de adapters.

Não adotar microserviços neste estágio.

## Consequências positivas

- Deploy e ambiente local simples (Vercel + Supabase).
- Menor custo operacional para um time solo.
- Refactors baratos enquanto o domínio ainda muda.
- Dá pra evoluir módulos internos sem contrato de rede prematuro.

## Consequências negativas

- Escala de CPU/IA fica no mesmo processo/app (mitigar com rate limit, timeouts, depois filas).
- Disciplina de limites internos é obrigatória: sem isso vira “big ball of mud”.
- Se no futuro um cliente mobile precisar da mesma lógica, pode exigir extrair HTTP/API dos use cases.

## Alternativas consideradas

1. **Microserviços** (web / API / worker IA): rejeitado agora. Complexidade operacional > benefício.
2. **Serverless totalmente distribuído** (várias functions + filas desde o dia 1): rejeitado como default. Pode entrar depois só na análise longa.
3. **Clean Architecture completa em todas as pastas já**: rejeitado como big-bang. Vamos modularizar pela feature de performance primeiro.

## Follow-ups

- [ ] Extrair port de repositório/análise na feature de performance.
- [ ] Garantir pelo menos um caso de uso testável sem Supabase/OpenAI reais.
- [ ] Atualizar este ADR se surgir fila/worker.
