import { pool, db } from './server/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Running database migration...');
    
    // Add category column if not exists
    await db.execute(sql`
      ALTER TABLE time_entries 
      ADD COLUMN IF NOT EXISTS category TEXT;
    `);
    
    // Add description column if not exists  
    await db.execute(sql`
      ALTER TABLE time_entries 
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();