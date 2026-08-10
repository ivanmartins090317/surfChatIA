# Spec: Créditos + paywall (Trilha A)

| Campo | Valor |
|-------|--------|
| **Status** | `draft` |
| **Autonomia** | `medium` (paths de billing/créditos e schema → review humano) |
| **Data** | 2026-08-10 |
| **Owner** | time Surf AI Coach |
| **Refs** | [PLANO_GO_LIVE_COBRANCA.md](../docs/state/PLANO_GO_LIVE_COBRANCA.md) Trilha A · [PLANOS_E_LIMITES.md](../docs/PLANOS_E_LIMITES.md) · plano aprovado na conversa |

---

## Problema

Hoje qualquer surfista autenticado pode disparar análises de IA até o teto anti-abuso diário. Não há cota comercial, contador visível nem bloqueio com caminho de upgrade. Sem créditos e paywall, o produto não consegue limitar custo de IA nem preparar cobrança.

## Objetivo

Introduzir **créditos de análise** no plano gratuito (2 no total para novos cadastros), **debitar só quando a análise concluir com sucesso**, mostrar saldo no app e, ao esgotar, apresentar **paywall** com CTA para a página de planos de exemplo — sem pagamento real nesta entrega.

## Fora de escopo

- Gateway de pagamento, assinatura, webhook ou packs pagos
- Reset mensal de ciclo / job de billing
- Backfill de créditos para contas já existentes
- Alterar o teto anti-abuso diário (permanece como rede de segurança)
- Landing marketing completa (Trilha B), além do mínimo para `/planos` de exemplo servir ao CTA
- Termos legais (Trilha C)

---

## Regras de domínio

### Crédito

- Um **crédito** = uma análise de IA que **termina com sucesso** (performance, prancha mágica ou compatibilidade).
- **Não debitar** quando a análise falha por erro de sistema.
- Saldo restante = cota do plano − créditos já usados no período + créditos avulsos em saldo.
- Plano **grátis**: cota **2 créditos no total** (não renova por mês nesta trilha).
- Apenas **novos cadastros** entram com a cota grátis. Contas já existentes **não** recebem os 2 créditos automaticamente.

### Plano e visibilidade

- Todo surfista autenticado tem um **plano** (grátis no MVP desta trilha).
- O saldo de créditos aparece:
  - no **shell** (badge persistente);
  - no **painel**;
  - **antes** de iniciar análise / gerar ficha / pedir match.

### Bloqueio e paywall

- Se não houver créditos suficientes para iniciar, o sistema **impede** a análise e informa de forma clara: **sem créditos** (mensagem distinta do limite diário anti-abuso).
- Paywall oferece CTA para a **página de planos de exemplo** (sem checkout real).

### Reanálise

- Em **erro de sistema**, o produto pode tentar **até 2 reanálises automáticas** sem debitar e sem pedir confirmação.
- Depois disso (ou em **reanálise voluntária** pedida pelo surfista), o app **pede confirmação explícita** de que ele quer reanalisar; se a nova análise tiver sucesso, **debita 1 crédito**.

### Segurança e confiabilidade

- Decisão de “pode analisar?” e de “debitar” acontece **só no servidor**, de forma atômica e auditável (histórico de consumo).
- O cliente nunca pode fabricar ou aumentar créditos.
- O teto anti-abuso diário continua valendo **além** da cota de créditos.

### Ordem das checagens ao iniciar

1. Surfista autenticado  
2. Tem crédito suficiente? → se não, **sem créditos** + paywall  
3. Passou no teto anti-abuso diário? → se não, mensagem de limite diário (já existente)  
4. Segue upload / processamento / IA  

### Debito

- Só após **sucesso** da análise: registra consumo no histórico e atualiza saldo usado.
- Falha após início: saldo intacto; retries automáticos conforme regra acima.

---

## Caminho feliz

1. Surfista **novo** cria conta → passa a ter plano grátis com **2 créditos**.
2. Abre o app e vê o **badge de créditos** no shell (ex.: “2 créditos”).
3. Inicia uma análise de performance (ou prancha mágica, ou match) com pelo menos 1 crédito → fluxo segue normalmente.
4. Análise conclui com **sucesso** → saldo passa a 1; histórico registra o consumo; badge atualiza.
5. Segunda análise com sucesso → saldo 0.
6. Tenta uma terceira → é bloqueado com **sem créditos** e vê paywall com CTA para **planos de exemplo**.
7. Em falha de sistema na primeira tentativa: até 2 retries automáticos sem cobrança; se algum retry tiver sucesso, debita 1 só nesse sucesso.
8. Surfista com créditos pede reanálise voluntária → confirma no diálogo → sucesso debita 1 crédito.

