# Spec: Análise da onda completa (vídeo)

| Campo | Valor |
|-------|--------|
| **Status** | `draft` |
| **Autonomia** | `tight` (IA, domínio e mídia privada) |
| **Data** | 2026-09-14 |
| **Owner** | Ivan Martins (ModernXLab) |
| **Refs** | [Plano aprovado](../docs/plans/2026-09-14-analise-onda-completa.md) · [Research](../docs/plans/2026-09-14-research-melhoria-analise-ondas.md) · [DESIGN_SYSTEM §11.3](../docs/DESIGN_SYSTEM.md) · [SECURITY.md](../docs/SECURITY.md) · [PLANOS_E_LIMITES](../docs/PLANOS_E_LIMITES.md) |

---

## Problema

Na análise de **vídeo**, o coach virtual julga sobretudo **uma** manobra (em geral a primeira) e o resto da onda vira menção. O surfista não vê, fase a fase: o que aconteceu, se foi bem ou mal, e o que fazer no corpo/prancha **naquele instante**.

Sintomas confirmados no feedback (iniciantes / analista):

1. Só o primeiro momento alto recebe feedback de verdade.
2. “Entrada mais agressiva” sai igual em point lento e beach rápido — sem cadência relativa à onda.
3. Batida errada pode ser elogiada; o selo de “alta confiança” parece “você fez bem”.
4. Abortar a 2ª manobra vira “falta de consistência”, não leitura de seção.
5. Os cortes atuais perdem picos; o surfista quer os momentos altos **e** ver **onde** ajustar, no próprio frame.

## Objetivo

A análise de **vídeo novo** cobre a **onda inteira**, fase a fase, com dica concreta (olhar, bico, mão, joelhos, amplitude) e, quando couber, **foto anotada de coaching** no frame real do surfista.

O surfista sai da tela entendendo, em cada momento alto: o que viu o coach, a qualidade da execução, a certeza de que era aquela fase, e **o que fazer** — vendo o traço **na foto dele**.

A análise textual aparece primeiro (timeline útil). O visual de coaching completa depois, sem bloquear o resultado e **sem segundo crédito**.

## Fora de escopo

- Análise de **foto** e **link** (permanecem como hoje)
- Overlay desenhado no aparelho (traço vetorial no cliente)
- Foto fotorealista de **outro** surfista ou onda inventada
- Detecção de pose, tracking de articulações, processamento de vídeo no servidor
- Voltar a enviar/guardar o arquivo de vídeo original
- Amostragem pelos picos de movimento (neste ciclo: cortes uniformes)
- Troca de modelo de visão — só se o gabarito ainda elogiar manobra falhada (decisão à parte)
- Fine-tuning / base de conhecimento extra
- Mudar o preço do crédito (continua **1 crédito** por análise, incluindo as fotos anotadas)
- Nova dependência de pacote
- Comparação lado a lado de sessões
- Billing, auth, prancha mágica, Match

---

## Regras de domínio

### Escopo de mídia

- Esta Spec vale **somente** para análise de **arquivo de vídeo**.
- Foto de sessão e análise por link **não** ganham timeline de fases nem foto anotada.
- O vídeo continua **no aparelho**; a nuvem recebe só as **fotos da session** (regra já vigente).

### Fotos da session (vídeo)

- O aparelho tira até **8 fotos** em instantes **uniformes** da duração.
- No mobile frágil, o mínimo continua **2** fotos; a timeline usa as que existirem.
- Microcopy do envio (“algumas fotos da session”) **não** precisa citar o número 8.
- Limites de duração, peso local e formato **não mudam** nesta Spec.

### O que a análise de vídeo passa a devolver

Mantém o que o surfista já conhece: Surf Score e critérios, resumo, pontos fortes, melhorias, prioridades de treino. Análises antigas (sem ondas em fases) continuam renderizando nesse formato.

Acrescenta, para vídeo novo:

**Fases da onda** (lista na ordem da ride). Cada fase só existe se houver evidência em uma das fotos da session. Campos observáveis:

