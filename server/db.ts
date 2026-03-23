import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let pool: Pool | null = null;
let drizzleDb: ReturnType<typeof drizzle> | null = null;
let initialized = false;

function buildConnectionString(): string | null {
  // Try DATABASE_URL first
  const url = process.env.DATABASE_URL;
  if (url) return url;

  // Construct from individual PG vars
  const host = process.env.PGHOST;
  const port = process.env.PGPORT || '5432';
  const user = process.env.PGUSER;
  const pass = process.env.PGPASSWORD;
  const dbName = process.env.PGDATABASE;

  if (host && user && pass && dbName) {
    const encodedPass = encodeURIComponent(pass);
    return `postgresql://${user}:${encodedPass}@${host}:${port}/${dbName}`;
  }

  return null;
}

function getDb() {
  if (initialized) return drizzleDb;
  initialized = true;

  const connectionString = buildConnectionString();

  if (!connectionString) {
    console.log("ℹ️  No database connection string — using file-based persistent storage.");
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('neon.tech') || connectionString.includes('supabase')
        ? { rejectUnauthorized: false }
        : false,
      connectionTimeoutMillis: 5000,
    });
    drizzleDb = drizzle(pool, { schema });
    console.log("✓ Database connection established.");
    return drizzleDb;
  } catch (err: any) {
    console.error("⚠️  Database connection failed:", err.message);
    return null;
  }
}

export { getDb as db };
