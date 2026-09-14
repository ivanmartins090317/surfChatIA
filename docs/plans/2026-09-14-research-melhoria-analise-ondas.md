# Research — Melhoria da análise das ondas surfadas

| Campo | Valor |
|-------|--------|
| **Status** | Research fechada — plano em [2026-09-14-analise-onda-completa.md](./2026-09-14-analise-onda-completa.md) |
| **Data** | 2026-09-14 |
| **Autonomia** | `tight` (toca `lib/ai/**` e `lib/domain/**`) |
| **Origem** | Feedback de surfista/analista especializado em iniciantes, via Ivan |
| **Refs** | [Plano especialização IA](../implementation/2026-07-17-plano-especializacao-ia-performance.md) · [PENDENCIAS](../state/PENDENCIAS.md) · `lib/ai/performance-prompt.ts` · `lib/media/video-frame-sampling.ts` |

---

## 1. O que o feedback disse (traduzido para requisitos)

O produto foi elogiado (UX, cores, facilidade, frames). A dor está **só na inteligência**. Cinco temas recorrentes:

| # | Tema do especialista | Pedido em linguagem de produto |
|---|----------------------|--------------------------------|
| T1 | A IA pega só a primeira manobra e dá feedback total nela; o resto da onda vira menção vaga | Analisar a **onda completa**: cada momento alto, um por um |
| T2 | Drop “mais agressivo” em point lento **e** em beach break rápido — conselho genérico | Drop **relativo** ao tipo/cadência da onda; desacelerar para entrar no face pode ser correto |
| T3 | Resumo técnico pouco técnico; errou a batida e a IA tratou como acerto + “alta confiança” | Ser **mais crítico**; não elogiar manobra falhada; detalhe biomecânico (ângulo da prancha, joelhos, braço) |
| T4 | Tentou emendar 2ª manobra, abortou porque a onda mudou — IA só falou “faltou consistência” | Feedback de **leitura de seção**: o que fazer quando a onda muda / por que abortar foi (ou não) a jogada |
| T5 | Frames atuais não são os instantes ideais | Amostrar os **picos** da onda (todos), não 6 cortes uniformes nem só uma manobra |

Frase-síntese do especialista: *mais crítico + frames dos momentos mais altos + analisar cada um*.

---

## 2. O que o sistema faz hoje (causa raiz)

A análise de vídeo **não assiste a onda**. O navegador extrai **2–6 JPEGs em timestamps uniformes**, o original **não sobe**, e a IA recebe o lote de uma vez.

Contrato de saída: **uma** `manobra_observada` + `confianca_manobra` (certeza de *identificar o nome*, não de *executar bem*) + um único `resumo` / score holístico.

| Causa | Onde | Como gera o sintoma |
|-------|------|---------------------|
| Amostragem uniforme, sem detecção de pico | `lib/media/video-frame-sampling.ts` | Pode perder batida, 2ª manobra, drop real; captura “meio da linha” |
| Schema de **uma** manobra | `lib/domain/types.ts`, prompt, parser, UI | Mesmo com 6 frames, o modelo é obrigado a eleger “a mais relevante” |
| Prompt pede “fase mais relevante” | `performance-prompt.ts` linhas ~189–193 | Empurra o modelo a aprofundar só um momento |
| Tipo de onda entra como rótulo, sem regra de cadência | user prompt (`Onda da sessão`) | “Entrada mais agressiva” vira dica default |
| “Calibre ao nível do perfil” | rubrica de score | Tendência a ser gentil demais |
| Badge “alta confiança” verde | `performance-result-view.tsx` | Surfista lê como “você fez bem”, não “tenho certeza que era uma batida” |
| Sem conceito de seção / alternativa de linha | prompt | Abortar 2ª manobra vira “inconsistência”, não leitura |
| `gpt-4o-mini` + Fase A sem eval set | `client.ts`, plano 17/07 | Sem gabarito, não medimos se o modelo está elogiando erro |

A Fase A da especialização IA (taxonomia, 6 frames, confiança) **já está no código**. Este research **não substitui** aquele plano: ele redireciona o próximo investimento, porque o feedback novo mostra que o gargalo mudou de “errar o nome da manobra” para **“não cobrir a onda e não ser crítico o suficiente”**.

---

## 3. Hipótese de produto

A análise de vídeo deve se comportar como um coach que **quebra a onda em fases**, julga cada fase com evidência visual, e só depois fecha um resumo da ride.

Fases típicas (não todas precisam existir em todo vídeo):

1. Drop / entrada
2. Bottom turn
3. Linha / velocidade
4. Manobra 1 (batida, snap, cutback, …)
5. Transição / leitura de seção
6. Manobra 2 (ou aborto / wipeout / close-out)

Cada fase: o que aconteceu · se foi bem ou mal · o que ajustar (ângulo, peso, timing) · frame de evidência.

O Surf Score da sessão continua existindo, mas **deixa de ser o único lugar do julgamento**.

---

## 4. Direção técnica (ainda não implementação)

Três alavancas. Ordem importa: prompt/schema primeiro (barato), amostragem depois (médio), modelo maior só com evidência.

