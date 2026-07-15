# Bug — CSP bloqueava extração de frames de vídeo no navegador (produção Vercel)

> **Status:** ✅ Corrigido e validado em produção (14/07/2026)
> **Severidade:** Alta — bloqueava 100% das análises por upload de vídeo em produção
> **Commit:** `ea7af95` — `fix(security): libera media-src blob: no CSP para extracao de frames no navegador`

---

## Sintoma

Ao tentar analisar um vídeo em `/analyses/new` (aba **Arquivo**) na Vercel, o upload concluía mas a análise falhava com:

```
Não foi possível ler o vídeo no navegador.
```

O mesmo fluxo com **imagem** funcionava normalmente. O erro só se manifestava em produção (Vercel), não era percebido em testes anteriores locais.

---

## Contexto

O commit anterior `a138dcb` (`fix(media): extract video frames in browser for Vercel serverless`) migrou a extração de frames de vídeo de **ffmpeg no servidor** para **extração client-side**, porque o binário `ffmpeg-static` não é confiável em funções serverless da Vercel (`ENOENT`, bundle pesado, cold start).

A nova extração (`lib/media/extract-video-frames-browser.ts`) cria um elemento `<video>` no navegador e aponta `video.src` para uma URL `blob:` gerada com `URL.createObjectURL(file)`, depois desenha frames em `<canvas>` para gerar os 3 JPEGs enviados à IA.

---

## Causa raiz

O `Content-Security-Policy` definido em `next.config.ts` **não tinha a diretiva `media-src`**. Sem essa diretiva, o navegador aplica o fallback `default-src 'self'` para elementos `<video>`/`<audio>` — que **não permite `blob:`**.

Resultado: assim que `video.src = blob:...` era atribuído, o navegador recusava carregar o recurso por violação de CSP e disparava o evento `error` do `<video>`, que o código tratava como:

```12:24:lib/media/extract-video-frames-browser.ts
function loadVideoMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => {
      reject(new Error("Não foi possível ler o vídeo no navegador."));
    };
  });
}
```

A diretiva `img-src` já incluía `blob:` (por isso a pré-visualização de **imagem** funcionava), mas o equivalente para `<video>` (`media-src`) nunca tinha sido adicionado — a lacuna passou a importar só depois que o fluxo de vídeo virou 100% client-side.

Em produção na Vercel os headers de segurança são servidos de forma estrita, expondo o bug de forma consistente.

---

## Correção

Adicionada a diretiva `media-src 'self' blob:` ao CSP em `next.config.ts`:

```12:24:next.config.ts
value: [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://*.ingest.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; "),
```

O escopo permanece restrito (`'self' blob:`, sem abrir para origens externas), mantendo a postura de segurança do checklist `docs/SECURITY.md` §A05.

---

## Validação

- [x] `npm run typecheck` — sem erros
- [x] `npm run lint` — sem erros
- [x] Deploy na Vercel (push para `main` → redeploy automático)
- [x] Reprodução manual: análise de vídeo em produção concluída com sucesso (confirmado pelo usuário)

---

## Referências

- Commit da regressão: `a138dcb` — `fix(media): extract video frames in browser for Vercel serverless`
- Commit da correção: `ea7af95` — `fix(security): libera media-src blob: no CSP para extracao de frames no navegador`
- `next.config.ts` — configuração de headers de segurança
- `lib/media/extract-video-frames-browser.ts` — extração de frames client-side
- `docs/SECURITY.md` §A05 — Security Misconfiguration (headers/CSP)
- `docs/DEPLOY_VERCEL.md` — nota sobre limitação do ffmpeg em serverless
