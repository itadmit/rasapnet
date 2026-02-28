import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function dropAll() {
  const client = await pool.connect();
  try {
    // Drop all tables in public schema (cascade to handle FKs)
    await client.query(`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    // Drop all enums
    await client.query(`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN (SELECT typname FROM pg_type WHERE typname IN (
          'user_role', 'soldier_status', 'constraint_type', 'duty_frequency',
          'duty_event_status', 'attendance_status', 'whatsapp_log_type'
        )) LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    console.log("✅ All tables and enums dropped");
  } finally {
    client.release();
    await pool.end();
  }
}

dropAll().catch((e) => {
  console.error(e);
  process.exit(1);
});
