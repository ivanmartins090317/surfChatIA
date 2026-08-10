# Incidentes resolvidos

Registro de **incidentes de produção / homologação** já diagnosticados e corrigidos. Diferente de `fixed_tasks/` (bugs pontuais de código), aqui entram falhas que misturam **infra, configuração e produto** — útil para post-mortem rápido se o sintoma voltar.

| Data | Documento | Resumo |
|------|-----------|--------|
| 2026-08-10 | [2026-08-10-upload-analise-storage-ausente-e-limite-50mb.md](./2026-08-10-upload-analise-storage-ausente-e-limite-50mb.md) | Upload de análise falhava: buckets Storage ausentes, depois rejeição por limite global Free 50 MB vs app em 100 MB |

## Convenção

- Pasta: `docs/state/incidentes-resolvidos/`
- Nome do arquivo: `AAAA-MM-DD-slug-curto-do-incidente.md`
- Seções fixas: **Sintoma** → **Timeline** → **Causa raiz** → **Correção** → **Validação** → **Lições / follow-up**
- Status no topo: `✅ Resolvido` (ou `🟡 Mitigado` se ainda houver follow-up aberto)
