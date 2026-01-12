/**
 * Script to check user credits in database
 * Usage: npx tsx scripts/check-user-credits.ts <userId>
 */

import { db } from '../server/db';
import { userCredits, creditTransactions } from '../shared/schema';
import { eq } from 'drizzle-orm';

const userId = process.argv[2] ? parseInt(process.argv[2]) : 4;

async function checkCredits() {
  console.log(`\n=== Checking credits for user ${userId} ===\n`);
  
  // Check user_credits table
  const [credits] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);
  
  if (credits) {
    console.log('User Credits Record:');
    console.log(JSON.stringify(credits, null, 2));
  } else {
    console.log('❌ No credits record found for this user');
  }
  
  // Check credit_transactions table
  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(creditTransactions.createdAt);
  
  console.log(`\nCredit Transactions (${transactions.length}):`);
  transactions.forEach((tx, idx) => {
    console.log(`\n${idx + 1}. ${tx.type} - ${tx.messagesChange} messages`);
    console.log(`   Balance: ${tx.balanceBefore} → ${tx.balanceAfter}`);
    console.log(`   Description: ${tx.description}`);
    console.log(`   Date: ${tx.createdAt}`);
  });
  
  process.exit(0);
}

checkCredits().catch(console.error);
