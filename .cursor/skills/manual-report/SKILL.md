---
name: manual-report
description: Skill para criar, executar e documentar testes manuais no padrão Surf Performance & Board AI (POP-QA-SURF-001). Gera relatório HTML dark-first com scoreboard, galeria de evidências e log de bugs. Use em testes manuais, homologação MVP e validação E2E. Triggers on "criar relatório de testes", "testes manuais", "manual report", "plano de testes manual", "relatório de homologação", "QA manual", "criar testes", "gerar relatório de testes", "homologação", "evidências de teste".
---

# Skill: Manual Report (POP-QA-SURF-001)

Skill para criação e atualização de relatórios de testes manuais do **Surf Performance & Board AI** — SaaS de análise de performance e especificação de pranchas via IA.

> **Recomendação de modelo:** Para melhor qualidade, use um LLM superior (Claude Opus/Sonnet ou Gemini Pro). Modelos mais capazes geram planos de teste mais completos e relatórios mais precisos.

---

## Fluxo de Trabalho

### FASE 1 — Entender o Projeto

**1.1 Buscar documentação**

Procure os arquivos de contexto nesta ordem:

1. `docs/PRD.md` — escopo funcional do MVP
2. `docs/PLANO_EXECUCAO.md` — fases e critérios de saída
3. `docs/state/PENDENCIAS.md` — o que falta validar (fonte viva)
4. `docs/DESIGN_SYSTEM.md` — tokens visuais do relatório HTML
5. `docs/SECURITY.md` — casos de segurança (RLS, SSRF, uploads)
6. `AGENTS.md` — arquitetura e módulos

Se a documentação estiver incompleta, informe ao usuário e sugira consultar `docs/state/PENDENCIAS.md` antes de criar TCs.

**1.2 Tipo de projeto**

Este repositório é **Web — Next.js 15 (App Router) + Supabase + OpenAI**.

Ambiente padrão de teste manual:
- **Local:** `npm run dev` → `http://localhost:3000`
- **Pré-requisitos:** `.env.local` com Supabase + `OPENAI_API_KEY`; migrations aplicadas (`npm run db:push`)

**1.3 Mapear fluxos do MVP**

Atribua códigos `FL-XX` alinhados ao PRD e às fases do plano:

| Código | Fluxo | Rotas principais |
|--------|-------|------------------|
| FL-01 | Autenticação | `/login`, `/signup`, `/forgot-password` |
| FL-02 | Perfil surfista | `/profile` |
| FL-03 | Análise de performance | `/analyses/new`, `/analyses/[id]`, `/analyses` |
| FL-04 | Prancha mágica | `/boards/new`, `/boards/[id]`, `/boards` |
| FL-05 | Compatibilidade de prancha | `/compatibility/new`, `/compatibility/[id]` |
| FL-06 | Segurança e RLS | multi-usuário + storage privado |
| FL-07 | Shell e dashboard | `/dashboard`, navegação autenticada |

Consulte `docs/state/PENDENCIAS.md` para priorizar TCs ainda não validados.

---

### FASE 2 — Estrutura de Pastas

Estrutura esperada:

```
docs/
├── relatorio-testes-manuais.html   ← relatório principal
├── evidencias/                      ← screenshots dos TCs
│   └── README.md
└── state/
    └── PENDENCIAS.md                ← sincronizar após homologação
```

**Se `docs/evidencias/` não existir**, crie com `README.md` de instruções (nomenclatura, formatos aceitos).

---

### FASE 3 — Criar os Casos de Teste

Para cada fluxo, crie TCs com:

| Campo | Regra |
|-------|-------|
| `Código` | Sequencial global: `TC-01`, `TC-02`, … |
| `Descrição` | Ação + resultado observável |
| `Pré-condição` | Auth, env, dados de teste |
| `Resultado Esperado` | Comportamento correto (estados IA: enviando → processando → pronto → erro) |
| `Status` | `Pendente`, `Aprovado`, `Reprovado`, `Bloqueado` |

**Severidade de bugs (`BG-XX`):**
- 🔴 **CRÍTICO** — perda de dados, RLS quebrado, IA/core inutilizável
- 🟠 **ALTO** — fluxo P0 com defeito, workaround difícil
- 🟡 **MÉDIO** — funcionalidade secundária ou visual relevante
- ⚪ **BAIXO** — cosmético, copy, melhoria de UX

**Casos obrigatórios do MVP** (se ainda não existirem no HTML):
- Análise por link YouTube com IA real
- Upload imagem/vídeo no bucket `media`
- Link malicioso rejeitado (SSRF/domínio)
- Prancha mágica com ≥3 fotos no bucket `boards`
- RLS entre dois usuários
- Persistência de perfil após reload

---

### FASE 4 — Gerar / Atualizar o Relatório HTML

Arquivo: `docs/relatorio-testes-manuais.html`

Especificação visual e estrutural: [`references/report-spec.md`](references/report-spec.md)

**Obrigatório:**
- Paleta **Surf Performance & Board AI** (Design System §2 — lima `#C4FA4E`, aqua `#2DD9BE`, fundo `#0B0F14`)
- Tipografia: **Space Grotesk** (display) + **Inter** (corpo)
- Scoreboard + barra de progresso + acordeão por fluxo
- Galeria de evidências com lightbox
- Log de bugs + matriz de cobertura
- `testData` no JavaScript para counters automáticos
- Rodapé: **Surf Performance & Board AI** · POP-QA-SURF-001

**Nomenclatura de screenshots:**

```
docs/evidencias/tc09-analise-link-pronta.jpeg
docs/evidencias/tc15-upload-tres-fotos.jpeg
```

---

### FASE 5 — Checklist Final

- [ ] `docs/evidencias/` existe
- [ ] `docs/relatorio-testes-manuais.html` abre no browser sem erros no console
- [ ] Fluxos FL-01 a FL-07 cobertos (ou justificativa de escopo reduzido)
- [ ] TCs numerados sequencialmente; status inicial `Pendente`
- [ ] `testData` coerente com totais por fluxo
- [ ] Galeria com placeholders ou evidências reais
- [ ] Seção de bugs preparada
- [ ] Matriz de cobertura calculada
- [ ] `docs/state/PENDENCIAS.md` atualizado quando TCs forem aprovados

---

## Instruções para Preenchimento (orientar o usuário)

### O usuário faz:

1. Executa cada TC no navegador (`localhost:3000` ou ambiente indicado)
2. Captura screenshot do resultado
3. Envia imagem + status (✅ / ❌ / ⚠️) + observação

### A AI faz:

- Nomeia evidência: `tc[número]-[descricao-curta].jpeg`
- Atualiza status no HTML e `testData`
- Adiciona imagem na galeria do fluxo
- Registra bug `BG-XX` se reprovado
- Recalcula scoreboard e matriz
- Marca item correspondente em `docs/state/PENDENCIAS.md` quando aplicável

---

## Referências

- Especificação HTML: [`references/report-spec.md`](references/report-spec.md)
- Pendências vivas: [`docs/state/PENDENCIAS.md`](../../docs/state/PENDENCIAS.md)
- Design System (cores): [`docs/DESIGN_SYSTEM.md`](../../docs/DESIGN_SYSTEM.md)
