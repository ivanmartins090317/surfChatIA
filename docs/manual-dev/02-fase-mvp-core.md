# Fase MVP · Core do produto

| Status | Spec / registro |
| --- | --- |
| concluída (código) · E2E 26/26 TCs | [`docs/implementation/2026-07-03-fundacao-mvp-inicial.md`](../implementation/2026-07-03-fundacao-mvp-inicial.md) |

## O que esta fase entrega

- Signup, login, logout, recuperação de senha
- Perfil surfista (nível, peso, altura, tipo de onda)
- Análise de performance (link YouTube, imagem, vídeo + frames)
- Prancha mágica (≥3 fotos → ficha técnica IA)
- Compatibilidade de prancha (match com prancha mágica)
- Dashboard, listagens e detalhes de cada módulo
- RLS validado (TC-21/22)

Não entrega: créditos comerciais, pagamentos, landing marketing completa.

---

## Fluxos principais

### Análise de performance

1. `/analyses/new` → escolhe tipo (link / imagem / vídeo)
2. Upload ou URL validada (SSRF + allowlist)
3. Server Action → `analysis-service` → `lib/ai/` → persiste `analyses`
4. Estados UI: `enviando → processando → pronto → erro`

### Prancha mágica

1. `/boards/new` → upload ≥3 fotos (bucket `boards`)
2. IA gera ficha → `/boards/[id]`

### Compatibilidade

1. `/compatibility/new` → fotos candidatas + prancha mágica de referência
2. IA visão + texto → veredito em `/compatibility/[id]`

---

## Homologação manual

Relatório formal: [`docs/relatorio-testes-manuais.html`](../relatorio-testes-manuais.html) (POP-QA-SURF-001, 26 TCs).

Checklist rápido pós-alteração:

- [ ] Signup → login → editar perfil
- [ ] Análise link + imagem + vídeo (com `OPENAI_API_KEY`)
- [ ] Prancha mágica com 3+ fotos
- [ ] Match com prancha mágica existente
- [ ] Mobile ≤390px sem overflow (TC-24)

---

## Comandos

```bash
npm run dev
npm run typecheck && npm run lint && npm test
```

Variáveis mínimas: ver `.env.example` (Supabase + OpenAI).

---

## Próximo passo

Produção: [03-fase-producao-deploy.md](./03-fase-producao-deploy.md) · Pendências: [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
