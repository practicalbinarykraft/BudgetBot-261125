/**
 * Telegram Bot Commands - Central Export
 *
 * Модульная архитектура команд бота:
 * - Каждая команда в отдельном файле (<200 строк)
 * - Один файл = одна ответственность
 * - Junior-friendly код
 */

// ✅ Extracted command handlers (10/12 commands)
export { handleStartCommand } from './start.command';
export { handleHelpCommand } from './help.command';
export { handleLanguageCommand } from './language.command';
export { handleVerifyCommand } from './verify.command';
export { handleBalanceCommand } from './balance.command';
export { handleLastCommand } from './last.command';
export { handleStatusCommand } from './status.command';
export { handleIncomeCommand } from './income.command';
export { handleRecoverCommand } from './recover.command';

// ✅ Extracted handlers
export { handlePhotoMessage } from './photo.handler';

// ✅ Modular text message handler (was 342 lines, now 4 files)
export { handleTextMessage } from './text-message/index';

// ✅ Modular callback query router (was 538 lines, now 5 files)
export { handleCallbackQuery } from './callbacks/index';

// Utilities
export { formatTransactionMessage } from './utils/format-transaction-message';
