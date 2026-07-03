---
name: supabase-migrations
description: >-
  Aplica migrations SQL do Supabase no projeto remoto via CLI (db push).
  Use quando o usuário pedir rodar migrations, atualizar schema, criar tabelas
  RLS, buckets storage ou sincronizar supabase/migrations com o banco.
---

# Supabase Migrations — Surf AI Coach

## Pré-requisitos

1. `.env.local` na raiz com:
   - `NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
   - **`SUPABASE_DB_PASSWORD=...`** (Settings → Database → Database password)

2. Migrations em `supabase/migrations/` (ordem lexicográfica: `001_`, `002_`, …).

3. **Nunca** commitar `.env.local` nem expor `SUPABASE_DB_PASSWORD` no chat/código.

## Comando padrão (sempre preferir)

Na raiz do projeto:

```bash
npm run db:push
```

Dry-run (lista o que seria aplicado):

```bash
npm run db:push:dry
```

Script: `.cursor/skills/supabase-migrations/scripts/push-migrations.mjs`

## Fluxo do agente

1. Confirmar que `SUPABASE_DB_PASSWORD` está em `.env.local` (não sobrescrever o arquivo sem pedir).
2. Se o usuário pediu nova migration, criar `supabase/migrations/NNN_descricao.sql` idempotente quando possível (`if not exists`, `on conflict do nothing`).
3. Rodar `npm run db:push:dry` antes, se houver dúvida sobre o delta.
4. Rodar `npm run db:push` e reportar sucesso ou erro.
5. Aviso Docker no final da CLI é cache local — **ignorar** se migrations aplicaram.

## Migrations atuais do MVP

| Arquivo | Conteúdo |
|---------|----------|
| `001_profiles.sql` | `profiles`, RLS, trigger signup |
| `002_media_analyses.sql` | `media_items`, `analyses` |
| `003_boards.sql` | `boards`, FKs |
| `004_storage_policies.sql` | RLS storage.objects |
| `005_storage_buckets.sql` | buckets `media`, `boards` |

## Nova migration — checklist

- [ ] RLS em toda tabela nova
- [ ] Policies espelham `auth.uid() = user_id`
- [ ] Storage: bucket privado + policy por pasta `{user_id}/`
- [ ] Nome sequencial `NNN_snake_case.sql`
- [ ] Rodar `npm run db:push` após criar

## Troubleshooting

| Erro | Ação |
|------|------|
| `password authentication failed` | Senha errada em `SUPABASE_DB_PASSWORD` — resetar no dashboard Supabase |
| `SUPABASE_DB_PASSWORD` ausente | Usuário deve adicionar ao `.env.local` |
| Policy já existe | Tornar migration idempotente: `drop policy if exists ...` antes de `create policy` |
| `link` / privileges | **Não** usar `supabase link`; usar `npm run db:push` (conexão direta Postgres) |

## Alternativa manual

SQL Editor no dashboard Supabase → colar conteúdo dos arquivos em ordem. Preferir o script para histórico consistente na tabela `supabase_migrations.schema_migrations`.
