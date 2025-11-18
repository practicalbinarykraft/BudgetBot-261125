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
    en: '💰 *PRICE FORMATS*\n\n*Rupiah (IDR):*\n- `5000` = 5 thousand\n- `5k` = 5 thousand\n- `5,000` = 5 thousand\n- `32.5k` = 32,500\n\n*Dollars (USD):*\n- `$6.70` = 6 dollars 70 cents\n- `$1000` or `1000 USD`\n\n*Rubles (RUB):*\n- `5000₽` or `5k RUB`\n\n*Tip:* Use "k" for thousands!\n`5k` is faster than `5000`',
    ru: '💰 *ФОРМАТЫ ЦЕН*\n\n*Рупии (IDR):*\n- `5000` = 5 тысяч\n- `5к` = 5 тысяч\n- `5,000` = 5 тысяч\n- `32.5к` = 32,500\n\n*Доллары (USD):*\n- `$6.70` = 6 долларов 70 центов\n- `$1000` или `1000 USD`\n\n*Рубли (RUB):*\n- `5000₽` или `5к RUB`\n\n*Совет:* Используй "к" вместо тысяч!\n`5к` быстрее чем `5000`',
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
