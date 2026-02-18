import { describe, it, expect } from 'vitest';
import { OPERATION_PRICING } from '../../types/billing';

describe('credits pricing i18n', () => {
  describe('OPERATION_PRICING', () => {
    it('every operation has nameRu and exampleRu fields', () => {
      for (const [key, op] of Object.entries(OPERATION_PRICING)) {
        expect(op).toHaveProperty('nameRu');
        expect(op).toHaveProperty('exampleRu');
        expect(op.nameRu).toBeTruthy();
        expect(op.exampleRu).toBeTruthy();
      }
    });
  });
});
