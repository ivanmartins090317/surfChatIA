# Fase · Análise da onda completa (vídeo)

| Status | Spec |
| --- | --- |
| implementado (código) · homologação gabarito pendente | [`specs/2026-09-14-analise-onda-completa.md`](../../specs/2026-09-14-analise-onda-completa.md) |

Registro objetivo: [`docs/implementation/2026-09-14-analise-onda-completa.md`](../implementation/2026-09-14-analise-onda-completa.md)

## O que esta fase entrega

- Análise de **vídeo novo** em **fases da ride** (drop → bottom turn → linha → manobras → seção)
- Até **8 fotos** da session (mínimo **2** no mobile)
- Cada fase: foto **original** da evidência, qualidade da execução, **certeza da identificação** rotulada, o que vi, como melhorar
- Bloco **Leitura da seção** (emendar / abortar)
- Foto, link e análises antigas (sem `fases`) continuam no layout anterior

Não entrega: pintura/edição da foto (passo visual **desligado** em 14/09 após homologação), overlay SVG no cliente, amostragem por pico de movimento, troca do modelo de visão, análise de foto/link em timeline, migration nova, mudança de preço do crédito.

## Fluxo principal (vídeo)

1. Surfista autenticado, com crédito, envia o vídeo no aparelho
2. App extrai até 8 JPEGs uniformes (ou ≥ 2 no mobile) e inicia a análise (**1 crédito**)
3. IA de visão devolve JSON da onda em fases; a tela mostra a timeline com a foto original + texto
4. Sem passo de edição de imagem: `WAVE_COACHING_VISUAL_ENABLED = false`

Reanálise: 1 crédito; fases novas; não gera foto anotada.

## Arquivos-chave

| Área | Caminhos |
| --- | --- |
| IA | `lib/ai/performance-prompt.ts`, `performance-parser.ts`, `wave-coaching.ts`, `edit-coaching-image.ts`, `client.ts` |
| Domínio | `lib/domain/types.ts`, `lib/domain/analysis-display.ts` |
| Services | `services/analysis-service.ts`, `services/wave-coaching-service.ts`, `services/account-privacy-service.ts` |
| UI | `components/performance-analysis/wave-phase-*.tsx`, `performance-result-view.tsx` |
| Testes | `lib/__tests__/wave-phase-coaching.test.ts` |

## Contas de teste / homologação (gabarito)

Usar os 2 vídeos do especialista. **Não marcar como feito** até rodar na UI.

| Cenário | Esperado |
| --- | --- |
| Point lento | Drop **não** cobra agressividade irreal; desacelerar no face pode aparecer como leitura correta |
| Beach break | Batida errada = `falhou` (ou regular), não “bem executada” |
| 2ª manobra abortada | Entra em **leitura de seção**, não só “inconsistência” |
| Timeline | Cobre drop, bottom turn e manobras visíveis (não só a primeira) |
| Foto anotada | **Desligada** (owner, 14/09): a timeline usa só a foto original + texto |
| Foto / link / análise antiga | Sem timeline vazia |
| Sem créditos | Paywall já existente |
| Exclusão de conta | Remove frames **e** coachings (legado) |

## Comandos

```bash
npm run test -- lib/__tests__/wave-phase-coaching.test.ts
npm run typecheck
npm run lint
npm test
```

## Próximo passo

Homologar os 2 vídeos gabarito · ver [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
