# Spec: Análise de vídeo por frames, sem armazenar o original

| Campo | Valor |
|-------|--------|
| **Status** | `draft` |
| **Autonomia** | `tight` (storage, schema `media_items`, upload de mídia) |
| **Data** | 2026-09-02 |
| **Owner** | Ivan Martins (ModernXLab) |
| **Refs** | [Plano aprovado](../docs/plans/2026-09-02-analise-video-frames-sem-armazenar-original.md) · [PLANOS_E_LIMITES.md](../docs/PLANOS_E_LIMITES.md) · [SECURITY.md — Upload](../docs/SECURITY.md) · [DESIGN_SYSTEM.md §11](../docs/DESIGN_SYSTEM.md) |

---

## Problema

Surfistas com vídeos de câmera (iPhone, GoPro) precisam **comprimir o arquivo** para enviar a análise. O teto de **50 MB** existe porque o app sobe o vídeo inteiro para o Storage no plano Free — e a IA **não usa** esse arquivo: ela recebe só algumas fotos extraídas no aparelho. O vídeo guardado também não aparece na tela de resultado e não sustenta reanálise em produção.

A fricção é de infra, não de qualidade da análise.

## Objetivo

O surfista analisa a session **sem enviar o vídeo original**. O arquivo pesado fica no aparelho. A nuvem guarda **somente as fotos da session** (os mesmos frames que a IA viu). Arquivos típicos **acima de 50 MB** passam a ser aceitos, dentro de tetos de duração e de peso no dispositivo.

Reanálise de análises **novas** funciona relendo essas fotos. Vídeos **já** no Storage **não** são migrados.

## Fora de escopo

- Guardar o MP4/MOV original na nuvem
- Upgrade de plano do Storage ou outro provedor (R2, Stream, S3)
- Player do vídeo original
- Compressão no cliente
- Mudar quantidade de frames, prompt ou modelo de IA
- Foto de sessão, prancha mágica e análise por link (comportamento atual)
- Migrar ou apagar vídeos já armazenados
- Duração diferente por plano comercial (Grátis 60 s / Pro 3 min) — nesta entrega o teto técnico é único (90 s)
- Nova dependência npm

---

## Regras de domínio

### Vídeo novo — o original não vai para a nuvem

- O surfista escolhe o vídeo **no aparelho**.
- O app lê o arquivo localmente, tira de **2 a 6 fotos** em momentos distribuídos da session e envia **só essas fotos**.
- O arquivo de vídeo **não** é armazenado. Não há cópia do original no Storage.

### O que fica guardado (evidência visual)

- As fotos da session são persistidas de forma privada, no espaço do próprio surfista.
- Cada análise nova de vídeo tem a lista dessas fotos (caminhos internos), não o vídeo.
- A tela de resultado **mostra as miniaturas** das fotos usadas na análise (não um player do original).
- Copy visível: o vídeo não é enviado; usamos algumas fotos da session.

### Limites no aparelho (substituem o teto de 50 MB do Storage)

| Limite | Valor | Mensagem (causa + correção) |
|--------|-------|------------------------------|
| Tamanho do arquivo local | **500 MB** | *Vídeo acima de 500 MB. Este aparelho pode não conseguir ler um arquivo tão grande. Use um trecho mais curto ou envie um link.* |
| Duração | **90 segundos** | *Vídeo acima de 90 segundos. Envie um trecho mais curto ou use um link.* |
| Formato | MP4, MOV ou WebM | *Formato não suportado. Use MP4, MOV ou WebM.* (já existente) |

- Foto de sessão e foto de prancha: **10 MB**, inalteradas.
- A duração é lida no aparelho depois de abrir o vídeo; arquivo acima de 500 MB é recusado **antes** de tentar extrair as fotos.

### Dropzone (copy)

