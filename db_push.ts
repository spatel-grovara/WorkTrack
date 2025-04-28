import * as schema from "./shared/schema";
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Push schema to database
async function main() {
  console.log("Pushing schema to database...");

  try {
    // Using direct SQL to create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        display_name TEXT NOT NULL,
        initials TEXT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        clock_in TIMESTAMP NOT NULL,
        clock_out TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        date TEXT NOT NULL
      );
    `);
    
    console.log("Schema push completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error pushing schema:", error);
    process.exit(1);
  }
}

main();