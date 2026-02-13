import { describe, it, expect } from 'vitest';
import {
  detectCurrencyFromText,
  extractAmountFromText,
  cleanDescription,
  detectTypeFromText,
} from '../services/voice-parse-utils';

describe('detectCurrencyFromText', () => {
  it('detects RUB from "рублей"', () => {
    expect(detectCurrencyFromText('шашлык 500 рублей')).toBe('RUB');
  });
  it('detects RUB from "руб"', () => {
    expect(detectCurrencyFromText('кофе 300 руб')).toBe('RUB');
  });
  it('detects RUB from "₽"', () => {
    expect(detectCurrencyFromText('такси 200₽')).toBe('RUB');
  });
  it('detects USD from "долларов"', () => {
    expect(detectCurrencyFromText('обед 15 долларов')).toBe('USD');
  });
  it('detects USD from "$"', () => {
    expect(detectCurrencyFromText('coffee $5')).toBe('USD');
  });
  it('detects USD from "баксов"', () => {
    expect(detectCurrencyFromText('50 баксов за такси')).toBe('USD');
  });
  it('detects EUR from "евро"', () => {
    expect(detectCurrencyFromText('пицца 12 евро')).toBe('EUR');
  });
  it('detects IDR from "рупий"', () => {
    expect(detectCurrencyFromText('наси горенг 50000 рупий')).toBe('IDR');
  });
  it('detects IDR from "ribu"', () => {
    expect(detectCurrencyFromText('nasi goreng 50 ribu')).toBe('IDR');
  });
  it('detects KRW from "вон"', () => {
    expect(detectCurrencyFromText('кимчи 8000 вон')).toBe('KRW');
  });
  it('detects CNY from "юаней"', () => {
    expect(detectCurrencyFromText('лапша 30 юаней')).toBe('CNY');
  });
  it('returns null when no currency', () => {
    expect(detectCurrencyFromText('шашлык 500')).toBeNull();
  });
  it('is case insensitive', () => {
    expect(detectCurrencyFromText('Шашлык 500 Рублей')).toBe('RUB');
  });
});

describe('extractAmountFromText', () => {
  it('extracts simple number', () => {
    expect(extractAmountFromText('шашлык 500 рублей')).toBe(500);
  });
  it('extracts number with spaces (thousands)', () => {
    expect(extractAmountFromText('пицца 50 000 рупий')).toBe(50000);
  });
  it('extracts decimal', () => {
    expect(extractAmountFromText('coffee 5.50 dollars')).toBe(5.5);
  });
  it('extracts first number', () => {
    expect(extractAmountFromText('2 кофе по 300 рублей')).toBe(2);
  });
  it('returns null for no numbers', () => {
    expect(extractAmountFromText('кофе')).toBeNull();
  });
});

describe('cleanDescription', () => {
  it('removes amount and currency words', () => {
    expect(cleanDescription('Шашлык 500 рублей')).toBe('Шашлык');
  });
  it('removes dollar words', () => {
    expect(cleanDescription('coffee 5 dollars')).toBe('coffee');
  });
  it('removes ₽ symbol', () => {
    expect(cleanDescription('такси 200₽')).toBe('такси');
  });
  it('removes "за" preposition', () => {
    expect(cleanDescription('купил кофе за 300 рублей')).toBe('купил кофе');
  });
  it('handles multiple spaces', () => {
    expect(cleanDescription('  шашлык  500  рублей  ')).toBe('шашлык');
  });
  it('keeps description when only amount present', () => {
    expect(cleanDescription('кофе 300')).toBe('кофе');
  });
});

describe('detectTypeFromText', () => {
  it('defaults to expense', () => {
    expect(detectTypeFromText('шашлык 500 рублей')).toBe('expense');
  });
  it('detects income from "зарплата"', () => {
    expect(detectTypeFromText('зарплата 100000 рублей')).toBe('income');
  });
  it('detects income from "получил"', () => {
    expect(detectTypeFromText('получил 500 долларов')).toBe('income');
  });
  it('detects income from "salary"', () => {
    expect(detectTypeFromText('salary 5000 dollars')).toBe('income');
  });
});