- Hint de formatos: *MP4, MOV, WebM — até 90 s e 500 MB.*
- Microcopy: *O vídeo fica no seu aparelho. Enviamos só algumas fotos da session para a análise.*
- Estados de progresso: **lendo o vídeo** → **extraindo fotos** → **analisando**. Não há passo “enviando o vídeo”.

### Reanálise

- Análises **novas** (com fotos da session guardadas): reprocessar usa essas fotos; consome 1 crédito se bem-sucedida (regra já existente).
- Análises **antigas** (vídeo original no Storage, sem fotos guardadas): **não migrar**. Reanálise falha com mensagem clara:
  - *Esta análise antiga não tem as fotos da session guardadas. Envie o vídeo de novo para analisar.*

### Foto, prancha e link

- Foto de sessão: continua no Storage; preview na tela de resultado inalterado.
- Prancha: inalterado.
- Link: a IA continua sem assistir o vídeo externo; inalterado.

### Privacidade

- Excluir conta remove as fotos da session do Storage (além do que já se remove hoje).
- Exportar dados inclui a referência a essas fotos, no mesmo espírito dos paths atuais.
- Acesso só do dono; nome dos arquivos gerado pelo servidor, nunca o nome original do cliente.

### Segurança

- Validar no servidor tipo, quantidade e tamanho das **fotos** enviadas (não o peso do MP4, que não chega).
- 2 a 6 fotos JPEG; cada uma dentro do teto já usado na action.
- Sem confiar no cliente para autorização: sessão + dono do item de mídia.
- Saída da IA continua tratada como não confiável (parser existente).

---

## Caminho feliz

1. Surfista autenticado, com crédito, abre nova análise de performance e escolhe a aba de **arquivo de vídeo**.
2. Lê que o vídeo fica no aparelho e que só fotos da session vão para a nuvem.
3. Seleciona um MP4/MOV/WebM **maior que 50 MB**, com duração **≤ 90 s** e tamanho **≤ 500 MB**.
4. O app aceita o arquivo (não pede para comprimir por 50 MB).
5. Vê progresso de leitura e extração das fotos, depois análise.
6. Recebe o resultado na tela da análise, com **miniaturas das fotos** usadas.
7. No Storage do projeto **não** existe o vídeo original; existem só as fotos da session.
8. Opcional: confirma reanálise → novo resultado a partir das mesmas fotos → 1 crédito debitado se sucesso.

---

## Erros e bordas

| Situação | Comportamento esperado |
|----------|------------------------|
| Arquivo > 500 MB | Recusa na seleção; mensagem de tamanho + trecho mais curto ou link |
| Duração > 90 s | Recusa após ler o vídeo (antes ou durante a extração); mensagem de duração + trecho mais curto ou link |
| Formato inválido | Mensagem de formato (já existente) |
| Arquivo vazio | Mensagem já existente |
| Aparelho não extrai fotos suficientes | Mensagem já existente (vídeo mais curto, tentar de novo ou link); **não** sobe o original como plano B |
| Sem créditos | Paywall já existente; não inicia extração/análise |
| Falha ao gravar as fotos | Erro com causa + tentar de novo; item de mídia não fica “pronto” sem fotos |
| Falha na IA após fotos gravadas | Estado de erro da análise; fotos podem permanecer para retry se o fluxo de crédito/erro de sistema já permitir |
| Reanálise de item novo | Usa as fotos guardadas |
| Reanálise de item legado (só vídeo antigo, sem fotos) | Mensagem de análise antiga; não tenta baixar o MP4 em produção |
| Foto de sessão | Fluxo atual (upload + preview) |
| Link | Fluxo atual |
| Exclusão de conta | Remove fotos da session e demais arquivos do usuário |
| Vídeo ≤ 50 MB e ≤ 90 s | Continua válido (regressão: ainda analisa) |
| Usuário espera player do original | Miniaturas + copy; sem player nesta entrega |

---

## Critérios de Done

