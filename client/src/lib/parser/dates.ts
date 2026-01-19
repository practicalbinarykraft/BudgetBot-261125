/**
 * Date Parser
 *
 * Extracts dates from natural language.
 * Supports relative dates (yesterday, last Monday) and absolute dates.
 */

import { DateParseResult } from './types';

// Month names (Russian)
const MONTHS_RU: Record<string, number> = {
  'января': 0, 'январь': 0, 'янв': 0,
  'февраля': 1, 'февраль': 1, 'фев': 1,
  'марта': 2, 'март': 2, 'мар': 2,
  'апреля': 3, 'апрель': 3, 'апр': 3,
  'мая': 4, 'май': 4,
  'июня': 5, 'июнь': 5, 'июн': 5,
  'июля': 6, 'июль': 6, 'июл': 6,
  'августа': 7, 'август': 7, 'авг': 7,
  'сентября': 8, 'сентябрь': 8, 'сен': 8, 'сент': 8,
  'октября': 9, 'октябрь': 9, 'окт': 9,
  'ноября': 10, 'ноябрь': 10, 'ноя': 10,
  'декабря': 11, 'декабрь': 11, 'дек': 11,
};

// Month names (English)
const MONTHS_EN: Record<string, number> = {
  'january': 0, 'jan': 0, 'february': 1, 'feb': 1,
  'march': 2, 'mar': 2, 'april': 3, 'apr': 3,
  'may': 4, 'june': 5, 'jun': 5, 'july': 6, 'jul': 6,
  'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'sept': 8,
  'october': 9, 'oct': 9, 'november': 10, 'nov': 10,
  'december': 11, 'dec': 11,
};

// Weekdays (Russian)
const WEEKDAYS_RU: Record<string, number> = {
  'понедельник': 1, 'пн': 1,
  'вторник': 2, 'вт': 2,
  'среда': 3, 'среду': 3, 'ср': 3,
  'четверг': 4, 'чт': 4,
  'пятница': 5, 'пятницу': 5, 'пт': 5,
  'суббота': 6, 'субботу': 6, 'сб': 6,
  'воскресенье': 0, 'воскресенью': 0, 'вс': 0,
};

// Weekdays (English)
const WEEKDAYS_EN: Record<string, number> = {
  'monday': 1, 'mon': 1, 'tuesday': 2, 'tue': 2, 'tues': 2,
  'wednesday': 3, 'wed': 3, 'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
  'friday': 5, 'fri': 5, 'saturday': 6, 'sat': 6, 'sunday': 0, 'sun': 0,
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get last weekday (e.g., last Monday)
 */
function getLastWeekday(targetDay: number): Date {
  const today = new Date();
  const current = today.getDay();
  let diff = current - targetDay;
  if (diff <= 0) diff += 7;
  const result = new Date(today);
  result.setDate(today.getDate() - diff);
  return result;
}

/**
 * Parse date from text
 */
export function parseDate(text: string): DateParseResult | null {
  const lower = text.toLowerCase();
  const today = new Date();

  // 1. Today / Yesterday / Day before yesterday
  if (/\bсегодня\b|\btoday\b/i.test(lower)) {
    return { date: formatISO(today), matchedText: lower.match(/сегодня|today/i)![0] };
  }

  if (/\bвчера\b|\byesterday\b/i.test(lower)) {
    const d = new Date(today);
    d.setDate(today.getDate() - 1);
    return { date: formatISO(d), matchedText: lower.match(/вчера|yesterday/i)![0] };
  }

  if (/\bпозавчера\b/i.test(lower)) {
    const d = new Date(today);
    d.setDate(today.getDate() - 2);
    return { date: formatISO(d), matchedText: 'позавчера' };
  }

  // 2. "X days/weeks/months ago"
  const agoMatch = lower.match(/(\d+)\s*(?:день|дня|дней|day|days)\s*назад/i) ||
                   lower.match(/(\d+)\s*(?:неделю|недели|недель|week|weeks)\s*назад/i) ||
                   lower.match(/(\d+)\s*(?:месяц|месяца|месяцев|month|months)\s*назад/i);

  if (agoMatch) {
    const num = parseInt(agoMatch[1]);
    const result = new Date(today);
    if (/день|дня|дней|day|days/i.test(agoMatch[0])) result.setDate(today.getDate() - num);
    else if (/неделю|недели|недель|week|weeks/i.test(agoMatch[0])) result.setDate(today.getDate() - num * 7);
    else result.setMonth(today.getMonth() - num);
    return { date: formatISO(result), matchedText: agoMatch[0] };
  }

  // "week ago" / "month ago" (without number)
  if (/неделю\s*назад|week\s*ago/i.test(lower)) {
    const d = new Date(today);
    d.setDate(today.getDate() - 7);
    return { date: formatISO(d), matchedText: lower.match(/неделю\s*назад|week\s*ago/i)![0] };
  }

  if (/месяц\s*назад|month\s*ago/i.test(lower)) {
    const d = new Date(today);
    d.setMonth(today.getMonth() - 1);
    return { date: formatISO(d), matchedText: lower.match(/месяц\s*назад|month\s*ago/i)![0] };
  }

  // 3. Weekday: "on Monday", "в понедельник"
  for (const [name, dayNum] of Object.entries(WEEKDAYS_RU)) {
    const pattern = new RegExp(`(?:в|во)?\\s*${name}\\b`, 'i');
    if (pattern.test(lower)) {
      const date = getLastWeekday(dayNum);
      return { date: formatISO(date), matchedText: lower.match(pattern)![0] };
    }
  }

  for (const [name, dayNum] of Object.entries(WEEKDAYS_EN)) {
    const pattern = new RegExp(`(?:on\\s+)?${name}\\b`, 'i');
    if (pattern.test(lower)) {
      const date = getLastWeekday(dayNum);
      return { date: formatISO(date), matchedText: lower.match(pattern)![0] };
    }
  }

  // 4. Date with month: "15 января", "15 jan", "jan 15"
  for (const [monthName, monthNum] of Object.entries(MONTHS_RU)) {
    const pattern = new RegExp(`(\\d{1,2})\\s*${monthName}`, 'i');
    const match = lower.match(pattern);
    if (match) {
      const day = parseInt(match[1]);
      const year = today.getFullYear();
      const date = new Date(year, monthNum, day);
      if (date > today) date.setFullYear(year - 1);
      return { date: formatISO(date), matchedText: match[0] };
    }
  }

  for (const [monthName, monthNum] of Object.entries(MONTHS_EN)) {
    const pattern = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s*${monthName}|${monthName}\\s*(\\d{1,2})(?:st|nd|rd|th)?`, 'i');
    const match = lower.match(pattern);
    if (match) {
      const day = parseInt(match[1] || match[2]);
      const year = today.getFullYear();
      const date = new Date(year, monthNum, day);
      if (date > today) date.setFullYear(year - 1);
      return { date: formatISO(date), matchedText: match[0] };
    }
  }

  // 5. Numeric formats: DD.MM, DD/MM, DD-MM
  const numMatch = lower.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);
  if (numMatch) {
    const day = parseInt(numMatch[1]);
    const month = parseInt(numMatch[2]) - 1;
    let year = numMatch[3] ? parseInt(numMatch[3]) : today.getFullYear();
    if (year < 100) year += year > 50 ? 1900 : 2000;

    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const date = new Date(year, month, day);
      if (date > today && !numMatch[3]) date.setFullYear(today.getFullYear() - 1);
      return { date: formatISO(date), matchedText: numMatch[0] };
    }
  }

  return null;
}
