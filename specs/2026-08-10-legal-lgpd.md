# Spec: Legal / LGPD (Trilha C)

| Campo | Valor |
|-------|--------|
| **Status** | `done` |
| **Autonomia** | `medium` (auth, perfil e liberação de páginas públicas → review humano) |
| **Data** | 2026-08-10 |
| **Owner** | Ivan (aprova texto jurídico e esta Spec) |
| **Refs** | [PLANO_GO_LIVE_COBRANCA.md](../docs/state/PLANO_GO_LIVE_COBRANCA.md) Trilha C · [PENDENCIAS.md](../docs/state/PENDENCIAS.md) §5.1 · [PLANOS_E_LIMITES.md](../docs/PLANOS_E_LIMITES.md) · plano aprovado na conversa 10/08/2026 |

---

## Problema

O produto já trata dados do surfista (conta, perfil, vídeos e fotos de session, feedback de IA, créditos) e se prepara para cobrar, mas **não publica Termos, Privacidade nem Reembolso**, não pede aceite no cadastro e **não oferece canais claros** para o titular exercer direitos previstos na LGPD. Sem isso, o go-live comercial fica bloqueado.

## Objetivo

Disponibilizar os **três documentos legais** no produto, linká-los em **rodapé completo** (vitrine pública e área logada), exigir **aceite no cadastro**, informar sobre **cookies essenciais de sessão**, e permitir **exportar os próprios dados** e **excluir a conta** — com textos aprovados pelo owner (dados do responsável pelo tratamento em modelo editável depois).

## Fora de escopo

- Revisão por advogado externo (nesta entrega o owner aprova o texto)
- Ajuste da política de reembolso ao provedor de pagamento escolhido (fica genérica; revisa na trilha de pagamentos)
- Apagamento automático por prazo (a política declara retenção enquanto a conta existir)
- Cookies de marketing, analytics ou painel completo de consentimento
- Redesign ou copy de marketing da vitrine (além do rodapé e links legais)
- Cobrança real, assinatura ou área de faturamento
- Alterar planos, créditos ou regras de paywall já entregues

---

## Regras de domínio

### Documentos legais

Existem três páginas públicas, legíveis sem login, com texto embutido no produto:

1. **Termos de Uso** — uso pessoal; limites de créditos e uso justo alinhados aos números atuais do produto (plano grátis **2** créditos; Surfista **8** por mês; Pro **30** por mês; packs conforme comunicação de planos); responsabilidade da IA (orientação, não substitui coach ou profissional de saúde); conduta e encerramento de conta.
2. **Política de Privacidade** — o que é tratado (conta, perfil, mídia, análises, pranchas, feedback, histórico de créditos), para quê, bases legais em linguagem acessível, retenção **enquanto a conta existir**, quem ajuda a operar o serviço (hospedagem/auth, IA, monitoramento de erros; cobrança “a definir”), transferência internacional declarada de forma genérica, direitos do titular e canal de contato.
3. **Política de Reembolso** — regras genéricas para assinatura e packs, sem amarrar a um provedor específico; pode ser atualizada quando a cobrança real existir.

Identidade do **responsável pelo tratamento** (nome/razão social, documento, endereço, e-mail de contato) aparece como **modelo/placeholder**, para preencher depois com dados definitivos.

### Onde aparecem

- Visitante e surfista logado acessam as três páginas pelos mesmos endereços públicos.
- **Vitrine (`/`)** e **área logada** têm **rodapé completo**: marca, links úteis do produto (ex.: planos, perfil) e os três documentos legais — sem competir com o CTA principal das telas.

### Aceite no cadastro

- Ao criar conta, o surfista precisa **marcar aceite explícito** dos Termos e da Privacidade (com links para ler).
- Sem aceite, a conta **não é criada**; a mensagem indica o que falta.

### Cookies

- Aviso simples e dispensável informa o uso de **cookies essenciais de sessão** (manter o login).
- Não há cookies de marketing nesta entrega; o aviso não trava o uso do produto.

### Direitos do titular

| Direito | Nesta entrega |
|---------|----------------|
| Acesso / confirmação | Já pelo uso do app (perfil, análises, pranchas); a Privacidade descreve o canal |
| Correção | Já pela edição de perfil |
| Portabilidade | Surfista logado pode **baixar um pacote legível** com os dados que o produto guarda dele |
| Eliminação | Surfista logado pode **excluir a conta** após confirmação explícita; perde o acesso e os dados de produto associados; é irreversível do ponto de vista dele |
| Informação / oposição / revogação | Descritos na Privacidade + e-mail de contato (placeholder); oposição a marketing não se aplica no MVP |

### Confiança e segurança (produto)

- Exportar e excluir só valem para o **próprio** surfista autenticado.
- Exclusão exige confirmação; se falhar, a conta permanece e a mensagem explica causa e o que fazer.
- Documentos legais são só leitura — sem conteúdo executável de terceiros.