### 4.1 Contrato multi-fase (prompt + parser + UI)

Trocar `manobra_observada` singular por uma lista, por exemplo:

- `fases[]`: `{ nome, timestamp_frame, qualidade_execucao, confianca_identificacao, o_que_vi, o_que_ajustar }`
- `leitura_da_secao`: o que a onda fez e qual alternativa existia (emendar, abortar, reposicionar)
- `resumo` mais técnico, citando fases (não só a primeira)
- `confianca_identificacao` **separada** de qualidade — e a UI precisa rotular isso com clareza (“certeza de que era batida” ≠ “batida bem feita”)

Regra dura no prompt: **não elogiar execução se a manobra falhou** (ex.: batida sem conexão no lip, spray errado, prancha sem vertical). Confiança alta de identificação **não** autoriza nota alta de técnica.

Cadência de drop por tipo de onda (bloco de conhecimento no prompt, não inferência solta):

- Point / onda mais lenta: drop pode ser cadenciado; desacelerar para entrar no face **não é erro** se a linha seguinte está limpa.
- Beach break / seção rápida: drop mais comprometido, mas ainda relativo ao tamanho e à seção.
- Nunca usar “entrada mais agressiva” como dica padrão sem evidência **e** sem contextualizar a onda.

Detalhe biomecânico mínimo nas melhorias: direção da prancha (relógio: 12h, 10h…), flexão de joelhos, rail, braço de cima, olhar. Isso atende o “resumo ainda mais técnico”.

**Custo:** principalmente `lib/ai/` + `lib/domain/` + tela de resultado. Paths críticos. Sem migration se `result_json` continuar jsonb flexível (parser aceita formato novo; UI trata legado).

### 4.2 Amostragem pelos picos (não só uniforme)

Hoje: 6 cortes iguais na duração. O especialista pediu os **momentos mais altos**.

Opções, da mais barata à mais cara:

| Opção | Ideia | Prós | Contras |
|-------|--------|------|---------|
| A | Manter 6 frames, mas misturar uniforme + picos de movimento (diferença entre frames no canvas) | Cabe no fluxo atual (vídeo não sobe) | Pico de movimento ≠ pico de manobra (paddle também mexe) |
| B | Extrair mais candidatos (ex. 12–16) no browser, ranquear por movimento, enviar 6–8 à IA | Melhor cobertura sem explodir custo de visão | Extração mobile já é frágil (mínimo 2 frames hoje) |
| C | Enviar mais frames à IA (8–12) | Mais evidência para multi-fase | Custo e latência sobem; teto de 90 s / crédito continua 1 |
| D | Voltar a subir o MP4 e amostrar no servidor | Mais controle | Já saímos disso de propósito (storage, privacidade, custo) |

Recomendação de research: **A ou B no browser**, sem voltar a armazenar o original. Multi-fase (4.1) já aproveita melhor os 6 frames atuais; amostragem inteligente reduz o caso “a batida caiu entre dois cortes”.

### 4.3 Criticidade e modelo

O tom “mais crítico” é **prompt**, não troca de modelo. Só reavaliar `gpt-4o` / sucessor se, **depois** de 4.1 + eval informal nos dois vídeos do feedback, a IA ainda elogiar manobra falhada.

Isso alinha com a decisão de 17/07 (mini mantido até haver evidência).

---

## 5. Relação com o plano de especialização (17/07)

| Fase antiga | Status | Como este research entra |
|-------------|--------|---------------------------|
| A — prompt + 6 frames | Código pronto; validação manual pendente | Este feedback **é** essa validação. Conclusão: 6 frames uniformes + 1 manobra não bastam |
| B — eval set 20–30 casos | Não começou | Os dois vídeos (point + beach) viram os primeiros gabaritos; o especialista vira revisor |
| C — correções humanas | Não começou | Continua válido; não bloqueia 4.1 |
| D/E — RAG / fine-tune | Longe | Não iniciar agora |

**Não pular para fine-tuning.** O ganho imediato está no contrato da resposta e nas regras de onda/cadência.

---

## 6. Fora de escopo (neste ciclo)

- Assistir o MP4 inteiro na nuvem / fila assíncrona longa
- Análise frame-a-frame tipo pose estimation / tracking de joints
- Comparação lado a lado de sessões (PRD: fora do MVP)
- Módulo coach/shaper
- Mudar preço do crédito (1 análise = 1 crédito) sem medir custo novo de frames

---

## 7. Riscos

- **Custo de visão:** mais frames ou modelo maior comem margem (`docs/PLANOS_E_LIMITES.md`). Medir tokens antes de subir de 6.
- **Mobile:** extração já falha seeks; amostragem por movimento é mais pesada no aparelho.
- **Legado:** análises antigas com 1 manobra precisam continuar renderizando.
- **Iniciante vs avançado:** o feedback pede rigor de coach; o PRD também atende iniciante. Precisa decisão de tom por nível (ver perguntas).
- **Alucinação multi-fase:** pedir N manobras pode fazer o modelo inventar fases que não estão nos frames. Mitigação: só emitir fase com evidência no JPEG + confiança baixa quando inferir.

---

