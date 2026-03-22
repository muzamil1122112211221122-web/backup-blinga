import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  const d = db();
  if (!d) {
    console.warn("No database connection; skipping migrations.");
    return;
  }

  try {
    // Users table - add missing columns
    await d.execute(sql`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS password_hash TEXT,
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // Email verification tokens
    await d.execute(sql`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // User settings
    await d.execute(sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        settings JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Session table for connect-pg-simple
    await d.execute(sql`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
    `);
    await d.execute(sql`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
    `);

    console.log("✓ Database migrations complete.");
  } catch (err: any) {
    console.error("Migration error:", err?.message || err);
  }
}
