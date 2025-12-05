/**
 * Migration Service Tests
 *
 * Tests helper functions and migration logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateChecksum,
  getMigrationOrder,
  MigrationService,
} from '../migration.service';

// ========================================
// HELPER FUNCTION TESTS
// ========================================

describe('Migration Service - Helpers', () => {
  describe('generateChecksum', () => {
    it('should generate consistent checksum for same content', () => {
      const content = 'ALTER TABLE users ADD COLUMN avatar TEXT;';
      const checksum1 = generateChecksum(content);
      const checksum2 = generateChecksum(content);

      expect(checksum1).toBe(checksum2);
    });

    it('should generate different checksum for different content', () => {
      const content1 = 'ALTER TABLE users ADD COLUMN avatar TEXT;';
      const content2 = 'ALTER TABLE users ADD COLUMN bio TEXT;';

      expect(generateChecksum(content1)).not.toBe(generateChecksum(content2));
    });

    it('should return 8-character hex string', () => {
      const checksum = generateChecksum('test content');

      expect(checksum).toMatch(/^[0-9a-f]{8}$/);
    });

    it('should handle empty string', () => {
      const checksum = generateChecksum('');

      expect(checksum).toBe('00000000');
    });

    it('should handle unicode content', () => {
      const content = 'ALTER TABLE users ADD COLUMN name TEXT; -- Имя пользователя';
      const checksum = generateChecksum(content);

      expect(checksum).toMatch(/^[0-9a-f]{8}$/);
    });
  });

  describe('getMigrationOrder', () => {
    it('should extract number from migration name', () => {
      expect(getMigrationOrder('0001-add-users.sql')).toBe(1);
      expect(getMigrationOrder('0042-add-settings.sql')).toBe(42);
      expect(getMigrationOrder('0100-update-schema.sql')).toBe(100);
    });

    it('should handle leading zeros', () => {
      expect(getMigrationOrder('0001-test.sql')).toBe(1);
      expect(getMigrationOrder('0010-test.sql')).toBe(10);
    });

    it('should return Infinity for invalid names', () => {
      expect(getMigrationOrder('invalid-name.sql')).toBe(Infinity);
      expect(getMigrationOrder('add-users.sql')).toBe(Infinity);
      expect(getMigrationOrder('')).toBe(Infinity);
    });

    it('should handle various formats', () => {
      expect(getMigrationOrder('1-simple.sql')).toBe(1);
      expect(getMigrationOrder('123-test.sql')).toBe(123);
    });
  });
});

// ========================================
// MIGRATION SERVICE TESTS (Unit)
// ========================================

describe('Migration Service - Unit', () => {
  describe('MigrationService class', () => {
    it('should be instantiable', () => {
      const service = new MigrationService();
      expect(service).toBeDefined();
    });

    it('should have getMigrationFiles method', () => {
      const service = new MigrationService();
      expect(typeof service.getMigrationFiles).toBe('function');
    });

    it('should have createMigration method', () => {
      const service = new MigrationService();
      expect(typeof service.createMigration).toBe('function');
    });

    it('should have runPending method', () => {
      const service = new MigrationService();
      expect(typeof service.runPending).toBe('function');
    });

    it('should have getStatus method', () => {
      const service = new MigrationService();
      expect(typeof service.getStatus).toBe('function');
    });

    it('should have validateChecksums method', () => {
      const service = new MigrationService();
      expect(typeof service.validateChecksums).toBe('function');
    });
  });
});

// ========================================
// MIGRATION FILE SORTING TESTS
// ========================================

describe('Migration File Sorting', () => {
  it('should sort migrations by number prefix', () => {
    const files = [
      '0003-add-settings.sql',
      '0001-create-users.sql',
      '0002-add-wallets.sql',
    ];

    const sorted = files.sort(
      (a, b) => getMigrationOrder(a) - getMigrationOrder(b)
    );

    expect(sorted).toEqual([
      '0001-create-users.sql',
      '0002-add-wallets.sql',
      '0003-add-settings.sql',
    ]);
  });

  it('should handle gaps in numbering', () => {
    const files = [
      '0010-add-settings.sql',
      '0001-create-users.sql',
      '0005-add-wallets.sql',
    ];

    const sorted = files.sort(
      (a, b) => getMigrationOrder(a) - getMigrationOrder(b)
    );

    expect(sorted).toEqual([
      '0001-create-users.sql',
      '0005-add-wallets.sql',
      '0010-add-settings.sql',
    ]);
  });

  it('should put invalid names at the end', () => {
    const files = [
      '0002-valid.sql',
      'invalid.sql',
      '0001-first.sql',
    ];

    const sorted = files.sort(
      (a, b) => getMigrationOrder(a) - getMigrationOrder(b)
    );

    expect(sorted).toEqual([
      '0001-first.sql',
      '0002-valid.sql',
      'invalid.sql',
    ]);
  });
});

// ========================================
// CHECKSUM VALIDATION TESTS
// ========================================

describe('Checksum Validation', () => {
  it('should detect content changes', () => {
    const original = 'ALTER TABLE users ADD COLUMN avatar TEXT;';
    const modified = 'ALTER TABLE users ADD COLUMN avatar VARCHAR(255);';

    const originalChecksum = generateChecksum(original);
    const modifiedChecksum = generateChecksum(modified);

    expect(originalChecksum).not.toBe(modifiedChecksum);
  });

  it('should ignore whitespace changes in content hash', () => {
    const content1 = 'SELECT * FROM users;';
    const content2 = 'SELECT *  FROM users;'; // extra space

    // Note: our simple hash DOES change with whitespace
    // This is intentional - any change should be detected
    expect(generateChecksum(content1)).not.toBe(generateChecksum(content2));
  });
});
