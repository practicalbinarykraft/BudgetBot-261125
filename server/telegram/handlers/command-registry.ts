/**
 * Реестр команд Telegram бота
 *
 * Для джуна: Этот файл заменяет огромный switch-case на элегантный объект
 * 1. Все команды описаны в одном месте
 * 2. Добавить новую команду = добавить одну строку
 * 3. Автоматический dispatch по имени команды
 *
 * @example
 * // Было:
 * switch (command) {
 *   case '/start': await handleStart(bot, msg); break;
 *   case '/help': await handleHelp(bot, msg); break;
 *   // ... 20+ case
 * }
 *
 * // Стало:
 * await dispatchCommand(bot, msg, command, args);
 */

import TelegramBot from 'node-telegram-bot-api';
import {
  handleStartCommand,
  handleVerifyCommand,
  handleHelpCommand,
  handleBalanceCommand,
  handleLanguageCommand,
  handleLastCommand,
  handleIncomeCommand,
  handleStatusCommand,
  handleRecoverCommand,
} from '../commands/index';
import { handleCurrencyCommand } from '../currency-command';
import { getUserLanguageByTelegramId } from '../language';
import { t } from '@shared/i18n';

/**
 * Тип хендлера команды
 *
 * Для джуна: Каждый хендлер получает:
 * - bot: экземпляр бота для отправки сообщений
 * - msg: сообщение от пользователя
 * - args: аргументы после команды (например, /verify 123456 → args = ['123456'])
 */
type CommandHandler = (
  bot: TelegramBot,
  msg: TelegramBot.Message,
  args: string[]
) => Promise<void>;

/**
 * Реестр всех команд бота
 *
 * Для джуна: Чтобы добавить новую команду:
 * 1. Создай хендлер в commands/
 * 2. Добавь его сюда: '/mycommand': async (bot, msg, args) => await handleMyCommand(bot, msg)
 */
const commandRegistry: Record<string, CommandHandler> = {
  // Основные команды
  '/start': async (bot, msg) => await handleStartCommand(bot, msg),
  '/help': async (bot, msg) => await handleHelpCommand(bot, msg),

  // Авторизация
  '/verify': async (bot, msg, args) => await handleVerifyCommand(bot, msg, args[0] || ''),

  // Финансы
  '/balance': async (bot, msg) => await handleBalanceCommand(bot, msg),
  '/last': async (bot, msg) => await handleLastCommand(bot, msg),
  '/income': async (bot, msg, args) => await handleIncomeCommand(bot, msg, args.join(' ')),
  '/status': async (bot, msg) => await handleStatusCommand(bot, msg),

  // Настройки
  '/language': async (bot, msg) => await handleLanguageCommand(bot, msg),
  '/lang': async (bot, msg) => await handleLanguageCommand(bot, msg), // Алиас
  '/currency': async (bot, msg) => await handleCurrencyCommand(bot, msg),

  // Восстановление пароля
  '/recover': async (bot, msg) => await handleRecoverCommand(bot, msg),
  '/reset': async (bot, msg) => await handleRecoverCommand(bot, msg), // Алиас
};

/**
 * Обработать команду из сообщения
 *
 * Для джуна: Эта функция делает всю магию:
 * 1. Ищет команду в реестре
 * 2. Если нашла — вызывает хендлер
 * 3. Если не нашла — отправляет "Неизвестная команда"
 *
 * @param bot - Экземпляр бота
 * @param msg - Сообщение с командой
 * @param command - Команда (например, '/start')
 * @param args - Аргументы после команды
 * @returns true если команда обработана, false если неизвестная
 */
export async function dispatchCommand(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  command: string,
  args: string[]
): Promise<boolean> {
  const handler = commandRegistry[command.toLowerCase()];

  if (handler) {
    await handler(bot, msg, args);
    return true;
  }

  // Неизвестная команда
  const telegramId = msg.from?.id.toString();
  const lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';

  await bot.sendMessage(
    msg.chat.id,
    t('error.unknown_command', lang)
  );

  return false;
}

/**
 * Проверить, является ли текст командой
 *
 * Для джуна: Команды в Telegram начинаются с /
 */
export function isCommand(text: string): boolean {
  return text.startsWith('/');
}

/**
 * Разобрать текст команды на части
 *
 * Для джуна: Превращает "/verify 123456" в { command: '/verify', args: ['123456'] }
 */
export function parseCommand(text: string): { command: string; args: string[] } {
  const parts = text.split(' ');
  return {
    command: parts[0].toLowerCase(),
    args: parts.slice(1),
  };
}

/**
 * Получить список всех зарегистрированных команд
 *
 * Для джуна: Полезно для отладки или генерации /help
 */
export function getRegisteredCommands(): string[] {
  return Object.keys(commandRegistry);
}
