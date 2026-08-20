---
name: close-phase
description: >-
  Checklist para fechar fase ou spec: atualizar docs/implementation,
  docs/manual-dev e docs/state/PENDENCIAS.md após implementação técnica.
  Use ao concluir feature, fechar fase, "finalize a implementação" ou antes
  de marcar spec como pronta.
---

# Fechamento de fase · Surf AI Coach

Sempre responder e documentar em **pt-BR**.

## Quando usar

- Spec aprovada implementada (código + testes passando)
- Usuário pede "feche a fase", "finalize a implementação" ou equivalente
- **Antes** de reportar a entrega como concluída ao mantenedor

## Pré-requisito técnico

Rodar e registrar evidências:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run db:push        # se houver migration nova
```

## Checklist de documentação (obrigatório)

### 1. `docs/implementation/`

Criar ou atualizar registro **objetivo** da fase.

**Convenção de nome:** `YYYY-MM-DD-slug.md` (ex.: `2026-08-10-creditos-paywall.md`).

Incluir:

- Status, plano (`docs/PLANO_EXECUCAO.md` ou trilha em `docs/state/PLANO_GO_LIVE_COBRANCA.md`), spec (`specs/...`)
- Tabelas de arquivos entregues (migrations, services, páginas, componentes)
- Testes automatizados adicionados
- Evidências de Done (comando + resultado)
- Pendências menores (homologação manual, dívida técnica)

Atualizar **`docs/implementation/README.md`**: linha da fase → link + status.

### 2. `docs/manual-dev/{NN}-fase-{N}-*.md`

Criar capítulo **explicativo** para o dev. Modelo: `docs/manual-dev/04-fase-creditos-paywall.md`.

Incluir:

- O que a fase entrega (e o que **não** entrega)
- Fluxos principais (happy path)
- Contas de teste e cenários de homologação manual
- Comandos úteis
- Link para `docs/implementation/...` e próximo passo em `PENDENCIAS.md` / `PLANO_GO_LIVE_COBRANCA.md`

Atualizar **`docs/manual-dev/README.md`**: índice + tabela de fases.

### 3. `docs/state/PENDENCIAS.md` e scoreboard

- Marcar com `[x]` itens **implementados** da fase
- Atualizar **`docs/state/PLANO_GO_LIVE_COBRANCA.md`** (scoreboard da trilha) quando aplicável
- Atualizar "Última revisão" com data
- Homologação manual: deixar `[ ]` até rodar cenários ou relatório POP-QA

## Ordem recomendada

1. Evidências técnicas (typecheck, lint, test, build, db:push)
2. `docs/implementation/` + README
3. `docs/manual-dev/` + README
4. `docs/state/PENDENCIAS.md` (+ PLANO_GO_LIVE se trilha)
5. Reportar ao usuário com links para os três docs

## O que não fazer

- Não alterar a spec (`specs/`) salvo pedido explícito
- Não marcar homologação formal como feita se não rodou
- Não sobrescrever `.env` sem confirmação explícita

## Referências

- Regra always-on: `.cursor/rules/project-general.mdc`
- Contrato do repo: `AGENTS.md` § DoD de documentação
- Homologação E2E: `.cursor/skills/manual-report/SKILL.md`
- Deploy prod: `docs/DEPLOY_VERCEL.md`
