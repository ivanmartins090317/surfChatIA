# Bug — Extração de frames de vídeo falhava no mobile (iOS e Android)

> **Status:** ✅ Corrigido — aguardando validação manual em dispositivo real (ver checklist em [Validação](#validação))
> **Severidade:** Alta — bloqueava a maior parte das análises por upload de vídeo (aba **Arquivo**) em celulares
> **Módulo:** Análise de performance → upload de arquivo (vídeo)

---

## Sintoma

Na tela `/analyses/new`, aba **Arquivo**, ao enviar um vídeo pelo **celular** (iOS ou Android, na mesma rede Wi-Fi que funcionava normalmente no desktop), a análise falhava com um de dois erros:

```
Tempo esgotado ao extrair frames do vídeo.
```

ou

```
Falha no upload. Verifique sua conexão e tente novamente.
```

O arquivo era aceito normalmente pela validação (formato/tamanho corretos, ex.: `MVI_2245.mp4`, 26,1 MB). O mesmo fluxo funcionava sem problema no **desktop/web**, e as abas **Imagem** e **Link** nunca apresentavam o erro — só a aba **Arquivo** com vídeo.

---

## Contexto

A extração de frames de vídeo é 100% **client-side** desde a correção registrada em [`docs/state/fixed_tasks/2026-07-14-csp-bloqueia-extracao-video-navegador.md`](../state/fixed_tasks/2026-07-14-csp-bloqueia-extracao-video-navegador.md) — o `ffmpeg-static` não é confiável em funções serverless da Vercel, então o navegador do usuário decodifica o vídeo (`lib/media/extract-video-frames-browser.ts`), tira 6 amostras (`VIDEO_FRAME_COUNT`) em pontos distribuídos da duração e envia os JPEGs em base64 para a IA.

Isso explica por que só a aba **Arquivo (vídeo)** é afetada: é o único fluxo que depende de decodificar vídeo com `<video>` + `<canvas>` no próprio dispositivo do usuário. Imagem só faz upload direto; link é resolvido inteiramente no servidor.

---

## Causa raiz

O fluxo antigo tinha vários pontos frágeis que o desktop tolera, mas o decoder de vídeo mobile (Safari iOS e Chrome/WebView Android) não:

1. **`<video>` nunca era anexado ao DOM** — criado só em memória (`document.createElement("video")` sem `appendChild`). iOS Safari é conhecido por decodificar/buscar (`seek`) `blob:` de forma pouco confiável quando o elemento não está inserido no documento.
2. **Só aguardava `loadedmetadata`** antes de começar a buscar frames — no mobile isso não garante que exista dado decodificável suficiente para o primeiro `seek`.
3. **Timeout de seek fixo em 15s, sem retry** — vídeos de câmera (como `MVI_*.mp4`) costumam ter o `moov atom` no fim do arquivo e keyframes distantes; buscar (`currentTime = X`) um ponto arbitrário pode levar bem mais que 15s em hardware mobile, e uma única falha de seek abortava a extração inteira.
4. **Ordem do fluxo**: upload para o Storage acontecia **antes** da extração de frames. Se a extração falhasse depois, o usuário já tinha gasto tempo e dados subindo ~26 MB para nada — o que também explica o erro genérico de "conexão", já que o upload grande em Wi-Fi/4G instável do celular é mais propenso a falhar do que no desktop.
5. **Contrato rígido de frames**: o servidor exigia exatamente `VIDEO_FRAME_COUNT` (6) frames (`z.array(videoFrameSchema).length(VIDEO_FRAME_COUNT)`), então não havia como degradar graciosamente se 1 ou 2 dos 6 seeks falhassem — bastava uma falha isolada para a análise inteira não sair.

Nenhum desses pontos é bug de formato ou de rede em si — é a **decodificação de vídeo no navegador do celular** sendo mais lenta e menos previsível que no desktop, mal tolerada pelo código original.

---

## Correção

### 1. Extrator client-side mais resiliente

`lib/media/extract-video-frames-browser.ts` foi reescrito com:

- **Elemento `<video>` anexado ao DOM** (oculto via `opacity: 0`, `1px×1px`, `pointer-events: none`) em vez de existir só em memória:

```39:46:lib/media/extract-video-frames-browser.ts
function attachHiddenVideoElement(video: HTMLVideoElement): void {
  video.style.position = "fixed";
  video.style.width = "1px";
  video.style.height = "1px";
  video.style.opacity = "0";
  video.style.pointerEvents = "none";
  document.body.appendChild(video);
}
```

- **Timeout também no carregamento de metadados** (20s) e **espera por `loadeddata`** (não só `loadedmetadata`) antes do primeiro seek, com checagem de `readyState` para não esperar um evento que já disparou:

```48:88:lib/media/extract-video-frames-browser.ts
const READY_STATE_BY_EVENT = {
  loadedmetadata: 1, // HAVE_METADATA
  loadeddata: 2, // HAVE_CURRENT_DATA
} as const;

function waitForEvent(
  video: HTMLVideoElement,
  eventName: "loadedmetadata" | "loadeddata",
  timeoutMs: number,
  timeoutMessage: string,
): Promise<void> {
  if (video.readyState >= READY_STATE_BY_EVENT[eventName]) {
    return Promise.resolve();
  }
  // ...timeout + listeners de "error"...
}
```

- **Timeout de seek aumentado de 15s → 20s, com 1 retry automático** por frame antes de desistir dele:

```115:129:lib/media/extract-video-frames-browser.ts
async function seekVideoTo(
  video: HTMLVideoElement,
  seconds: number,
): Promise<void> {
  for (let attempt = 0; attempt <= SEEK_RETRY_COUNT; attempt += 1) {
    try {
      await seekVideoToOnce(video, seconds);
      return;
    } catch (error) {
      if (attempt === SEEK_RETRY_COUNT) {
        throw error;
      }
    }
  }
}
```

- **Sucesso parcial tolerado**: se um frame específico falhar mesmo após o retry, a extração segue para os próximos em vez de abortar tudo. Só lança erro se restarem menos que `MIN_VIDEO_FRAMES` (novo — ver item 3):

```163:185:lib/media/extract-video-frames-browser.ts
async function captureFramesAtTimestamps(
  video: HTMLVideoElement,
  timestamps: number[],
  onProgress?: ExtractVideoFramesOptions["onProgress"],
): Promise<ClientVideoFrame[]> {
  const frames: ClientVideoFrame[] = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const seconds = timestamps[index];
    onProgress?.({ current: index + 1, total: timestamps.length });

    try {
      await seekVideoTo(video, seconds);
      frames.push(captureFrame(video, seconds));
    } catch {
      // Falha isolada em um frame não invalida a extração inteira — o
      // dispositivo móvel pode falhar o seek em um ponto específico do
      // vídeo (ex.: distância grande do keyframe anterior).
    }
  }

  return frames;
}
```

- **Callback de progresso** (`onProgress`) para a UI informar o que está acontecendo em vez de deixar o usuário sem feedback durante uma operação potencialmente longa.

### 2. Contrato flexível de quantidade de frames

Nova constante `MIN_VIDEO_FRAMES = 2` em `lib/media/video-frame-sampling.ts`, documentando a evidência visual mínima aceitável:

```9:14:lib/media/video-frame-sampling.ts
/**
 * Quantidade mínima de frames aceita quando a extração no navegador falha
 * parcialmente (comum em dispositivos móveis com seek de vídeo mais lento).
 * Abaixo disso a evidência visual é considerada insuficiente para análise.
 */
export const MIN_VIDEO_FRAMES = 2;
```

A validação em `actions/analysis-actions.ts` foi relaxada de um tamanho exato para um intervalo:

```110:114:actions/analysis-actions.ts
const frames = z
  .array(videoFrameSchema)
  .min(MIN_VIDEO_FRAMES)
  .max(VIDEO_FRAME_COUNT)
  .parse(input.video_frames);
```

A camada de IA (`lib/ai/client.ts`, `chatJsonCompletionWithVision`) já aceita qualquer quantidade de imagens ≥ 1, então nenhuma mudança foi necessária ali.

### 3. Extrair frames antes de subir o arquivo

`components/performance-analysis/new-analysis-form.tsx` teve o fluxo reordenado: a extração de frames agora acontece **antes** do upload para o Storage. Se o dispositivo não conseguir decodificar o vídeo, o usuário não perde tempo e dados de rede subindo o arquivo à toa. O botão também passou a mostrar o progresso real de cada etapa:

```44:69:components/performance-analysis/new-analysis-form.tsx
async function extractFramesWithProgress(file: File) {
  setProgressLabel("Lendo o vídeo no dispositivo…");
  return extractVideoFramesInBrowser(file, {
    onProgress: ({ current, total }) =>
      setProgressLabel(`Extraindo frame ${current} de ${total}…`),
  });
}

function submitFile(type: "video" | "image") {
  // ...
  startTransition(async () => {
    try {
      // Extrai os frames antes de subir o arquivo: se o dispositivo não
      // conseguir decodificar o vídeo, evitamos gastar tempo e dados do
      // usuário com um upload que seria descartado depois.
      const videoFrames =
        type === "video" ? await extractFramesWithProgress(file) : undefined;

      setProgressLabel("Enviando arquivo…");
      const initResult = await initAnalysisFileUploadAction({ /* ... */ });
      // ...
```

Textos exibidos durante o processamento: "Lendo o vídeo no dispositivo…" → "Extraindo frame N de 6…" → "Enviando arquivo…" → "Processando análise…", em vez do genérico "Analisando…" que dava a impressão de travamento.

---

## Validação

- [x] `npm run typecheck` — sem erros
- [x] `npm run lint` — sem erros
- [x] `npm run test` — suíte completa (44 testes) passando, incluindo novo teste para `MIN_VIDEO_FRAMES`
- [ ] Reprodução manual em iPhone (Safari) com o vídeo que gerou o erro original
- [ ] Reprodução manual em Android (Chrome) com o mesmo vídeo
- [ ] Confirmar que os textos de progresso aparecem corretamente durante o processamento

---

## Limitações conhecidas / próximos passos

- A correção reduz drasticamente a chance de falha, mas não elimina o limite físico de decodificação de vídeo em aparelhos muito antigos ou com pouca memória. Se falhas recorrentes persistirem nesse cenário, considerar um **fallback server-side** (fila assíncrona com `ffmpeg` fora da Vercel serverless, ex. Railway/Fly.io) para reprocessar quando a extração client-side falhar completamente.
- Avaliar a API `WebCodecs` (onde disponível) como alternativa mais previsível a `seek` + `<canvas>` no Safari, caso o problema volte a se manifestar.
- Mensagem de erro de upload (`lib/media/upload-client.ts`) ainda é genérica ("Verifique sua conexão"); útil no futuro mostrar causa mais específica (timeout vs. erro do Supabase) para diagnóstico mais rápido.

---

## Referências

- `lib/media/extract-video-frames-browser.ts` — extração de frames client-side (reescrito)
- `lib/media/video-frame-sampling.ts` — constantes `VIDEO_FRAME_COUNT` e `MIN_VIDEO_FRAMES`
- `actions/analysis-actions.ts` — validação de `video_frames` em `completeAnalysisFileUploadAction`
- `components/performance-analysis/new-analysis-form.tsx` — orquestração do fluxo de upload + extração
- `lib/__tests__/video-frame-sampling.test.ts` — teste de `MIN_VIDEO_FRAMES`
- [`docs/state/fixed_tasks/2026-07-14-csp-bloqueia-extracao-video-navegador.md`](../state/fixed_tasks/2026-07-14-csp-bloqueia-extracao-video-navegador.md) — bug anterior relacionado (CSP bloqueando `blob:` em produção)
