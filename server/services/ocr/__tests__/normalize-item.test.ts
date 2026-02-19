import { describe, it, expect } from 'vitest';
import { normalizeItemName } from '../normalize-item';

describe('normalizeItemName', () => {
  it('lowercases text', () => {
    expect(normalizeItemName('Orange Juice')).toBe('orange juice');
  });

  it('removes volume suffixes (ml, l)', () => {
    expect(normalizeItemName('Orange Juice 1L')).toBe('orange juice');
    expect(normalizeItemName('Cola 500ml')).toBe('cola');
  });

  it('removes weight suffixes (kg, g)', () => {
    expect(normalizeItemName('Rice 5kg')).toBe('rice');
    expect(normalizeItemName('Sugar 500g')).toBe('sugar');
  });

  it('removes Russian units', () => {
    expect(normalizeItemName('Молоко 2л')).toBe('молоко');
    expect(normalizeItemName('Сахар 1кг')).toBe('сахар');
    expect(normalizeItemName('Яйца 10шт')).toBe('яйца');
  });

  it('removes numbers and special characters', () => {
    expect(normalizeItemName('Молоко 2.5%')).toBe('молоко');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeItemName('Bread   White')).toBe('bread white');
  });

  it('trims whitespace', () => {
    expect(normalizeItemName('  Milk  ')).toBe('milk');
  });
});
