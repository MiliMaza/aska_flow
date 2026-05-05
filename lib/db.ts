import { createClient, type Client } from "@libsql/client";

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL) {
  throw new Error("Missing TURSO_DATABASE_URL environment variable");
}

if (!TURSO_AUTH_TOKEN) {
  throw new Error("Missing TURSO_AUTH_TOKEN environment variable");
}

const globalForDb = globalThis as typeof globalThis & {
  libsqlClient?: Client;
};

function buildClient(): Client {
  return createClient({
    url: TURSO_DATABASE_URL!,
    authToken: TURSO_AUTH_TOKEN,
  });
}

export const db = globalForDb.libsqlClient ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.libsqlClient = db;
}

export type DbClient = typeof db;
