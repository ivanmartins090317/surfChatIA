# Spec: Billing AbacatePay (Trilhas D + H)

| Campo | Valor |
|-------|--------|
| **Status** | `draft` |
| **Autonomia** | `tight` (paths críticos de billing, domínio, schema e notificações de pagamento) |
| **Data** | 2026-08-20 |
| **Owner** | time Surf AI Coach |
| **Refs** | [PLANO_GO_LIVE_COBRANCA.md](../docs/state/PLANO_GO_LIVE_COBRANCA.md) Trilhas D e H · [PLANOS_E_LIMITES.md](../docs/PLANOS_E_LIMITES.md) · [2026-08-10-creditos-paywall.md](./2026-08-10-creditos-paywall.md) Trilha A · plano aprovado na conversa de 20/08/2026 |

---

## Problema

O produto já limita uso por **créditos** e exibe paywall, mas **não cobra**. A página de planos é ilustrativa; upgrades não liberam créditos reais. O gateway **AbacatePay** foi escolhido e a recepção de notificações de pagamento já valida autenticidade, porém **não altera plano nem saldo** quando um pagamento é confirmado.

Sem fechar a configuração comercial no gateway (Trilha D) e a integração de cobrança no app (Trilha H), o surfista não consegue assinar Surfista/Pro nem comprar packs avulsos, e o negócio não monetiza.

## Objetivo

Permitir que o surfista autenticado **pague** por assinatura mensal (Surfista ou Pro) ou por **pack avulso** (S ou M), receba **créditos e plano** de forma confiável após confirmação do gateway, consulte sua situação de cobrança no app e tenha cancelamento/renovação refletidos corretamente — primeiro em **ambiente de testes** do AbacatePay, depois em produção quando o owner habilitar cobrança real.

**Trilha D (operacional):** conta AbacatePay pronta, ofertas comerciais cadastradas no gateway, segredos e notificações documentados por ambiente.

**Trilha H (produto):** fluxo completo pagamento → notificação → plano/créditos → UI de planos e cobrança.

## Fora de escopo

- Go-live comercial, beta pago e marketing (Trilha I)
- Landing de conversão completa (Trilha B)
- Domínio customizado e e-mail transacional próprio (Trilha E)
- Plano **Coach** e multi-tenant / alunos vinculados
- Revisão jurídica externa; apenas ajuste pontual de copy de reembolso quando checkout real ativar
- Automação de disputa/chargeback além de registro e alerta operacional
- Backfill de créditos ou plano para contas antigas
- Migração para Stripe, Mercado Pago ou outro gateway
- Painel administrativo de billing
- Nova dependência npm sem aprovação explícita do owner
- Job agendado mensal dedicado (reset de ciclo) — **nesta entrega** o reset de créditos do período ocorre na **renovação** da assinatura; cron separado fica como follow-up

---

## Regras de domínio

### Gateway e ambientes

- Provedor de pagamento: **AbacatePay**, versão **v2** de notificações.
- Dois ambientes distintos: **teste** (Dev mode, chaves de desenvolvimento) e **produção** (cobrança real). Cada ambiente tem sua própria chave de API e sua própria configuração de notificação — nunca misturar.
- Segredos do gateway ficam **somente no servidor**; nunca no navegador nem em repositório versionado.

### Ofertas comerciais

| Oferta | Preço | Benefício |
|--------|-------|-----------|
| **Surfista** (assinatura mensal) | R$ 39/mês | Plano Surfista · **8 créditos por ciclo** |
| **Pro** (assinatura mensal) | R$ 89/mês | Plano Pro · **30 créditos por ciclo** |
| **Pack S** (compra avulsa) | R$ 19 | **5 créditos** adicionados ao saldo avulso |
| **Pack M** (compra avulsa) | R$ 49 | **15 créditos** adicionados ao saldo avulso |

