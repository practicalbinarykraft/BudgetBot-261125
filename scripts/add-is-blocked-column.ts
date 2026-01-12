#!/usr/bin/env npx tsx
/**
 * Quick script to add is_blocked column to users table
 * This script checks if column exists and adds it if needed
 */

import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function addIsBlockedColumn() {
  try {
    console.log('🔍 Checking if is_blocked column exists...');
    
    // Check if column exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_blocked'
    `);
    
    const columnExists = (checkResult.rows || []).length > 0;
    
    if (columnExists) {
      console.log('✅ Column is_blocked already exists');
      return;
    }
    
    console.log('➕ Adding is_blocked column...');
    
    // Add column
    await db.execute(sql`
      ALTER TABLE "users" 
      ADD COLUMN "is_blocked" BOOLEAN NOT NULL DEFAULT FALSE
    `);
    
    // Create index
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_users_is_blocked" 
      ON "users" ("is_blocked")
    `);
    
    console.log('✅ Column is_blocked added successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

addIsBlockedColumn();
