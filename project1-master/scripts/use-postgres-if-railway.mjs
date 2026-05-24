import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DATABASE_KEYS = [
  "DATABASE_URL",
  "DATABASE_PRIVATE_URL",
  "DATABASE_PUBLIC_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
];

function isDatabaseUrl(value) {
  return /^(postgres|postgresql|prisma|prisma\+postgres):\/\//.test(value ?? "");
}

const selectedKey = DATABASE_KEYS.find((key) => isDatabaseUrl(process.env[key]));
const selectedUrl = selectedKey ? process.env[selectedKey] : "";

if (!selectedUrl) {
  console.log("[railway-db] No Postgres URL found; leaving environment unchanged.");
  process.exit(0);
}

if (selectedKey === "DATABASE_URL") {
  console.log("[railway-db] DATABASE_URL is already set.");
  process.exit(0);
}

const envPath = resolve(process.cwd(), ".env");
const current = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const next = current.match(/^DATABASE_URL=/m)
  ? current.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${selectedUrl}"`)
  : `${current}${current && !current.endsWith("\n") ? "\n" : ""}DATABASE_URL="${selectedUrl}"\n`;

writeFileSync(envPath, next);
console.log(`[railway-db] Wrote DATABASE_URL from ${selectedKey}.`);
