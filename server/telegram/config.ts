export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_TTL_MINUTES = 10;

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food & Drinks': [
    'еда', 'food', 'напиток', 'drink', 'кофе', 'coffee', 'ресторан', 'restaurant',
    'кафе', 'cafe', 'бар', 'bar', 'пицца', 'pizza', 'бургер', 'burger',
    'обед', 'lunch', 'ужин', 'dinner', 'завтрак', 'breakfast',
    'макдоналдс', 'mcdonalds', 'kfc', 'subway', 'starbucks',
    'продукты', 'groceries', 'магазин', 'store', 'супермаркет', 'supermarket'
  ],
  'Transport': [
    'такси', 'taxi', 'uber', 'яндекс', 'yandex', 'метро', 'metro', 'subway',
    'автобус', 'bus', 'транспорт', 'transport', 'бензин', 'gas', 'gasoline',
    'заправка', 'fuel', 'парковка', 'parking', 'toll', 'проезд', 'fare'
  ],
  'Shopping': [
    'одежда', 'clothes', 'обувь', 'shoes', 'магазин', 'shop', 'shopping',
    'покупка', 'purchase', 'али', 'ali', 'amazon', 'wildberries', 'ozon',
    'zara', 'h&m', 'nike', 'adidas', 'электроника', 'electronics'
  ],
  'Entertainment': [
    'кино', 'cinema', 'movie', 'театр', 'theater', 'концерт', 'concert',
    'игра', 'game', 'развлечение', 'entertainment', 'spotify', 'netflix',
    'youtube', 'steam', 'playstation', 'xbox', 'подписка', 'subscription'
  ],
  'Bills': [
    'счет', 'bill', 'коммунальные', 'utilities', 'интернет', 'internet',
    'телефон', 'phone', 'мобильный', 'mobile', 'электричество', 'electricity',
    'вода', 'water', 'газ', 'gas', 'квартплата', 'rent', 'аренда', 'rental'
  ],
  'Salary': [
    'зарплата', 'salary', 'зп', 'wage', 'доход', 'income', 'payment',
    'оплата труда', 'paycheck', 'получка'
  ],
  'Freelance': [
    'фриланс', 'freelance', 'проект', 'project', 'заказ', 'order',
    'гонорар', 'fee', 'upwork', 'fiverr', 'freelancer'
  ]
};

export const DEFAULT_CATEGORY_EXPENSE = 'Unaccounted';
export const DEFAULT_CATEGORY_INCOME = 'Salary';

export const HELP_TEXT = `
📊 *Budget Buddy - Telegram Bot Commands*

*Quick Expense Tracking:*
Just send a message in any format:
• \`100 coffee\` - $100 on coffee
• \`50 taxi uber\` - $50 on taxi
• \`1500₽ обед\` - 1500₽ on lunch
• \`200000₹ shopping\` - 200000 IDR shopping

Supported currencies: $ (USD), ₽ (RUB), ₹ (IDR)

*Receipt Scanning:*
📸 Send a photo of your receipt - AI will extract the amount and description!

*Commands:*
/start - Welcome message
/verify <code> - Link your Telegram to Budget Buddy account
/balance - View all wallet balances
/help - Show this message

*Need a verification code?*
Go to Settings in Budget Buddy web app → Telegram section → Generate Code
`;

export const WELCOME_TEXT = `
👋 Welcome to Budget Buddy!

I help you track expenses quickly:
• Send me text: \`100 coffee\`
• Send me a receipt photo 📸

To get started, link your account:
1. Open Budget Buddy web app
2. Go to Settings → Telegram
3. Generate verification code
4. Send me: \`/verify <code>\`

Type /help for more info!
`;

export const VERIFICATION_SUCCESS_TEXT = `
✅ *Account linked successfully!*

You can now:
• Send expenses: \`100 coffee\`
• Send receipt photos 📸
• Check balance: /balance

Type /help to see all features!
`;

export const NOT_VERIFIED_TEXT = `
⚠️ Please link your account first!

1. Open Budget Buddy web app
2. Go to Settings → Telegram
3. Generate verification code
4. Send: \`/verify <code>\`
`;