| Conceito | Significado |
|----------|-------------|
| Nome | Da taxonomia já usada (Drop, Bottom turn, Batida, Cutback, Linha da onda, Wipeout, …) |
| Instante | Rótulo de tempo já usado hoje (ex.: 0:12) e qual foto da session é a evidência |
| Qualidade da execução | `boa` · `regular` · `falhou` |
| Certeza da identificação | `alta` · `média` · `baixa` — **não** é qualidade técnica |
| O que vi | Evidência visível nesta foto |
| Como melhorar | Didático e concreto (olhar, direção do bico, mão/rail, amplitude do bottom turn / vertical da batida) |
| Foto anotada | Opcional; chega depois, se a edição de coaching der certo |

**Leitura da seção:** o que a onda fez neste trecho e qual alternativa existia (emendar, abortar, reposicionar) — e se abortar fez ou não sentido.

**Manobra observada (legado):** continua existindo para telas/listagens antigas; no vídeo novo equivale à fase de manobra **mais relevante**, não substitui a timeline.

### Regras do coach (vídeo)

- Emitir fase **só** com evidência na foto; se inferir, certeza da identificação = baixa.
- **Não elogiar** execução se a manobra falhou. Certeza alta de identificação **não** sobe nota de técnica nem autoriza copy de acerto.
- Drop **relativo** ao tipo de onda: point pode ser cadenciado; desacelerar para entrar no face pode ser correto; **nunca** “mais agressivo” como dica padrão sem evidência e sem contexto da onda.
- “Como melhorar” é **obrigatório** em fase regular ou falhou: pelo menos um de olhar, direção do bico, mão/rail, amplitude.
- Resumo técnico **cita as fases** (não só a primeira).
- Tom: didático, com ajuste concreto no corpo/prancha — não genérico (“melhore a postura”).

### Coaching visual (foto anotada)

- Só **editar a foto real** da fase: seta, arco, zona (“chegar até aqui no bottom turn”, “entrar no lip nesta linha”).
- **Não** gerar surfista fictício, outra onda, nem “é assim que o corpo deveria ter ficado” fotorealista.
- No máximo **3** fotos anotadas por análise — fases com execução regular ou falhou **e** evidência naquela foto.
- Copy visível: **“Ajuste sugerido neste instante”** — nunca “foto ideal”.
- A análise textual **não espera** as fotos anotadas. Se a edição falhar ou atrasar, o card permanece útil (foto original + texto).
- Instruções de desenho são do **sistema**; a foto do usuário é só a imagem de entrada.
- Foto anotada é saída **não confiável**: validar tipo e tamanho no servidor, gravar no espaço privado do dono, **nunca** reenviar essa imagem para uma nova análise.
- Teto de 3 edições; falha **não** estorna crédito e **não** cobra extra.

### Ordem da tela (só resultado de vídeo novo com fases)

Seguir Design System: conteúdo do usuário primeiro, dark, mobile-first, alvos ≥ 44px, tokens semânticos.

1. Surf Score + critérios (como hoje)
2. **Timeline da onda** — cards por fase (drop → bottom turn → linha → manobras → aborto/seção)
3. Cada card: foto (original, depois anotada) · qualidade da execução · certeza da identificação **com rótulo explícito** (ex.: “certeza de que era batida”, nunca “manobra bem feita”) · o que vi · como melhorar
4. Bloco **Leitura da seção**
5. Resumo técnico (cita as fases)
6. Pontos fortes / melhorias / prioridades

Enquanto a foto anotada não chegou: foto original + estado curto **“Preparando o visual do ajuste”**. Se falhar: some o estado e fica o original. **Sem spinner eterno.**

Foto e link: tela de resultado **atual**, sem timeline.

### Crédito, reanálise e privacidade

- **1 crédito** = visão da onda + até 3 edições de coaching.
- Reanálise: 1 crédito; gera fases novas e pode gerar fotos anotadas novas. Arquivos da análise anterior permanecem até exclusão de conta (ou limpeza futura).
- Exclusão de conta apaga as fotos da session **e** as fotos anotadas de coaching do surfista.
- Acesso só do dono; nome dos arquivos gerado no servidor.

