import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  const d = db();
  if (!d) {
    console.warn("No database connection; skipping migrations.");
    return;
  }

  try {
    // Users table doubles as the Supabase Auth profile table — id is the
    // Supabase auth user UUID, so it must not auto-generate its own default.
    await d.execute(sql`
      ALTER TABLE users
        ALTER COLUMN id DROP DEFAULT,
        ADD COLUMN IF NOT EXISTS avatar_url TEXT;
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

    // Nomad columns on conversations
    await d.execute(sql`
      ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS has_nomad BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS nomad_data JSONB;
    `);

    console.log("✓ Database migrations complete.");
  } catch (err: any) {
    console.error("Migration error:", err?.message || err);
  }
}