- Valores e cotas seguem [PLANOS_E_LIMITES.md](../docs/PLANOS_E_LIMITES.md).
- Plano **grátis** permanece como hoje (2 créditos totais para novos cadastros, sem renovação mensal).
- Créditos avulsos **não expiram** nesta entrega (política de 12 meses permanece nos Termos; sem job de expiração agora).

### Assinatura vs pack avulso

- **Assinatura:** altera o **plano** do surfista (Surfista ou Pro), inicia/atualiza o **ciclo de cobrança** e repõe a **cota mensal de créditos do plano** (via reset do uso do período + plano correto).
- **Pack avulso:** **não altera** o plano; incrementa apenas o **saldo de créditos avulsos** (`credits_balance` conceitual).
- Um surfista no plano grátis que compra pack continua grátis, com créditos avulsos a mais.

### Notificações de pagamento (webhook)

- Toda notificação deve ser **autenticada** (segredo na URL + assinatura digital do corpo).
- Cada evento tem identificador único: o sistema **processa uma única vez** (idempotência).
- Resposta de sucesso só após persistir o efeito de negócio (ou constatar que já foi processado).
- Eventos mínimos tratados:
  - **Checkout concluído** → pack avulso pago
  - **Assinatura ativada** → primeira cobrança / upgrade para plano pago
  - **Assinatura renovada** → novo ciclo; repor cota mensal do plano
  - **Assinatura cancelada** → marcar cancelamento; **não remover créditos já concedidos** até o fim do período pago

### Vínculo pagamento ↔ surfista

- Toda cobrança criada pelo app deve carregar referência **inequívoca** ao surfista (metadado ou identificador externo acordado com o gateway).
- Se a notificação chegar **sem** conseguir identificar o surfista, o sistema **registra falha operacional** e **não** credita plano nem créditos.

### Sincronização de plano e créditos

- Após confirmação de **assinatura**: plano passa a Surfista ou Pro; início do ciclo registrado; uso do período zerado para fins de cota mensal.
- Após confirmação de **renovação**: mantém plano; avança ciclo; zera uso do período (nova cota mensal disponível).
- Após confirmação de **pack**: incrementa saldo avulsos; registra no histórico de créditos com motivo de compra.
- **Cancelamento:** status da assinatura reflete cancelamento; plano pago permanece até `current_period_end`; após fim do período, regras de downgrade para grátis aplicam-se (ver bordas).
- Toda mutação de créditos/plano passa pelo **mesmo modelo atômico e auditável** já usado na Trilha A (histórico + servidor).

### Checkout no app

- Apenas surfista **autenticado** inicia pagamento.
- Fluxo: escolhe oferta em **Planos** → redirecionamento ou modal do gateway → retorno ao app com estado claro (sucesso pendente / confirmado / falhou).
- Enquanto pagamento pendente, créditos **não** são antecipados.

### Área de cobrança

- Surfista consulta: plano atual, créditos (já existente), status da assinatura (ativa / cancelada / pendente), próxima renovação quando aplicável.
- Surfista pode **iniciar cancelamento** da assinatura (via gateway ou fluxo exposto pelo app conforme API AbacatePay).
- Upgrade (grátis → Surfista/Pro) e compra de pack partem da mesma página de planos.

### Segurança

- Zero confiança no cliente para plano, créditos ou status de pagamento.
- Entradas de notificação: validação mínima do payload (campos essenciais), sem schema rígido que quebre com evolução do gateway.
- Mensagens ao surfista em falha de pagamento: causa compreensível + o que fazer (tentar de novo, contato suporte).

---

## Caminho feliz

### Trilha D — Configuração no gateway (owner)

1. Owner confirma AbacatePay como provedor e documenta a decisão nos docs vivos.
2. Conta AbacatePay ativa; Dev mode habilitado para testes.
3. Quatro ofertas cadastradas no painel (Surfista, Pro, Pack S, Pack M) com preços e IDs anotados para o time.
4. Notificação de teste configurada (URL HTTPS do app + segredo); eventos v2 selecionados (checkout concluído, assinatura ativada, renovada, cancelada).
5. Variáveis de ambiente na Vercel (chave API + segredo de notificação) + redeploy; smoke test confirma que notificação inválida é rejeitada e notificação válida retorna sucesso.

