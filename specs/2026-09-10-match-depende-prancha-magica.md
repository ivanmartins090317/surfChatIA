# Spec: Match depende de prancha mágica

| Campo | Valor |
|-------|--------|
| **Status** | `draft` |
| **Autonomia** | `medium` (UI, navegação e docs; sem gate no backend) |
| **Data** | 2026-09-10 |
| **Owner** | Ivan Martins (ModernXLab) |
| **Refs** | [Plano aprovado](../docs/plans/2026-09-10-match-integrado-pranchas.md) · [PRD §4.4](../docs/PRD.md) · [PENDENCIAS FL-05](../docs/state/PENDENCIAS.md) · [PLANO_EXECUCAO Fase 4](../docs/PLANO_EXECUCAO.md) · [DESIGN_SYSTEM.md](../docs/DESIGN_SYSTEM.md) |

---

## Problema

O Match (compatibilidade) aparece hoje como módulo irmão de Pranchas: a navegação, o dashboard e o fluxo de “nova comparação” permitem seguir sem prancha mágica pronta. A referência mágica é opcional na interface (“avaliar só com perfil”), e o PRD ainda trata a mágica como “se houver”.

Isso dilui o valor do produto: o Match deveria comparar uma prancha candidata **com a mágica** do surfista, não existir como atalho paralelo.

## Objetivo

Integrar o Match **dentro do fluxo de Pranchas**, deixando explícito que um depende do outro:

1. A interface só **oferece** novo Match depois que existir pelo menos uma prancha mágica com ficha **pronta** (`ready`).
2. A navegação principal deixa de listar Match como item irmão independente; a descoberta passa pelo hub e pelo detalhe de Pranchas.
3. Histórico de matches anteriores (inclusive os feitos sem referência) **permanece** acessível.
4. A candidata continua sendo só **fotos** (e medidas anunciadas opcionais) da análise — não vira cadastro de prancha.

O backend **não** ganha rejeição dura nesta entrega: a dependência é de produto/UX.

## Fora de escopo

- Bloquear criação de Match no service/action quando não houver mágica ou referência
- Migrar candidata para cadastro de prancha / CRUD de candidatas
- Apagar, ocultar ou migrar matches antigos sem referência
- Mudança de créditos, billing ou schema
- Remover as telas/rotas de histórico e formulário de Match (deep links e legado permanecem)
- Alterar o conteúdo da análise de IA (veredito, prós, contras, etc.)

---

## Regras de domínio

### Prefixo de produto

- **Prancha mágica** = prancha cadastrada pelo surfista como referência; só libera Match quando a ficha está **pronta**.
- **Match** = comparação de uma prancha **candidata** (fotos + medidas opcionais) com o perfil e com a mágica escolhida.
- Status relevantes da mágica na UX:
  - **pronta** → libera CTAs e formulário de novo Match
  - **rascunho / processando / erro** → não libera; copy orienta a aguardar ou corrigir o cadastro
  - **nenhuma prancha** → não libera; copy orienta a cadastrar a mágica

### Navegação

- Remover **Match** da navegação principal do app.
- Entrada principal: hub de Pranchas e detalhe de uma mágica pronta.
- Telas de histórico e de novo Match continuam alcançáveis por link direto (bookmark, CTA interno).

### Hub de Pranchas

- Continua listando as pranchas mágicas do surfista.
- Exibe seção/CTA de Match e empty states que explicam a dependência.
- Com pelo menos uma mágica **pronta**: CTA do tipo “Fazer Match” / “Comparar outra prancha”.
- Sem mágica pronta: alerta + CTA para cadastrar (ou “aguarde a ficha ficar pronta”).

### Detalhe da prancha mágica

- Se a ficha está **pronta**: CTA “Comparar outra prancha (Match)” que abre o formulário de novo Match **já com essa mágica como referência**.
- Se não está pronta: sem CTA de Match (ou CTA desabilitado com copy de aguardo/correção).

### Histórico de Match

- Lista matches anteriores do surfista, **incluindo legado sem referência**.
- Botão/CTA “Nova comparação” só ativo se existir mágica **pronta**; caso contrário, gate amigável com CTA para Pranchas / cadastro.

### Novo Match (formulário)

- **Gate UX:** sem mágica pronta → alerta + CTA para cadastrar/aguardar (não página de erro vazia; deep link amigável).
- Com mágica pronta → formulário disponível; escolha da **prancha mágica de referência é obrigatória na interface** (não há mais opção “Nenhuma — avaliar só com perfil”).
- Candidata: upload de fotos + medidas anunciadas opcionais — comportamento atual, inalterado.
- Envio bem-sucedido segue para a tela de resultado do Match (fluxo já existente).

### Dashboard

- CTA de compatibilidade/Match só visível ou ativo quando houver mágica **pronta**.
- Sem mágica pronta: copy/CTA aponta para cadastrar a prancha mágica.

### Copy dos empty states (orientação)

1. **Sem nenhuma prancha:** “Cadastre sua prancha mágica para liberar o Match.”
2. **Só rascunho / processando / erro:** “Aguarde a ficha ficar pronta para comparar outras pranchas.”
3. **Com pronta, sem matches ainda:** “Compare uma prancha candidata com a sua mágica.”

### PRD

