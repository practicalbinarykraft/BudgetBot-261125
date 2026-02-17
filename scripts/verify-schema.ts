#!/usr/bin/env npx tsx
/**
 * Schema Verification Script
 *
 * Checks that the production database matches expected schema:
 * - Required tables exist
 * - Required columns exist with correct types
 * - Required constraints exist
 * - Required indexes exist
 *
 * Usage:
 *   npx tsx scripts/verify-schema.ts
 *   DATABASE_URL="postgres://..." npx tsx scripts/verify-schema.ts
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - One or more checks failed
 */

import dotenv from "dotenv";
dotenv.config();

import { db } from "../server/db";
import { sql } from "drizzle-orm";

interface CheckResult {
  name: string;
  passed: boolean;
  detail?: string;
}

const results: CheckResult[] = [];

function check(name: string, passed: boolean, detail?: string) {
  results.push({ name, passed, detail });
}

async function tableExists(tableName: string): Promise<boolean> {
  const r = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS(
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = ${tableName}
    ) AS exists
  `);
  return r.rows[0]?.exists === true;
}

async function columnExists(table: string, column: string, expectedType?: string): Promise<{ exists: boolean; type?: string }> {
  const r = await db.execute<{ data_type: string }>(sql`
    SELECT data_type FROM information_schema.columns
    WHERE table_name = ${table} AND column_name = ${column}
  `);
  if (r.rows.length === 0) return { exists: false };
  return { exists: true, type: r.rows[0].data_type };
}

async function constraintExists(table: string, constraintName: string): Promise<boolean> {
  const r = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS(
      SELECT 1 FROM pg_constraint
      WHERE conrelid = ${sql.raw(`'${table}'::regclass`)}
      AND conname = ${constraintName}
    ) AS exists
  `);
  return r.rows[0]?.exists === true;
}

async function indexExists(indexName: string): Promise<boolean> {
  const r = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS(
      SELECT 1 FROM pg_indexes WHERE indexname = ${indexName}
    ) AS exists
  `);
  return r.rows[0]?.exists === true;
}

async function run() {
  console.log("Schema Verification\n" + "=".repeat(50));

  // === Tables ===
  const requiredTables = [
    "users", "wallets", "transactions", "categories", "budgets",
    "user_credits", "ai_usage_log", "credit_transactions",
    "tutorial_steps", "session", "audit_log", "exchange_rate_history",
    "notifications", "recurring", "wishlist", "assets",
  ];
  for (const t of requiredTables) {
    check(`table: ${t}`, await tableExists(t));
  }

  // === user_credits columns ===
  const creditsCols: Array<[string, string]> = [
    ["messages_remaining", "integer"],
    ["total_granted", "integer"],
    ["total_used", "integer"],
    ["monthly_allowance", "integer"],
    ["last_reset_at", "timestamp without time zone"],
    ["created_at", "timestamp without time zone"],
    ["updated_at", "timestamp without time zone"],
  ];
  for (const [col, expectedType] of creditsCols) {
    const r = await columnExists("user_credits", col);
    check(
      `column: user_credits.${col}`,
      r.exists && r.type === expectedType,
      r.exists ? `type=${r.type}` : "MISSING",
    );
  }

  // === wallets.opening_balance_usd ===
  const obCol = await columnExists("wallets", "opening_balance_usd");
  check("column: wallets.opening_balance_usd", obCol.exists, obCol.exists ? `type=${obCol.type}` : "MISSING");

  // === tutorial_steps columns ===
  const tutCols = ["user_id", "step_id", "credits_awarded", "completed_at"];
  for (const col of tutCols) {
    const r = await columnExists("tutorial_steps", col);
    check(`column: tutorial_steps.${col}`, r.exists);
  }

  // === Constraints ===
  check(
    "constraint: credits_non_negative",
    await constraintExists("user_credits", "credits_non_negative"),
  );

  // === Indexes ===
  const requiredIndexes = [
    "user_credits_pkey",
    "user_credits_user_id_key",
    "idx_user_credits_user_id",
    "tutorial_steps_pkey",
    "idx_tutorial_steps_user",
    "tutorial_steps_user_id_step_id_key",
  ];
  for (const idx of requiredIndexes) {
    check(`index: ${idx}`, await indexExists(idx));
  }

  // === _migrations count ===
  const migCount = await db.execute<{ count: string }>(sql`SELECT count(*) AS count FROM _migrations`);
  const count = parseInt(migCount.rows[0]?.count ?? "0", 10);
  check(`_migrations: ${count} records`, count >= 11, `count=${count}`);

  // === Print Results ===
  console.log("");
  let failures = 0;
  for (const r of results) {
    const icon = r.passed ? "✅" : "❌";
    const detail = r.detail ? ` (${r.detail})` : "";
    console.log(`  ${icon} ${r.name}${detail}`);
    if (!r.passed) failures++;
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Total: ${results.length} checks, ${results.length - failures} passed, ${failures} failed`);

  if (failures > 0) {
    console.error(`\n❌ SCHEMA VERIFICATION FAILED (${failures} issues)`);
    process.exit(1);
  } else {
    console.log("\n✅ Schema and DB are in sync");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
