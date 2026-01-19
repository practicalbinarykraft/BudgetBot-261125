/**
 * Category Detection - Maps keywords to transaction categories.
 */

import { CategoryPattern } from './types';

// Helper to create pattern from word array
const p = (words: string[]) => new RegExp(words.join('|'), 'i');

// Food keywords
const FOOD = ['еда', 'обед', 'ужин', 'завтрак', 'ланч', 'кофе', 'кофейня', 'чай', 'латте', 'капучино',
  'ресторан', 'кафе', 'столовая', 'фудкорт', 'бар', 'пицца', 'бургер', 'суши', 'роллы', 'рамен',
  'шашлык', 'шаурма', 'шава', 'донер', 'кебаб', 'гриль', 'стейк', 'мясо', 'курица',
  'макдональдс', 'макдак', 'бургер кинг', 'кфс', 'kfc', 'сабвей', 'додо', 'папа джонс',
  'шоколадница', 'старбакс', 'starbucks', 'теремок', 'тануки', 'вкусно и точка',
  'яндекс еда', 'delivery club', 'деливери', 'лавка', 'food', 'lunch', 'dinner', 'breakfast',
  'coffee', 'restaurant', 'cafe', 'pizza', 'burger', 'sushi', 'mcdonalds', 'ubereats'];

// Transport keywords
const TRANSPORT = ['такси', 'taxi', 'убер', 'uber', 'болт', 'bolt', 'ситимобил', 'яндекс такси',
  'яндекс го', 'gett', 'максим', 'везёт', 'диди', 'didi', 'grab', 'lyft', 'метро', 'metro',
  'subway', 'автобус', 'bus', 'маршрутка', 'трамвай', 'электричка', 'поезд', 'train', 'ржд',
  'каршеринг', 'делимобиль', 'яндекс драйв', 'самокат', 'scooter', 'велосипед', 'bike', 'whoosh',
  'бензин', 'газ', 'топливо', 'азс', 'заправка', 'gas', 'fuel', 'лукойл', 'газпром', 'shell',
  'парковка', 'parking', 'blablacar', 'авиа', 'самолёт', 'flight', 'аэрофлот', 's7', 'победа'];

// Entertainment keywords
const ENTERTAINMENT = ['кино', 'кинотеатр', 'cinema', 'movie', 'фильм', 'театр', 'theater', 'опера',
  'концерт', 'concert', 'шоу', 'фестиваль', 'выставка', 'музей', 'стендап', 'игра', 'game',
  'стим', 'steam', 'playstation', 'ps5', 'xbox', 'nintendo', 'донат', 'нетфликс', 'netflix',
  'кинопоиск', 'иви', 'okko', 'wink', 'ютуб премиум', 'youtube', 'twitch', 'спотифай', 'spotify',
  'яндекс музыка', 'apple music', 'клуб', 'паб', 'караоке', 'боулинг', 'бильярд', 'квест'];

// Shopping keywords
const SHOPPING = ['одежда', 'шмотки', 'clothes', 'футболка', 'джинсы', 'куртка', 'платье', 'юбка',
  'брюки', 'свитер', 'худи', 'обувь', 'shoes', 'кроссовки', 'ботинки', 'сумка', 'bag', 'рюкзак',
  'zara', 'h&m', 'uniqlo', 'mango', 'adidas', 'nike', 'puma', 'gucci', 'wildberries', 'вайлдберриз',
  'вб', 'wb', 'ozon', 'озон', 'lamoda', 'aliexpress', 'али', 'amazon', 'авито', 'покупка',
  'shopping', 'магазин', 'store', 'тц', 'mall', 'мега', 'ikea', 'икея'];

// Groceries keywords
const GROCERIES = ['продукты', 'groceries', 'молоко', 'хлеб', 'яйца', 'овощи', 'фрукты', 'мясо',
  'рыба', 'сыр', 'масло', 'сметана', 'йогурт', 'творог', 'крупа', 'рис', 'гречка', 'макароны',
  'пятёрочка', 'пятерочка', 'магнит', 'перекрёсток', 'перекресток', 'дикси', 'лента', 'ашан',
  'вкусвилл', 'азбука вкуса', 'глобус', 'окей', 'lidl', 'aldi', 'walmart', 'рынок', 'market'];

// Bills keywords
const BILLS = ['аренда', 'rent', 'квартира', 'квартплата', 'ипотека', 'коммуналка', 'жкх',
  'электричество', 'свет', 'газ', 'вода', 'отопление', 'интернет', 'internet', 'wifi',
  'ростелеком', 'билайн', 'телефон', 'phone', 'мобильный', 'мтс', 'мегафон', 'теле2', 'йота',
  'icloud', 'google one', 'dropbox', 'облако', 'счёт', 'счет', 'bill', 'штраф', 'налог', 'tax'];

// Health keywords
const HEALTH = ['врач', 'doctor', 'клиника', 'больница', 'поликлиника', 'стоматолог', 'dentist',
  'зубы', 'анализы', 'узи', 'мрт', 'аптека', 'pharmacy', 'лекарства', 'таблетки', 'витамины',
  'спортзал', 'gym', 'фитнес', 'fitness', 'тренировка', 'workout', 'тренер', 'бассейн', 'pool',
  'йога', 'yoga', 'пилатес', 'world class', 'x-fit', 'спа', 'spa', 'массаж'];

