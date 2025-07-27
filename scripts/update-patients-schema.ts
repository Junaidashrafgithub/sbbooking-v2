import dotenv from 'dotenv';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Create database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function updatePatientsSchema() {
  try {
    console.log('Updating patients schema...');
    
    // Get the first admin user to assign as default owner
    const adminUsers = await db.select()
      .from(schema.users)
      .where({ role: 'admin' });
    
    let defaultUserId = adminUsers.length > 0 ? adminUsers[0].id : null;
    
    if (!defaultUserId) {
      console.log('No admin user found, checking for any user...');
      const anyUsers = await db.select().from(schema.users);
      defaultUserId = anyUsers.length > 0 ? anyUsers[0].id : 1;
    }
    
    console.log(`Using default user ID: ${defaultUserId} for existing patients`);
    
    // Update all existing patients to have the default userId
    const result = await db.execute(
      `UPDATE patients SET user_id = $1 WHERE user_id IS NULL`,
      [defaultUserId]
    );
    
    console.log('Patients schema updated successfully!');
    
  } catch (error) {
    console.error('Error updating patients schema:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
updatePatientsSchema();