---

## Caminho feliz

1. Visitante abre Termos, Privacidade ou Reembolso **sem login** e lê o documento.
2. Na vitrine e na área logada, o **rodapé** aponta para os três documentos.
3. No cadastro, marca o aceite → cria a conta com sucesso.
4. Vê o aviso de cookies essenciais e dispensa; segue usando o app.
5. Em perfil (ou área equivalente de privacidade da conta), **exporta** seus dados e recebe o pacote.
6. Se desejar sair do produto, **confirma exclusão da conta** → fica deslogado e precisa criar conta nova para voltar.

---

## Erros e bordas

| Situação | Comportamento esperado |
|----------|------------------------|
| Cadastro sem marcar aceite | Não cria conta; pede para aceitar Termos e Privacidade |
| Visitante sem login nas páginas legais | Páginas abrem normalmente |
| Surfista logado nas páginas legais | Páginas abrem (sem redirecionar para o painel de forma confusa) |
| Exportar sem estar logado | Vai para login; não gera pacote |
| Excluir sem confirmação | Não exclui |
| Falha ao excluir | Mensagem com causa e correção; conta permanece |
| Reembolso vs cobrança futura | Texto genérico; deixa claro que regras de pagamento podem ser atualizadas |
| Placeholder do responsável pelo tratamento | Visível e fácil de trocar depois, sem bloquear a leitura dos documentos |

---

## Critérios de Done

- [x] Três documentos públicos publicados com texto embutido, prontos para aprovação do owner
- [x] Visitante sem login consegue ler os três documentos
- [x] Rodapé completo na vitrine e na área logada, com os três links legais
- [x] Cadastro só conclui com aceite explícito de Termos e Privacidade
- [x] Aviso dismissível de cookies essenciais de sessão
- [x] Surfista logado consegue exportar seus dados
- [x] Surfista logado consegue excluir a conta com confirmação; exclusão é irreversível para ele
- [x] Placeholders do responsável/contato visíveis e substituíveis depois
- [x] Cenários críticos cobertos por testes (páginas públicas, aceite no cadastro, exportação/exclusão do próprio usuário)
- [x] Checklist de `docs/SECURITY.md` aplicável (autorização no servidor, sem confiar no cliente)
- [x] Owner aprova o texto para o beta
- [x] Scoreboard da Trilha C atualizado em `docs/state/PLANO_GO_LIVE_COBRANCA.md`
- [x] `npm run typecheck` · `npm run lint` · `npm test` verdes

---

## Escopo de arquivos permitido

| Área | Paths / globs |
|------|----------------|
| Spec | `specs/2026-08-10-legal-lgpd.md` |
| Páginas legais | `app/termos/**`, `app/privacidade/**`, `app/reembolso/**` |
| UI legal / cookies / privacidade da conta | `components/legal/**` |
| Rodapé / shell / vitrine | `components/layout/**`, `app/page.tsx` |
| Cadastro (aceite) | `components/auth/signup-form.tsx`, `actions/auth-actions.ts` *(path crítico)* |
| Perfil / direitos | `app/(app)/profile/**`, `components/profile/**` (se existir), actions/services de exportação e exclusão |
| Perfil service | `services/profile-service.ts` *(path crítico — só o mínimo para export/exclusão)* |
| Liberação de páginas públicas | `lib/supabase/middleware.ts` *(path crítico)* |
| Testes | espelho em `**/__tests__/**` ou arquivos de teste da feature |
| Docs de estado | `docs/state/PLANO_GO_LIVE_COBRANCA.md` (scoreboard Done da Trilha C) |

**Não alterar nesta feature (salvo aprovação explícita extra):** migrations de schema, clients Supabase genéricos além do necessário à exclusão, camada de IA, gateway/billing, `.env`, PRD, redesign da landing além do rodapé.

Paths críticos exigem Spec aprovada + review humano (`AGENTS.md`).

---

## Notas / decisões fechadas (aprovadas no plano)

1. Aprovação do texto: **owner (Ivan)**
2. Escopo inclui documentos, rodapé, aceite no cadastro, cookies essenciais e direitos (portabilidade + exclusão; acesso/correção já no app)
3. Responsável pelo tratamento: **template**, ajustar depois
4. Reembolso: **genérico agora**; ajustar após provedor de cobrança
5. Retenção: **enquanto a conta existir**
6. Transferência internacional: **declarar** de forma genérica
7. Uso justo / créditos: alinhar aos números atuais (2 / 8 / 30)
8. Conteúdo: **texto embutido** nas páginas
9. Rodapé da área logada: **completo**
10. Páginas legais liberadas para visitante sem login (review humano no diff)

---

## Aprovação

- [x] Spec aprovada para implementação — Ivan · 10/08/2026
- [x] Texto legal aprovado para o beta — Ivan · 10/08/2026
- [x] Feature Done (implementação + comandos + aprovação do owner)
