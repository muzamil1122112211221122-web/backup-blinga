import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL || process.env.PGDATABASE; // Fallback or handle
    if (!connectionString) {
      console.error("DATABASE_URL is not set");
      return null;
    }
    
    pool = new Pool({ 
      connectionString,
      ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false
    });
    db = drizzle(pool, { schema });
  }
  return db;
}

export { getDb as db };