### Segurança (produto)

- Saída da IA (texto e imagem) tratada como não confiável: validar antes de persistir ou mostrar.
- Sem segundo débito por falha de coaching.
- Sem confiar no aparelho para autorização: sessão + dono da mídia.

---

## Caminho feliz

1. Surfista autenticado, com crédito, envia um **vídeo novo** de session (arquivo no aparelho).
2. O app extrai até **8 fotos** da session (ou ≥ 2 no mobile) e inicia a análise (**1 crédito**).
3. A análise fica **pronta** com a **timeline da onda**: várias fases na ordem da ride, cada uma com a foto da evidência, qualidade, certeza da identificação rotulada, “o que vi” e “como melhorar” concreto quando a execução não foi boa.
4. O bloco **Leitura da seção** explica o que a onda fez e a alternativa (emendar / abortar).
5. Resumo e prioridades citam o conjunto das fases, não só a primeira.
6. Em até 3 fases que pedem ajuste, aparece o estado curto “Preparando o visual do ajuste”; em seguida o card troca a foto original pela **foto anotada** com o rótulo “Ajuste sugerido neste instante”.
7. O surfista entende o ajuste **na foto dele**, sem segundo crédito e sem a tela travar esperando o visual.

---

## Erros e bordas

| Situação | Comportamento esperado |
|----------|------------------------|
| Mobile extrai só 2–7 fotos | Aceita (≥ 2); timeline usa as fotos existentes; não exige 8 |
| IA devolve fase sem foto correspondente | Fase descartada ou marcada com certeza baixa; não inventar instante |
| Batida/manobra falhou | Qualidade `falhou` (ou `regular`); copy **não** elogia a execução |
| Certeza alta na identificação | Rótulo de **identificação**, nunca “você fez bem” |
| Drop em point lento | Não cobra agressividade irreal; desacelerar no face pode aparecer como leitura correta |
| 2ª manobra abortada | Entra em leitura de seção, não só “inconsistência” |
| Fase boa | “Como melhorar” pode ser reforço curto; obrigatório em regular/falhou |
| Foto anotada atrasada | Timeline já visível; estado curto no card; depois troca a foto |
| Edição de coaching falha / estoura tempo | Some o estado de preparo; fica a foto original + texto; **sem** crédito extra ou estorno |
| Nenhuma fase regular/falhou com evidência | Zero fotos anotadas; timeline textual completa |
| Análise antiga (sem fases) | Tela atual (score, resumo, manobra observada); sem timeline vazia |
| Foto de sessão | Fluxo e tela atuais |
| Link | Fluxo e tela atuais (coach não assistiu ao vídeo) |
| Sem créditos | Paywall já existente; não inicia extração/análise |
| Reanálise | 1 crédito; fases e coachings novos; não reenvia foto anotada antiga para a IA |
| Exclusão de conta | Remove fotos da session e fotos anotadas de coaching |
| Surfista minúsculo no quadro | Foto anotada pode ser inútil; o gabarito decide se o visual segue; texto permanece |

---

## Critérios de Done

- [ ] Vídeo novo extrai até **8** fotos da session; mobile ainda aceita **≥ 2**
- [ ] Resultado em **fases na ordem da onda**, cada uma com foto da evidência e “como melhorar” concreto quando a execução não foi boa
- [ ] Certeza da identificação **não** se apresenta como “manobra bem feita”
- [ ] Drop relativo ao tipo de onda; **não** usa “mais agressivo” como dica padrão nos dois mares
- [ ] Manobra falhada **não** é elogiada
- [ ] Até **3** fotos anotadas (“Ajuste sugerido neste instante”) nas fases que pedem ajuste; fallback na foto original se a edição falhar
- [ ] Análise textual visível **antes** do visual; sem spinner eterno
- [ ] Foto, link e análises antigas (sem fases) continuam renderizando
- [ ] **1 crédito**; falha de coaching não estorna nem cobra extra
- [ ] Exclusão de conta apaga fotos da session **e** coachings
- [ ] Gabarito dos 2 vídeos documentado (point lento + beach break) — ver notas
- [ ] Checklist aplicável de `docs/SECURITY.md` (upload, RLS, saída de IA, exclusão)
- [ ] `npm run typecheck` · `npm run lint` · `npm test` verdes
- [ ] Docs vivos: `docs/implementation/` + `docs/manual-dev/` + `docs/state/PENDENCIAS.md` (skill `close-phase`)

