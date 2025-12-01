/**
 * Help & Commands translations
 */

import { Translations } from './types';

export const helpTranslations: Translations = {
  'help.title': {
    en: '📚 *BUDGET BUDDY GUIDE*',
    ru: '📚 *СПРАВКА BUDGET BUDDY*',
  },
  'help.shopping_lists': {
    en: '🛒 *SHOPPING LISTS*\n\n*Format 1 (comma-separated):*\n`Pepito: bread 5k, milk 12k, eggs 18k`\n\n*Format 2 (multiline):*\n`Moris:\nbread 5000\nmilk 12000\neggs 18000`\n\n*Format 3 (without colon):*\n`pepito\nbread 5000\nmilk 12000`',
    ru: '🛒 *СПИСКИ ПОКУПОК*\n\n*Формат 1 (через запятую):*\n`Pepito: хлеб 5к, молоко 12к, яйца 18к`\n\n*Формат 2 (многострочно):*\n`Moris:\nхлеб 5000\nмолоко 12000\nяйца 18000`\n\n*Формат 3 (без двоеточия):*\n`пепито\nхлеб 5000\nмолоко 12000`',
  },
  'help.currency_formats': {
    en: '💰 *PRICE FORMATS*\n\n*Thousands:*\n- `200000` = 200 thousand\n- `200k` or `200к` = 200 thousand\n- `200.000` = 200 thousand\n- `200,000` = 200 thousand\n- `1.500.000` = 1.5 million\n\n*Decimals:*\n- `12.50` = 12 dollars 50 cents\n- `$6.70` = 6 dollars 70 cents\n\n*Currencies:*\n- `200.000 IDR` = rupiah\n- `$100` or `100 USD` = dollars\n- `5000₽` or `5k RUB` = rubles\n\n*Tip:* Use "k" for thousands!\n`200k` is faster than `200000`',
    ru: '💰 *ФОРМАТЫ ЦЕН*\n\n*Тысячи:*\n- `200000` = 200 тысяч\n- `200k` или `200к` = 200 тысяч\n- `200.000` = 200 тысяч\n- `200,000` = 200 тысяч\n- `1.500.000` = 1.5 миллиона\n\n*Дробные:*\n- `12.50` = 12 долларов 50 центов\n- `$6.70` = 6 долларов 70 центов\n\n*Валюты:*\n- `200.000 IDR` = рупии\n- `$100` или `100 USD` = доллары\n- `5000₽` или `5к RUB` = рубли\n\n*Совет:* Используй "к" вместо тысяч!\n`200к` быстрее чем `200000`',
  },
  'help.other_ways': {
    en: '📸 *OTHER WAYS TO ADD*\n\n*Receipt Photo:*\nSend photo - bot recognizes all items!\n\n*Quick Text:*\n`100 coffee` or `1500₽ taxi`\n\n*Quick Income:*\n`/income 100000 IDR salary`',
    ru: '📸 *ДРУГИЕ СПОСОБЫ*\n\n*Фото чека:*\nОтправь фото - бот распознает все товары!\n\n*Быстрый текст:*\n`100 coffee` или `1500₽ такси`\n\n*Быстрый доход:*\n`/income 100000 IDR зарплата`',
  },
  'help.commands': {
    en: '⚡️ *COMMANDS*\n\n/start - welcome message\n/verify <code> - connect account\n/balance - wallet balances\n/last - last 10 transactions\n/income <text> - add income\n/status - account status\n/language - change language\n/help - this guide',
    ru: '⚡️ *КОМАНДЫ*\n\n/start - приветствие\n/verify <код> - подключить аккаунт\n/balance - балансы кошельков\n/last - последние 10 транзакций\n/income <текст> - добавить доход\n/status - статус аккаунта\n/language - сменить язык\n/help - эта справка',
  },
  'help.quick_add': {
    en: '*Quick Add:*\nJust send: `100 coffee` or `1500₽ taxi`',
    ru: '*Быстрое добавление:*\nПросто отправьте: `100 coffee` или `1500₽ такси`',
  },
  'help.receipt_scan': {
    en: '*Receipt Scan:*\nSend a photo of your receipt',
    ru: '*Сканирование чека:*\nОтправьте фото вашего чека',
  },
};
