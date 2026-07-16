import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Neon's HTTP driver is the right choice for serverless functions
// (Vercel) — no persistent connection/pooling to manage, works over
// plain HTTP requests per query.
//
// Lazily initialized via getDb(), NOT constructed at module load time.
// Next.js evaluates route modules during the build's page-data-collection
// step, which would otherwise crash `next build` if DATABASE_URL isn't
// set yet (e.g. a fresh clone before .env.local is configured).
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.local.example to .env.local and add your Neon connection string."
    );
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}
