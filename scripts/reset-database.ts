import { config } from 'dotenv';
config(); // Load environment variables

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function main() {
  try {
    console.log('🗑️ Truncating all tables...\n');

    // Use a simpler approach - truncate all tables at once
    await db.execute(sql`
      TRUNCATE TABLE 
        "auditLog",
        "organizationMember", 
        "organizationInvitation",
        "organization",
        "role",
        "permission", 
        "session",
        "account",
        "verification",
        "user"
      RESTART IDENTITY CASCADE
    `);

    console.log('✅ All tables truncated successfully!');
    console.log('\n🔗 Next steps:');
    console.log('1. Run: pnpm db:seed');
    console.log('2. Start the development server: pnpm dev');

  } catch (error) {
    console.error('❌ Truncation failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();