---

## Erros e bordas

| Situação | Comportamento esperado |
|----------|------------------------|
| Conta antiga (pré-feature), sem créditos grátis | Saldo 0 (ou sem cota grátis); ao tentar analisar, **sem créditos** + paywall |
| Saldo 0 ao iniciar | Bloqueio imediato; não sobe mídia para IA; mensagem **sem créditos** |
| Limite diário anti-abuso atingido, ainda com créditos | Mensagem de limite diário (não confundir com sem créditos) |
| Erro de sistema na IA / timeout | Não debita; até 2 retries auto; depois pede confirmação para nova tentativa |
| Reanálise voluntária sem confirmação | Não inicia |
| Reanálise voluntária confirmada que falha | Não debita |
| Duas análises disparadas quase juntas com 1 crédito | No máximo uma consome o crédito com sucesso; a outra é recusada ou falha sem deixar saldo negativo |
| Surfista não autenticado | Fluxo de login (já existente); créditos não se aplicam |
| CTA do paywall | Navega para página de **planos de exemplo** (preços ilustrativos, sem pagar) |
| Badge / contadores | Refletem saldo após sucesso ou após bloqueio; não confiam só em estado local otimista permanente |

---

## Critérios de Done

- [ ] Novos cadastros entram com **2 créditos totais** no plano grátis
- [ ] Contas já existentes **não** recebem backfill dos 2 créditos
- [ ] Débito ocorre **somente** em análise com sucesso (performance, prancha mágica, match)
- [ ] Erro de sistema não debita; até **2** retries automáticos; depois confirmação para reanálise
- [ ] Reanálise voluntária exige confirmação e debita só no sucesso
- [ ] Mensagem **sem créditos** distinta do limite diário
- [ ] Paywall com CTA para **planos de exemplo**
- [ ] Badge de créditos no **shell** + contador no painel e antes dos fluxos de análise
- [ ] Histórico de consumo auditável; cliente não consegue inventar créditos
- [ ] Teto anti-abuso diário permanece ativo
- [ ] Cenários da Spec cobertos por testes (serviço de créditos / regras críticas)
- [ ] Checklist de `docs/SECURITY.md` aplicável (autorização server-side, RLS, sem trust no client)
- [ ] Scoreboard da Trilha A atualizado em `docs/state/PLANO_GO_LIVE_COBRANCA.md`
- [ ] `npm run typecheck` · `npm run lint` · `npm test` verdes

---

## Escopo de arquivos permitido

| Área | Paths / globs |
|------|----------------|
| Spec / template | `specs/2026-08-10-creditos-paywall.md`, `specs/TEMPLATE-feature.md` |
| Schema | `supabase/migrations/**` *(path crítico — só com Spec aprovada)* |
| Domínio | `lib/domain/**` *(path crítico)* |
| Uso / créditos | `services/usage-service.ts` (novo), `services/**` dos fluxos de análise/prancha/match, testes em `lib/__tests__/**` ou espelho em `services/__tests__/**` |
| Actions | `actions/analysis-actions.ts`, `actions/board-actions.ts`, `actions/board-match-actions.ts` (e action fina de uso/créditos se necessário) |
| Perfil (leitura/defaults) | `services/profile-service.ts` *(path crítico)* |
| UI créditos / paywall | `components/**` (badge, paywall, dialog de reanálise), `app/(app)/**` (dashboard, new analysis/board/match, shell) |
| Planos exemplo | `app/**/planos/**` ou equivalente mínimo para o CTA |
| Docs de estado | `docs/state/PLANO_GO_LIVE_COBRANCA.md` (scoreboard Done) |
| Rate limit (somente composição, sem mudar regra 20/dia) | uso via API já existente em `lib/security/rate-limit.ts` / `services/rate-limit-service.ts` |

**Não alterar nesta feature (salvo aprovação explícita extra):** gateway de pagamento, `middleware.ts`, clients Supabase genéricos além do necessário, prompts de IA, PRD.

---

## Notas / decisões fechadas (aprovadas no plano)

1. Debitar só no sucesso  
2. 2 retries auto em erro de sistema; depois confirmação do surfista  
3. Créditos grátis só para novos signups  
4. 2 créditos totais (não mensais nesta trilha)  
5. CTA → planos de exemplo  
6. Persistência atômica e segura no servidor (padrão já usado para limites)  
7. Fórmula de saldo confirmada  
8. Sem job de ciclo mensal nesta trilha  
9. Badge no shell incluído  
10. Copy de bloqueio comercial: **sem créditos**

---

## Aprovação

- [ ] Spec aprovada para implementação (assinatura / data do responsible)
