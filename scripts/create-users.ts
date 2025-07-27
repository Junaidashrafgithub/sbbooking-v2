import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

// For debugging
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

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

async function createUsers() {
  try {
    console.log('Creating users...');
    
    // Hash passwords
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('123456', saltRounds);
    const userPassword = await bcrypt.hash('123456', saltRounds);
    
    // Create admin user
    const adminUser = await db.insert(schema.users).values({
      username: 'admin',
      email: 'admin@gmail.com',
      password: adminPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    }).returning();
    
    console.log('Admin user created:', adminUser[0].id);
    
    // Create doctor user
    const doctorUser = await db.insert(schema.users).values({
      username: 'doctor',
      email: 'user@gmail.com',
      password: userPassword,
      role: 'doctor',
      firstName: 'Doctor',
      lastName: 'User',
      isActive: true,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    }).returning();
    
    console.log('Doctor user created:', doctorUser[0].id);
    
    console.log('Users created successfully!');
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
createUsers();