// Education keywords
const EDUCATION = ['образование', 'education', 'учёба', 'учеба', 'курсы', 'course', 'обучение',
  'школа', 'school', 'университет', 'вуз', 'репетитор', 'tutor', 'книга', 'book', 'учебник',
  'skillbox', 'geekbrains', 'нетология', 'coursera', 'udemy', 'stepik', 'яндекс практикум',
  'английский', 'english', 'язык', 'language', 'skyeng', 'duolingo'];

// Travel keywords
const TRAVEL = ['путешествие', 'travel', 'поездка', 'trip', 'отпуск', 'vacation', 'отель', 'hotel',
  'гостиница', 'хостел', 'airbnb', 'бронирование', 'booking', 'виза', 'visa', 'паспорт',
  'страховка', 'экскурсия', 'tour', 'чемодан', 'багаж', 'букинг', 'островок', 'aviasales', 'туту'];

// Personal Care keywords
const CARE = ['красота', 'beauty', 'уход', 'косметика', 'макияж', 'крем', 'шампунь', 'парфюм',
  'парикмахерская', 'барбершоп', 'салон красоты', 'стрижка', 'haircut', 'маникюр', 'педикюр',
  'ногти', 'брови', 'ресницы', 'эпиляция', 'лэтуаль', 'рив гош', 'золотое яблоко', 'sephora'];

// Pets keywords
const PETS = ['питомец', 'pet', 'животное', 'собака', 'dog', 'пёс', 'щенок', 'кот', 'cat', 'кошка',
  'котёнок', 'корм', 'вискас', 'purina', 'royal canin', 'ветеринар', 'vet', 'зоомагазин',
  'четыре лапы', 'лоток', 'наполнитель', 'поводок', 'ошейник'];

// Kids keywords
const KIDS = ['ребёнок', 'ребенок', 'child', 'дети', 'kids', 'детский сад', 'садик', 'игрушка',
  'toy', 'лего', 'подгузники', 'памперсы', 'huggies', 'детское питание', 'смесь', 'детский мир',
  'mothercare', 'кружок', 'секция', 'няня'];

// Gifts keywords
const GIFTS = ['подарок', 'gift', 'день рождения', 'birthday', 'праздник', 'цветы', 'flowers',
  'букет', 'благотворительность', 'charity', 'donation', 'пожертвование', 'фонд'];

// Home keywords
const HOME = ['мебель', 'furniture', 'диван', 'стол', 'стул', 'кровать', 'шкаф', 'hoff',
  'leroy merlin', 'леруа', 'оби', 'ремонт', 'repair', 'краска', 'обои', 'плитка', 'инструмент',
  'дрель', 'сад', 'garden', 'дача', 'растения', 'уборка', 'cleaning', 'клининг', 'химчистка'];

// Electronics keywords
const ELECTRONICS = ['электроника', 'electronics', 'техника', 'телефон', 'смартфон', 'айфон',
  'iphone', 'samsung', 'xiaomi', 'ноутбук', 'laptop', 'компьютер', 'макбук', 'планшет', 'ipad',
  'наушники', 'airpods', 'телевизор', 'tv', 'камера', 'зарядка', 'charger', 'мвидео', 'эльдорадо',
  'dns', 'ситилинк', 'технопарк'];

// Services keywords
const SERVICES = ['услуга', 'service', 'доставка', 'delivery', 'курьер', 'мастер', 'сантехник',
  'электрик', 'нотариус', 'юрист', 'адвокат', 'переводчик', 'фотограф', 'типография', 'печать'];

// Subscriptions keywords
const SUBSCRIPTIONS = ['подписка', 'subscription', 'premium', 'премиум', 'pro', 'chatgpt', 'gpt',
  'notion', 'vpn', 'антивирус', 'kaspersky', 'adobe', 'photoshop', 'figma', 'microsoft', 'office',
  'github', 'copilot'];

// All category patterns
export const CATEGORY_PATTERNS: CategoryPattern[] = [
  { category: 'Food & Dining', pattern: p(FOOD) },
  { category: 'Transport', pattern: p(TRANSPORT) },
  { category: 'Entertainment', pattern: p(ENTERTAINMENT) },
  { category: 'Shopping', pattern: p(SHOPPING) },
  { category: 'Groceries', pattern: p(GROCERIES) },
  { category: 'Bills & Utilities', pattern: p(BILLS) },
  { category: 'Health', pattern: p(HEALTH) },
  { category: 'Education', pattern: p(EDUCATION) },
  { category: 'Travel', pattern: p(TRAVEL) },
  { category: 'Personal Care', pattern: p(CARE) },
  { category: 'Pets', pattern: p(PETS) },
  { category: 'Kids', pattern: p(KIDS) },
  { category: 'Gifts & Donations', pattern: p(GIFTS) },
  { category: 'Home & Garden', pattern: p(HOME) },
  { category: 'Electronics', pattern: p(ELECTRONICS) },
  { category: 'Services', pattern: p(SERVICES) },
  { category: 'Subscriptions', pattern: p(SUBSCRIPTIONS) },
];

/**
 * Find category by exact pattern match
 */
export function findCategory(text: string): string | null {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return null;
}