### Trilha H — Fluxo no produto

1. Surfista no plano grátis esgota créditos → paywall → **Planos**.
2. Escolhe **Surfista** → inicia checkout → paga no gateway (teste) → notificação **assinatura ativada** chega ao app.
3. Sistema identifica surfista, registra assinatura, define plano **Surfista**, zera uso do período → surfista passa a ter **8 créditos** disponíveis no ciclo.
4. Surfista consome análises normalmente (Trilha A); histórico mostra débitos.
5. No ciclo seguinte, gateway cobra e envia **assinatura renovada** → uso do período zera → 8 créditos repostos.
6. Outro surfista compra **Pack S** → notificação **checkout concluído** → **+5** no saldo avulsos; plano inalterado.
7. Surfista Pro acessa **Cobrança** → vê plano Pro, status ativo, opção de cancelar.
8. Cancela assinatura → notificação **assinatura cancelada** → status cancelado; mantém Pro e créditos do ciclo até fim do período pago.

---

## Erros e bordas

| Situação | Comportamento esperado |
|----------|------------------------|
| Notificação com segredo ou assinatura inválidos | Rejeitar; **não** alterar plano/créditos; registrar tentativa |
| Mesmo evento recebido duas vezes | Segunda vez: reconhecer como já processado; responder sucesso **sem** efeito duplicado |
| Checkout concluído sem identificar surfista | Não creditar; alerta operacional; owner investiga manualmente |
| Valor ou oferta do pagamento não bate com catálogo interno | Não creditar; registrar inconsistência |
| Pagamento de pack enquanto assinatura ativa | Creditar só saldo avulsos; plano da assinatura intacto |
| Upgrade grátis → Pro com assinatura Surfista ativa | Regra explícita na implementação: preferir **upgrade via gateway** (não duas assinaturas); spec de produto: **uma assinatura ativa por surfista** |
| Assinatura cancelada antes do fim do ciclo | Plano pago e cota vigem até fim do período; depois downgrade para grátis (cota grátis só se ainda elegível à regra de novos cadastros — contas que já usaram 2 grátis ficam com 0 cota grátis) |
| Fim do período após cancelamento | Plano volta a **grátis**; créditos avulsos remanescentes preservados; uso do período resetado para regras do grátis |
| Falha ao criar checkout (gateway indisponível) | Mensagem clara ao surfista; sem cobrança parcial no app |
| Surfista abandona checkout | Nenhuma mudança de plano/créditos |
| Notificação chega antes do surfista voltar ao app | Estado correto ao abrir Planos/Cobrança/Dashboard (dados server-side) |
| Ambiente de teste vs produção | Eventos de teste só afetam ambiente configurado; chaves não cruzadas |
| Segredo na URL com caracteres especiais (`+`, `=`) | Configurar URL codificada no gateway; app compara segredo de forma segura |
| Erro interno ao processar notificação válida | Responder falha para gateway retentar; idempotência evita duplicar após sucesso parcial — transação atômica obrigatória |
| Reembolso (checkout reembolsado) | **Fora desta entrega:** registrar evento se recebido, sem automação de estorno de créditos (decisão aberta abaixo) |

---

## Critérios de Done

### Trilha D

- [ ] AbacatePay documentado como provedor oficial (substituir referências genéricas a Stripe/MP nos docs vivos pertinentes)
- [ ] Conta gateway verificada ou caminho de KYC documentado para produção
- [ ] Quatro ofertas criadas no painel com IDs registrados no manual-dev
- [ ] Notificação de **teste** e de **produção** configuradas (URLs + segredos por ambiente)
- [ ] Variáveis na Vercel (Production) + redeploy; smoke test documentado no manual-dev