- [ ] Vídeo novo **não** é armazenado; só as fotos da session
- [ ] Arquivo típico **> 50 MB** (≤ 500 MB e ≤ 90 s) completa a análise sem pedir compressão por Storage
- [ ] Dropzone: copy de 90 s / 500 MB e microcopy de que o original não é enviado
- [ ] Progresso sem “enviando o vídeo”
- [ ] Tela da análise mostra miniaturas das fotos (Design System: conteúdo do usuário primeiro, alvos ≥ 44px, tokens semânticos)
- [ ] Reanálise de item novo usa as fotos persistidas
- [ ] Reanálise de legado: mensagem de análise antiga, sem migração
- [ ] Foto, prancha e link sem regressão
- [ ] Exclusão de conta remove as fotos da session
- [ ] Migration da lista de fotos (`frame_paths`) aplicada com aprovação de schema
- [ ] Testes cobrindo limites (500 MB, 90 s), paths das fotos e mensagem de legado
- [ ] Checklist aplicável de `docs/SECURITY.md` (upload, RLS, validação Zod, exclusão)
- [ ] Homologação manual: vídeo > 50 MB no aparelho; conferir bucket sem MP4
- [ ] `npm run typecheck` · `npm run lint` · `npm test` verdes
- [ ] Docs vivos: `docs/implementation/` + `docs/manual-dev/` + `docs/state/PENDENCIAS.md` + atualizar teto em `docs/PLANOS_E_LIMITES.md` (skill `close-phase`)

---

## Escopo de arquivos permitido

| Área | Paths / globs |
|------|----------------|
| Spec | `specs/2026-09-02-analise-video-frames-sem-armazenar-original.md` |
| Migration | `supabase/migrations/013_media_frame_paths.sql` *(crítico)* |
| Domínio | `lib/domain/types.ts` *(crítico — só campo `frame_paths` em `MediaItem`)* |
| Limites / paths / extração | `lib/media/upload-limits.ts`, `lib/media/storage-path.ts`, `lib/media/extract-video-frames-browser.ts` *(duração)*, `lib/media/upload-client.ts` *(deixar de usar para MP4 de análise)* |
| Actions / services | `actions/analysis-actions.ts`, `services/media-service.ts`, `services/analysis-service.ts`, `services/account-privacy-service.ts` |
| UI análise | `components/performance-analysis/new-analysis-form.tsx`, `media-file-dropzone.tsx`, `analysis-media-header.tsx` |
| Testes | `lib/__tests__/security-and-parsers.test.ts` e testes novos de path/limites/legado |
| Docs vivos | `docs/implementation/**`, `docs/manual-dev/**`, `docs/state/PENDENCIAS.md`, `docs/PLANOS_E_LIMITES.md`, índices README |

**Não alterar nesta feature (salvo aprovação extra):** `lib/ai/**` (prompts/modelo), `lib/supabase/**` (clients), `middleware.ts`, billing, prancha, auth, PRD, `next.config.ts` (salvo se o body da action de frames exigir ajuste, improvável).

Paths críticos: storage, schema, domínio — Spec aprovada + review humano do diff.

---

## Notas / decisões abertas

1. **Duração por plano:** teto único de 90 s nesta entrega. Grátis 60 s / Pro 3 min fica para quando créditos diferenciarem duração.
2. **Botão de reanálise no legado:** esta Spec exige mensagem clara; esconder o botão é opcional se a UI já tiver um único CTA de retry — preferir mensagem a esconder, para o surfista entender.
3. **`createAnalysisFromFileAction`:** caminho legado que sobe o `File` pelo servidor. Vídeo nesse atalho deve ser recusado ou redirecionado ao fluxo de frames; foto pode permanecer.
4. **Schema:** coluna `frame_paths text[] not null default '{}'` — owner confirma no `db:push` após implementação.

Nenhuma decisão D1–D5 permanece aberta (owner 02/09/2026).

---

## Aprovação

- [ ] Spec aprovada para implementação (assinatura / data do responsável)
