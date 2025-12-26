import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    let connectionString = process.env.DATABASE_URL;
    
    // If DATABASE_URL is empty or missing, check if individual PG vars are set
    if (!connectionString && process.env.PGPASSWORD) {
      connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
    }

    if (!connectionString) {
      console.error("No database connection string available");
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