### Trilha H

- [ ] Surfista autenticado inicia checkout de Surfista, Pro, Pack S e Pack M a partir de **Planos**
- [ ] Pagamento simulado (Dev mode) ativa plano ou credita pack conforme oferta
- [ ] Notificações tratadas: checkout concluído, assinatura ativada, renovada, cancelada
- [ ] Idempotência comprovada (evento duplicado não duplica crédito/plano)
- [ ] Registro de assinatura consultável; RLS impede surfista de ver dados de outros
- [ ] Página ou seção **Cobrança** com plano, status e cancelamento
- [ ] Histórico de créditos registra compras avulsas e renovações com motivo distinguível
- [ ] Uma assinatura ativa por surfista; upgrade/downgrade coerente
- [ ] Testes automatizados cobrindo validação de notificação, idempotência e regras de crédito/plano
- [ ] Checklist aplicável de `docs/SECURITY.md` (segredos server-side, autorização, RLS, payload não confiável)
- [ ] Scoreboard Trilhas D e H atualizado em `docs/state/PLANO_GO_LIVE_COBRANCA.md`
- [ ] `npm run typecheck` · `npm run lint` · `npm test` verdes
- [ ] Docs vivos: `docs/implementation/` + `docs/manual-dev/` + `docs/state/PENDENCIAS.md` (skill `close-phase`)

---

## Escopo de arquivos permitido

| Área | Paths / globs |
|------|----------------|
| Spec | `specs/2026-08-20-billing-abacatepay.md` |
| Schema | `supabase/migrations/**` *(crítico)* |
| Domínio | `lib/domain/**` *(crítico)* |
| Billing / gateway | `lib/billing/**` *(crítico)* |
| Serviços | `services/billing-service.ts` *(novo, crítico)*, `services/usage-service.ts` *(crítico)*, `services/profile-service.ts` *(crítico, leitura/atualização de plano)* |
| Actions | `actions/billing-actions.ts` *(novo, crítico)* |
| Notificações HTTP | `app/api/webhooks/abacatepay/**` *(crítico)* |
| UI planos / cobrança | `app/(app)/planos/**`, `app/(app)/billing/**` *(ou seção equivalente em perfil)*, `components/billing/**` |
| Middleware | `lib/supabase/middleware.ts` *(somente se necessário para rotas públicas de retorno)* |
| Ambiente | `lib/env.ts` *(crítico)* |
| Testes | `lib/__tests__/billing*.ts`, `lib/__tests__/abacatepay*.ts` |
| Docs vivos | `docs/implementation/**`, `docs/manual-dev/**`, `docs/state/PLANO_GO_LIVE_COBRANCA.md`, `docs/state/PENDENCIAS.md`, `.env.example`, `docs/DEPLOY_VERCEL.md` |

**Não alterar nesta feature (salvo aprovação explícita extra):** `lib/ai/**`, prompts, fluxos de análise além do gate já existente, `middleware.ts` raiz, PRD, Termos completos, Trilha I/B/E.

---

## Notas / decisões abertas

1. **Reembolso automático:** evento `checkout.refunded` — nesta entrega apenas logar ou ignorar? *(Recomendação: logar + item em PENDENCIAS para política de estorno de créditos.)*
2. **Downgrade pós-cancelamento:** créditos avulsos permanecem; cota grátis 0 para quem já consumiu os 2 iniciais — confirmar com owner.
3. **URL de retorno pós-checkout:** página de sucesso dedicada ou retorno a Planos com toast — definir na implementação (preferir rota simples em `/planos?checkout=success`).
4. **Cancelamento:** redirect para portal AbacatePay vs API in-app — depende da API disponível na conta; documentar escolha no manual-dev.
5. **IDs das ofertas no gateway:** preencher na Trilha D antes de codificar catálogo interno (`billing-catalog`).

---

## Aprovação

- [ ] Spec aprovada para implementação (assinatura / data do responsible)
