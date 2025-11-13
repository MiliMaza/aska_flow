/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync, existsSync } = require("node:fs");
const { createClient } = require("@libsql/client");

const loadEnvFile = (filepath) => {
  if (!existsSync(filepath)) return;
  const content = readFileSync(filepath, "utf8");
  content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .forEach((line) => {
      const idx = line.indexOf("=");
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const value = line
        .slice(idx + 1)
        .trim()
        .replace(/^"|"$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
};

if (existsSync(".env.local")) loadEnvFile(".env.local");
else if (existsSync(".env")) loadEnvFile(".env");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
}

const client = createClient({ url, authToken });
const sql = readFileSync("db/schema.sql", "utf8");
const statements = sql
  .split(/;\s*(?:\n|$)/)
  .map((stmt) => stmt.trim())
  .filter((stmt) => stmt.length);

async function main() {
  for (const statement of statements) {
    await client.execute(statement);
  }
  console.log("Schema applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
