import {
  detectCurrency,
  extractAmount,
  cleanDescription,
  fixVoiceParsedResult,
} from '../../lib/voice-parse-utils';

describe('detectCurrency', () => {
  it('"шашлык 500 рублей" → RUB', () => {
    expect(detectCurrency('шашлык 500 рублей')).toBe('RUB');
  });
  it('"кофе 300 руб" → RUB', () => {
    expect(detectCurrency('кофе 300 руб')).toBe('RUB');
  });
  it('"такси 200₽" → RUB', () => {
    expect(detectCurrency('такси 200₽')).toBe('RUB');
  });
  it('"coffee 5 dollars" → USD', () => {
    expect(detectCurrency('coffee 5 dollars')).toBe('USD');
  });
  it('"50 баксов" → USD', () => {
    expect(detectCurrency('50 баксов')).toBe('USD');
  });
  it('"пицца 12 евро" → EUR', () => {
    expect(detectCurrency('пицца 12 евро')).toBe('EUR');
  });
  it('"наси горенг 50000 рупий" → IDR', () => {
    expect(detectCurrency('наси горенг 50000 рупий')).toBe('IDR');
  });
  it('"шашлык 500" → null (no currency)', () => {
    expect(detectCurrency('шашлык 500')).toBeNull();
  });
});

describe('extractAmount', () => {
  it('"шашлык 500 рублей" → "500"', () => {
    expect(extractAmount('шашлык 500 рублей')).toBe('500');
  });
  it('"пицца 50 000 рупий" → "50000"', () => {
    expect(extractAmount('пицца 50 000 рупий')).toBe('50000');
  });
  it('"coffee 5.50" → "5.50"', () => {
    expect(extractAmount('coffee 5.50 dollars')).toBe('5.50');
  });
  it('"кофе" → null', () => {
    expect(extractAmount('кофе')).toBeNull();
  });
});

describe('cleanDescription', () => {
  it('"Шашлык 500 рублей" → "Шашлык"', () => {
    expect(cleanDescription('Шашлык 500 рублей')).toBe('Шашлык');
  });
  it('"coffee 5 dollars" → "coffee"', () => {
    expect(cleanDescription('coffee 5 dollars')).toBe('coffee');
  });
  it('"такси 200₽" → "такси"', () => {
    expect(cleanDescription('такси 200₽')).toBe('такси');
  });
  it('"купил кофе за 300 рублей" → "купил кофе"', () => {
    expect(cleanDescription('купил кофе за 300 рублей')).toBe('купил кофе');
  });
});

describe('fixVoiceParsedResult', () => {
  it('overrides server USD with detected RUB', () => {
    const server = {
      amount: '500',
      currency: 'USD',
      description: 'Шашлык 500 рублей',
      type: 'expense' as const,
    };
    const result = fixVoiceParsedResult(server, 'Шашлык 500 рублей');
    expect(result.currency).toBe('RUB');
    expect(result.amount).toBe('500');
    expect(result.description).toBe('Шашлык');
  });

  it('keeps server currency when no currency in text', () => {
    const server = {
      amount: '500',
      currency: 'USD',
      description: 'шашлык',
      type: 'expense' as const,
    };
    const result = fixVoiceParsedResult(server, 'шашлык 500');
    expect(result.currency).toBe('USD');
  });

  it('detects income from "зарплата"', () => {
    const server = {
      amount: '100000',
      currency: 'USD',
      description: 'зарплата 100000 рублей',
      type: 'expense' as const,
    };
    const result = fixVoiceParsedResult(server, 'зарплата 100000 рублей');
    expect(result.type).toBe('income');
    expect(result.currency).toBe('RUB');
  });

  it('preserves category from server', () => {
    const server = {
      amount: '500',
      currency: 'USD',
      description: 'шашлык 500 рублей',
      category: 'Food & Drinks',
      type: 'expense' as const,
    };
    const result = fixVoiceParsedResult(server, 'шашлык 500 рублей');
    expect(result.category).toBe('Food & Drinks');
  });
});