- Atualizar §4.4 para refletir que a prancha mágica **pronta** é pré-requisito do fluxo de produto do Match (deixa de ser “se houver” / opcional na jornada).

### Decisão explícita (aceita nesta Spec)

- O backend pode continuar aceitando Match sem referência; o gate é **somente UX**. Isso deve ficar documentado nos docs vivos ao fechar a fase.

---

## Caminho feliz

1. Surfista autentica e tem (ou cadastra) uma prancha mágica cuja ficha fica **pronta**.
2. Em **Pranchas**, vê a lista e o CTA de Match; ou no detalhe da mágica pronta, aciona “Comparar outra prancha”.
3. Abre o formulário de novo Match com a mágica de referência **já selecionada** (ou seleciona uma entre as prontas — obrigatório).
4. Envia fotos da candidata (medidas anunciadas opcionais).
5. Recebe o resultado do Match e pode reabrir o histórico depois.
6. Na navegação principal, Match **não** aparece como item irmão; o caminho natural continua sendo Pranchas → Match.

---

## Erros e bordas

| Situação | Comportamento esperado |
|----------|------------------------|
| Surfista sem nenhuma prancha mágica | Hub e telas de novo Match mostram empty/gate com CTA para cadastrar; sem CTA ativo de “Fazer Match”. |
| Só mágicas em rascunho, processando ou erro | Mesmo gate; copy de aguardar ficha pronta (ou corrigir cadastro se erro). |
| Deep link / bookmark em “novo Match” sem mágica pronta | Gate amigável + CTA para Pranchas/cadastro — **não** 404 nem página em branco. |
| Surfista com mágica pronta e tenta “Nova” no histórico | Formulário abre; referência obrigatória na UI. |
| Match legado sem referência no histórico | Continua listado e abrível; não some. |
| Detalhe de mágica ainda não pronta | Sem CTA de Match (ou desabilitado com explicação). |
| Dashboard sem mágica pronta | CTA de Match ausente/inativo; aponta para cadastrar mágica. |
| Match some da nav mobile | Mitigado por CTA forte no hub de Pranchas e no detalhe `ready`. |
| Tentativa de enviar novo Match sem escolher referência (UI) | Formulário impede envio até escolher uma mágica pronta. |
| Backend ainda aceita Match sem referência | Aceito nesta entrega; não é regressão a corrigir no service. |

---

## Critérios de Done

- [ ] Spec aprovada (`approved`) antes da implementação
- [ ] Match **não** aparece como item irmão na navegação principal
- [ ] Sem mágica pronta, a UI de “novo Match” alerta/orienta para Pranchas (deep link amigável)
- [ ] Com mágica pronta, o fluxo novo **exige** referência na UX
- [ ] Hub e detalhe de Pranchas oferecem CTA de Match quando aplicável
- [ ] Dashboard só libera CTA de Match com mágica pronta
- [ ] Histórico legado permanece listável (com e sem referência)
- [ ] PRD §4.4 alinhado (mágica pronta como pré-requisito do fluxo de produto)
- [ ] Docs vivos atualizados: `docs/implementation/` · `docs/manual-dev/` · `docs/state/PENDENCIAS.md` (skill `close-phase`)
- [ ] `npm run typecheck` · `npm run lint` · `npm test` verdes
- [ ] Nenhuma mudança de schema, billing ou bloqueio no backend de Match

---

## Escopo de arquivos permitido

| Área | Paths / globs |
|------|----------------|
| Navegação | `components/layout/app-nav.tsx` |
| Hub Pranchas | `app/(app)/boards/page.tsx` · eventual `components/board-spec/boards-match-section.tsx` (ou equivalente no domínio board-spec) |
| Detalhe mágica | `app/(app)/boards/[id]/page.tsx` |
| Histórico Match | `app/(app)/compatibility/page.tsx` |
| Novo Match | `app/(app)/compatibility/new/page.tsx` |
| Formulário | `components/board-spec/board-match-form.tsx` |
| Dashboard | `app/(app)/dashboard/page.tsx` |
| Copy / empty states | componentes de empty state já usados nas telas acima (só o necessário) |
| PRD | `docs/PRD.md` (§4.4) |
| Docs vivos (ao fechar) | `docs/implementation/**` · `docs/manual-dev/**` · `docs/state/PENDENCIAS.md` (+ índices README) |
| Testes | testes unitários/aceitação das telas/componentes acima, se já houver cobertura; novos só se necessários para Done |

**Fora do escopo de arquivos (não tocar sem pedido explícito):** services/actions de Match, `lib/ai/**`, `lib/domain/**`, `lib/supabase/**`, migrations, billing, middleware.

Paths críticos exigem Spec aprovada + review humano (`AGENTS.md`). Nesta feature o PRD é alteração de produto pedida no plano; services/actions de Match **não** entram.

---

## Notas / decisões abertas

- Nenhuma decisão de produto aberta: gate mínimo = mágica; bloqueio = só UX; candidata = só fotos; status liberador = pronta; histórico legado preservado; Match dentro de Pranchas.
- Ao implementar: copiar das empty states deve seguir tokens e padrões do Design System (dark-first, alvos ≥ 44px).
- Após aprovação desta Spec, implementar **somente** o que ela pede, na ordem: nav + hub + detalhe → gates de histórico/novo + form → dashboard → PRD + docs vivos + comandos Done.
