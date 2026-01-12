/**
 * Create Admin User Script
 * 
 * Junior-Friendly Guide:
 * =====================
 * Этот скрипт создает первого админа для админ-панели.
 * 
 * Использование:
 *   npm run tsx scripts/create-admin.ts
 * 
 * Или с параметрами:
 *   npm run tsx scripts/create-admin.ts -- --email admin@example.com --password secret123 --role super_admin
 */

import { createAdmin } from '../server/services/admin-auth.service';
import { parseArgs } from 'util';

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    email: { type: 'string' },
    password: { type: 'string' },
    role: { type: 'string' },
    help: { type: 'boolean' },
  },
});

async function main() {
  if (values.help) {
    console.log(`
Usage: npm run tsx scripts/create-admin.ts [options]

Options:
  --email <email>      Admin email (required)
  --password <pass>    Admin password (required)
  --role <role>        Admin role: super_admin, support, analyst, readonly (default: super_admin)
  --help               Show this help message

Example:
  npm run tsx scripts/create-admin.ts -- --email admin@example.com --password secret123 --role super_admin
`);
    process.exit(0);
  }

  const email = values.email || process.env.ADMIN_EMAIL;
  const password = values.password || process.env.ADMIN_PASSWORD;
  const role = (values.role as 'super_admin' | 'support' | 'analyst' | 'readonly') || 'super_admin';

  if (!email || !password) {
    console.error('❌ Error: Email and password are required');
    console.error('\nUsage:');
    console.error('  npm run tsx scripts/create-admin.ts -- --email admin@example.com --password secret123');
    console.error('\nOr set environment variables:');
    console.error('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret123 npm run tsx scripts/create-admin.ts');
    process.exit(1);
  }

  // Валидация email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
  }

  // Валидация пароля
  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  // Валидация роли
  const validRoles = ['super_admin', 'support', 'analyst', 'readonly'];
  if (!validRoles.includes(role)) {
    console.error(`❌ Error: Invalid role. Must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  console.log('🔐 Creating admin user...\n');
  console.log(`Email: ${email}`);
  console.log(`Role: ${role}`);
  console.log(`Password: ${'*'.repeat(password.length)}\n`);

  try {
    const admin = await createAdmin({
      email,
      password, // createAdmin сам хеширует пароль
      role,
      permissions: role === 'super_admin' ? ['*'] : [], // Супер-админ имеет все права
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('Admin details:');
    console.log(`  ID: ${admin.id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Active: ${admin.isActive}`);
    console.log(`  Created: ${admin.createdAt}\n`);
    console.log('📝 Next steps:');
    console.log('   1. Login at /app/admin/auth/login');
    console.log('   2. Use the credentials above to access admin panel');
  } catch (error: any) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      console.error('❌ Error: Admin with this email already exists');
      console.error('   Use a different email or update existing admin');
    } else {
      console.error('❌ Error creating admin:', error.message);
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

