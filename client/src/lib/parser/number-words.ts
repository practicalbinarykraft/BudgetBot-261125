/**
 * Number Words Parser - Converts text numbers to digits.
 * Supports Russian and English. Examples: "триста" → 300, "five hundred" → 500
 */

import { WordNumberResult, WordNumberMatch } from './types';

// Russian numbers
const RU_UNITS: Record<string, number> = {
  'ноль': 0, 'нуль': 0, 'один': 1, 'одна': 1, 'одну': 1, 'одно': 1,
  'два': 2, 'две': 2, 'двух': 2, 'три': 3, 'трёх': 3, 'трех': 3,
  'четыре': 4, 'четырёх': 4, 'четырех': 4, 'пять': 5, 'пяти': 5,
  'шесть': 6, 'шести': 6, 'семь': 7, 'семи': 7, 'восемь': 8, 'восьми': 8,
  'девять': 9, 'девяти': 9, 'десять': 10, 'десяти': 10, 'одиннадцать': 11,
  'двенадцать': 12, 'тринадцать': 13, 'четырнадцать': 14, 'пятнадцать': 15,
  'шестнадцать': 16, 'семнадцать': 17, 'восемнадцать': 18, 'девятнадцать': 19,
};

const RU_TENS: Record<string, number> = {
  'двадцать': 20, 'двадцати': 20, 'тридцать': 30, 'тридцати': 30,
  'сорок': 40, 'сорока': 40, 'пятьдесят': 50, 'шестьдесят': 60,
  'семьдесят': 70, 'восемьдесят': 80, 'девяносто': 90, 'девяноста': 90,
};

const RU_HUNDREDS: Record<string, number> = {
  'сто': 100, 'ста': 100, 'двести': 200, 'двухсот': 200,
  'триста': 300, 'трёхсот': 300, 'трехсот': 300, 'четыреста': 400,
  'пятьсот': 500, 'пятисот': 500, 'шестьсот': 600, 'семьсот': 700,
  'восемьсот': 800, 'девятьсот': 900, 'девятисот': 900,
};

const RU_MULT: Record<string, number> = {
  'тысяча': 1000, 'тысячи': 1000, 'тысяч': 1000, 'тыс': 1000, 'тыщ': 1000,
  'миллион': 1e6, 'миллиона': 1e6, 'миллионов': 1e6, 'млн': 1e6,
  'миллиард': 1e9, 'миллиарда': 1e9, 'миллиардов': 1e9, 'млрд': 1e9,
};

const RU_SLANG: Record<string, number> = {
  'полтинник': 50, 'полтос': 50, 'сотка': 100, 'сотня': 100, 'соточка': 100,
  'косарь': 1000, 'кусок': 1000, 'штука': 1000, 'тонна': 1000,
  'пятихатка': 500, 'пятихат': 500, 'червонец': 10, 'четвертак': 25,
  'полторы': 1.5, 'полтора': 1.5, 'пол': 0.5,
};

// English numbers
const EN_UNITS: Record<string, number> = {
  'zero': 0, 'one': 1, 'a': 1, 'an': 1, 'two': 2, 'three': 3, 'four': 4,
  'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
};

const EN_TENS: Record<string, number> = {
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
  'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
};

const EN_MULT: Record<string, number> = {
  'hundred': 100, 'thousand': 1000, 'k': 1000, 'grand': 1000,
  'million': 1e6, 'm': 1e6, 'mil': 1e6, 'billion': 1e9, 'b': 1e9,
};

const EN_SLANG: Record<string, number> = {
  'half': 0.5, 'quarter': 0.25, 'dozen': 12, 'buck': 1, 'bucks': 1,
};

/**
 * Parse text number to digits
 */
export function parseWordNumber(text: string): WordNumberResult | null {
  const words = text.toLowerCase().split(/\s+/);

  // Check slang first
  for (const word of words) {
    if (RU_SLANG[word] !== undefined) {
      const idx = words.indexOf(word);
      if (['полторы', 'полтора', 'пол'].includes(word) && idx < words.length - 1) {
        const next = words[idx + 1];
        if (RU_MULT[next]) return { value: RU_SLANG[word] * RU_MULT[next], matchedText: `${word} ${next}` };
      }
      if (!['полторы', 'полтора', 'пол'].includes(word)) return { value: RU_SLANG[word], matchedText: word };
    }
    if (EN_SLANG[word] && !['half', 'quarter', 'bucks', 'buck'].includes(word)) {
      return { value: EN_SLANG[word], matchedText: word };
    }
  }

  // Parse compound numbers
  let result = 0, current = 0;
  const matched: string[] = [];
  let hasMatch = false;

  for (const word of words) {
    let ok = false;
    // Russian
    if (RU_UNITS[word] !== undefined) { current += RU_UNITS[word]; ok = true; }
    else if (RU_TENS[word] !== undefined) { current += RU_TENS[word]; ok = true; }
    else if (RU_HUNDREDS[word] !== undefined) { current += RU_HUNDREDS[word]; ok = true; }
    else if (RU_MULT[word] !== undefined) {
      if (current === 0) current = 1;
      current *= RU_MULT[word];
      if (RU_MULT[word] >= 1000) { result += current; current = 0; }
      ok = true;
    }
    // English
    if (EN_UNITS[word] !== undefined) { current += EN_UNITS[word]; ok = true; }
    else if (EN_TENS[word] !== undefined) { current += EN_TENS[word]; ok = true; }
    else if (EN_MULT[word] !== undefined) {
      if (current === 0) current = 1;
      if (word === 'hundred') current *= 100;
      else { current *= EN_MULT[word]; if (EN_MULT[word] >= 1000) { result += current; current = 0; } }
      ok = true;
    }
    if (ok) { matched.push(word); hasMatch = true; }
    else if (hasMatch && matched.length > 0) break;
  }

  result += current;
  return hasMatch && result > 0 ? { value: result, matchedText: matched.join(' ') } : null;
}

/**
 * Find word number in text with position
 */
export function findWordNumber(text: string): WordNumberMatch | null {
  const lower = text.toLowerCase();
  const allWords = [
    ...Object.keys(RU_UNITS), ...Object.keys(RU_TENS), ...Object.keys(RU_HUNDREDS),
    ...Object.keys(RU_MULT), ...Object.keys(RU_SLANG),
    ...Object.keys(EN_UNITS), ...Object.keys(EN_TENS), ...Object.keys(EN_MULT), ...Object.keys(EN_SLANG),
  ].sort((a, b) => b.length - a.length);

  let best: WordNumberMatch | null = null;
  for (const w of allWords) {
    const m = lower.match(new RegExp(`\\b${w}\\b`, 'i'));
    if (m?.index !== undefined) {
      const p = parseWordNumber(text.substring(m.index));
      if (p && (best === null || m.index < best.startIndex)) best = { ...p, startIndex: m.index };
    }
  }
  return best;
}
