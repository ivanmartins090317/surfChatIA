#!/usr/bin/env node
/**
 * Aplica migrations em supabase/migrations/ no projeto remoto.
 * Lê SUPABASE_DB_PASSWORD e NEXT_PUBLIC_SUPABASE_URL de .env.local
 */
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../../..");
const envPath = path.join(projectRoot, ".env.local");

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(
      `Arquivo ${filePath} não encontrado. Copie .env.example para .env.local.`,
    );
  }

  const env = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function getProjectRef(supabaseUrl) {
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    throw new Error(
      `URL Supabase inválida: ${supabaseUrl}. Esperado https://<ref>.supabase.co`,
    );
  }
  return match[1];
}

function buildDbUrl(projectRef, password) {
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`;
}

const isDryRun = process.argv.includes("--dry-run");
const env = parseEnvFile(envPath);

const supabaseUrl =
  env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? "";
const password = env.SUPABASE_DB_PASSWORD ?? "";

if (!supabaseUrl) {
  throw new Error(
    "Defina NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL) em .env.local",
  );
}

if (!password) {
  throw new Error(
    "Defina SUPABASE_DB_PASSWORD em .env.local (Supabase → Settings → Database → Database password).",
  );
}

const projectRef = getProjectRef(supabaseUrl);
const dbUrl = buildDbUrl(projectRef, password);

const args = ["supabase", "db", "push", "--db-url", dbUrl, "--yes"];
if (isDryRun) args.push("--dry-run");

console.log(`Projeto: ${projectRef}`);
console.log(
  isDryRun
    ? "Dry-run — migrations que seriam aplicadas:"
    : "Aplicando migrations...",
);

execSync(`npx ${args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(" ")}`, {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});