---

## Escopo de arquivos permitido

| Área | Paths / globs |
|------|----------------|
| Spec | `specs/2026-09-14-analise-onda-completa.md` |
| IA *(crítico)* | `lib/ai/performance-prompt.ts`, `lib/ai/performance-parser.ts`, `lib/ai/analyze-performance.ts`, `lib/ai/client.ts`, `lib/ai/usage-log.ts`, `lib/ai/cost-baseline.ts`, módulo novo de edição de imagem em `lib/ai/` |
| Domínio *(crítico)* | `lib/domain/types.ts`, `lib/domain/analysis-display.ts` |
| Mídia | `lib/media/video-frame-sampling.ts`, `lib/media/extract-video-frames-browser.ts`, `lib/media/storage-path.ts` |
| Actions / services | `actions/analysis-actions.ts`, `services/analysis-service.ts`, `services/media-service.ts`, `services/account-privacy-service.ts` |
| UI | `components/performance-analysis/performance-result-view.tsx`, possível `wave-phase-timeline.tsx` / `wave-phase-card.tsx` (e afins) em `components/performance-analysis/` |
| Testes | `lib/__tests__/security-and-parsers.test.ts`, `lib/media/__tests__/` ou `video-frame-sampling.test.ts`, testes do contrato de fases e do path de coaching |
| Docs vivos | `docs/implementation/**`, `docs/manual-dev/**`, `docs/state/PENDENCIAS.md`, índices README |

**Não alterar nesta feature (salvo aprovação extra):** billing, auth, Mercado Pago, prancha, Match, `middleware.ts`, `lib/supabase/**` (clients), schema/migrations, PRD, `.env*`.

Paths críticos (`lib/ai/**`, `lib/domain/**`): Spec **aprovada** + review humano do diff.

---

## Notas / decisões abertas

### Ordem de implementação (mesmo ciclo, após esta Spec aprovada)

1. **Onda em fases + 8 fotos** — prompt, validação da saída, tipos, extração, timeline com foto original + dicas. Foto/link intocados. Entrega valor sozinha.
2. **Coaching visual** — editar até 3 fotos reais depois do resultado pronto; UI troca o frame; registro de uso; exclusão de conta; fallback.
3. **Gabarito (homologação, não código extra)** — os 2 vídeos do especialista:
   - [ ] Point: drop **não** cobra agressividade irreal; desacelerar no face pode aparecer como leitura correta
   - [ ] Beach: batida errada = falhou (ou regular), não “bem executada”
   - [ ] 2ª manobra abortada = leitura de seção, não só “inconsistência”
   - [ ] Timeline cobre drop, bottom turn e manobras visíveis (não só a primeira)
   - [ ] Foto anotada aponta o ajuste no instante certo (se não apontar, registrar e decidir se o visual segue)

### Persistência das fotos anotadas

O plano **não** pede migration: o caminho da foto anotada vive no resultado estruturado da análise (já flexível). Se o owner preferir uma lista explícita no cadastro da análise (apagar arquivos com menos leitura do resultado), isso é **migration à parte**, com aprovação explícita.

**Padrão desta Spec:** sem migration.

### Modelo de visão

Permanece o atual. Só reavaliar modelo maior se, **depois** do gabarito, a IA ainda elogiar manobra falhada.

### Visual de coaching que erra o traço

Desligar só o passo de foto anotada **sem** derrubar a timeline textual.

Nenhuma decisão 1–7 do plano (14/09/2026) permanece aberta.

---

## Aprovação

- [ ] Spec aprovada para implementação (assinatura / data do responsável)