## 8. Fases de implementação propostas (após aprovação)

Ordem sugerida, cada uma com Spec própria se crescer:

1. **P0+P1 juntas (vídeo)** — timeline completa da onda + 8 frames + dicas didáticas concretas  
   - `VIDEO_FRAME_COUNT = 8` (mínimo mobile continua 2).  
   - Schema `fases[]` + `leitura_da_secao`.  
   - Cada fase no resultado: **o frame da evidência** + o que melhorar (olhar, bico, mão, joelhos).  
   - Cadência de drop relativa ao tipo de onda; não elogiar manobra falhada.  
   - Badge: “certeza da identificação”, não qualidade.  
   - Foto e link **fora**.  
   - Homologar nos 2 vídeos gabarito (point + beach).

2. **P2 — Frames nos picos**  
   Misturar uniforme + movimento no browser, ainda enviando no máximo 8 JPEGs à IA.

3. **P3 — Eval set mínimo**  
   Gabarito dos dois vídeos do especialista.

4. **P4 — Modelo maior (opcional)**  
   Só se a timeline ainda elogiar batida errada.

5. **P5 — Overlay SVG (nível B)**  
   Descartado neste ciclo: o owner escolheu C (editar o frame). Ver o plano.

Decisão de coaching visual (14/09, owner): **nível C**. Recorte operacional no plano — editar o JPEG real, não inventar outro surfista.

---

## 9. Coaching visual: dá para “riscar” o frame?

Pergunta do owner (14/09): enviar imagens para explicar como melhorar — seta de onde entrar na manobra, até onde ir no bottom turn.

**Resposta curta:** sim, dá para desenhar **em cima da foto que já extraímos**. Não precisamos (e não devemos) gerar uma foto nova com IA. O risco é a seta cair no lugar errado — e isso quebra mais confiança do que texto sem desenho.

Hoje a IA de visão **só devolve JSON**. Os frames já ficam no Storage e a tela só mostra a grade. Três níveis:

| Nível | O que o surfista vê | Precisão espacial | Custo | Quando |
|-------|---------------------|-------------------|-------|--------|
| **A — Frame da fase + texto** | Card da batida/bottom com **a foto daquele instante** e dica (“olhar pra frente”, “bico às 12h”, “mão da frente conduz o rail”) | Não precisa acertar pixel | Quase zero extra | **Este ciclo (P1)** |
| **B — Overlay SVG no frame dele** | Arco/seta/zona desenhados no JPEG (onde completar o BT, linha de entrada no lip) | A IA chuta coordenadas 0–1; em filme da praia o surfista é um ponto pequeno — o risco de seta errada é alto | Baixo (desenho no cliente) | **P5**, só com confiança alta e toggle “mostrar traço” |
| **C — IA gera uma imagem nova** (editar a foto / “ideal”) | Foto inventada ou “corrigida” | Alucina onda, corpo e prancha; caro; difícil validar com Zod | Alto | **Fora.** Não usar |

Recomendação original da research: A agora, B depois, C fora. **Owner (14/09) escolheu C neste ciclo.** Recorte operacional: [plano da onda completa](./2026-09-14-analise-onda-completa.md) — editar o frame real, máx. 3 imagens, fallback para A.

Mitigações se formos para B: coordenadas normalizadas (0–1) validadas no Zod; só desenhar se `confianca` alta; no máximo 1 overlay por fase; se o surfista ocupar pouco do quadro, não desenhar (ou só recorte, não arco de manobra); texto sempre junto do traço.

---

## 10. Decisões fechadas (owner, 14/09)

| # | Decisão |
|---|---------|
| 1 | Tom didático, mas “como melhorar” **concreto**: olhar, direção do bico, mão conduzindo a prancha, etc. |
| 2 | Timeline **completa** da onda (drop → BT → linha → manobras → abortos/seção). |
| 3 | Subir para **8 frames** por vídeo. |
| 4 | UI = **cards/timeline por fase**, cada uma com o frame da evidência. |
| 5 | Os 2 vídeos (point + beach) viram gabarito. |
| 6 | Escopo = **só análise de vídeo**. Foto e link não mudam neste ciclo. |
| Overlay | **Nível C neste ciclo**: editar o frame real com marcas de coach (não gerar surfista fictício). Fallback = frame original + texto. |

Plano de implementação: [2026-09-14-analise-onda-completa.md](./2026-09-14-analise-onda-completa.md).

---

## 11. Arquivos prováveis (quando houver Spec aprovada)

| Área | Paths |
|------|--------|
| IA | `lib/ai/performance-prompt.ts`, `lib/ai/performance-parser.ts` |
| Domínio | `lib/domain/types.ts` (crítico) |
| UI | `components/performance-analysis/performance-result-view.tsx` |
| Mídia (P2) | `lib/media/video-frame-sampling.ts`, `extract-video-frames-browser.ts` |
| Testes | `lib/__tests__/security-and-parsers.test.ts`, `video-frame-sampling.test.ts` |
| Docs vivos | implementation + manual-dev + PENDENCIAS |

Não mexer em billing, auth, storage de MP4, nem no fluxo de link (IA continua sem ver o vídeo).
