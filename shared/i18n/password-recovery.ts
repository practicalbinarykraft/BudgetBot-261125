/**
 * Password Recovery translations
 * Used for Telegram messages and Web UI
 */

import { Translations } from './types';

export const passwordRecoveryTranslations: Translations = {
  'password_recovery.telegram_title': {
    en: '🔐 Password Recovery',
    ru: '🔐 Восстановление пароля',
  },
  'password_recovery.telegram_code': {
    en: 'Your recovery code',
    ru: 'Ваш код восстановления',
  },
  'password_recovery.telegram_expiry': {
    en: 'Valid for',
    ru: 'Действителен',
  },
  'password_recovery.minutes': {
    en: 'minutes',
    ru: 'минут',
  },
  'password_recovery.telegram_warning': {
    en: '⚠️ Do not share this code with anyone',
    ru: '⚠️ Не сообщайте этот код никому',
  },
  'password_recovery.request_success': {
    en: 'Recovery code sent successfully',
    ru: 'Код восстановления успешно отправлен',
  },
  'password_recovery.request_error': {
    en: 'Failed to send recovery code',
    ru: 'Не удалось отправить код восстановления',
  },
  'password_recovery.code_verified': {
    en: 'Code verified successfully',
    ru: 'Код успешно подтвержден',
  },
  'password_recovery.verify_success': {
    en: '✅ Code verified!',
    ru: '✅ Код подтвержден!',
  },
  'password_recovery.verify_error': {
    en: '❌ Invalid code',
    ru: '❌ Неверный код',
  },
  'password_recovery.code_invalid': {
    en: 'Invalid or expired code',
    ru: 'Неверный или истекший код',
  },
  'password_recovery.password_reset_success': {
    en: 'Password reset successfully',
    ru: 'Пароль успешно изменен',
  },
  'password_recovery.reset_success': {
    en: '✅ Password reset!',
    ru: '✅ Пароль сброшен!',
  },
  'password_recovery.reset_error': {
    en: '❌ Error',
    ru: '❌ Ошибка',
  },
  'password_recovery.password_reset_error': {
    en: 'Failed to reset password',
    ru: 'Не удалось изменить пароль',
  },
  'password_recovery.user_not_found': {
    en: 'User not found',
    ru: 'Пользователь не найден',
  },
  'password_recovery.no_recovery_method': {
    en: 'No recovery method available. Please link Telegram account.',
    ru: 'Нет доступного способа восстановления. Пожалуйста, свяжите аккаунт Telegram.',
  },
  // Frontend form translations
  'password_recovery.title': {
    en: 'Password Recovery',
    ru: 'Восстановление пароля',
  },
  'password_recovery.email_or_telegram': {
    en: 'Email or Telegram ID',
    ru: 'Email или Telegram ID',
  },
  'password_recovery.email_or_telegram_required': {
    en: 'Email or Telegram ID is required',
    ru: 'Требуется email или Telegram ID',
  },
  'password_recovery.email_or_telegram_description': {
    en: 'Enter your email address or Telegram ID',
    ru: 'Введите ваш email или Telegram ID',
  },
  'password_recovery.email_or_telegram_placeholder': {
    en: 'email@example.com or 123456789',
    ru: 'email@example.com или 123456789',
  },
  'password_recovery.request_code': {
    en: 'Request Recovery Code',
    ru: 'Запросить код восстановления',
  },
  'password_recovery.requesting': {
    en: 'Requesting...',
    ru: 'Запрос...',
  },
  'password_recovery.enter_code': {
    en: 'Recovery Code',
    ru: 'Код восстановления',
  },
  'password_recovery.code_description': {
    en: 'Enter the 6-digit code sent to your Telegram',
    ru: 'Введите 6-значный код, отправленный в ваш Telegram',
  },
  'password_recovery.code_length': {
    en: 'Code must be exactly 6 digits',
    ru: 'Код должен содержать ровно 6 цифр',
  },
  'password_recovery.code_numeric': {
    en: 'Code must contain only numbers',
    ru: 'Код должен содержать только цифры',
  },
  'password_recovery.verify_code': {
    en: 'Verify Code',
    ru: 'Подтвердить код',
  },
  'password_recovery.verifying': {
    en: 'Verifying...',
    ru: 'Проверка...',
  },
  'password_recovery.new_password': {
    en: 'New Password',
    ru: 'Новый пароль',
  },
  'password_recovery.password_requirements': {
    en: 'At least 8 characters',
    ru: 'Минимум 8 символов',
  },
  'password_recovery.password_min_length': {
    en: 'Password must be at least 8 characters',
    ru: 'Пароль должен содержать минимум 8 символов',
  },
  'password_recovery.new_password_placeholder': {
    en: 'Enter new password',
    ru: 'Введите новый пароль',
  },
  'password_recovery.confirm_password': {
    en: 'Confirm Password',
    ru: 'Подтвердите пароль',
  },
  'password_recovery.confirm_password_placeholder': {
    en: 'Confirm new password',
    ru: 'Подтвердите новый пароль',
  },
  'password_recovery.passwords_not_match': {
    en: 'Passwords do not match',
    ru: 'Пароли не совпадают',
  },
  'password_recovery.reset_password': {
    en: 'Reset Password',
    ru: 'Сбросить пароль',
  },
  'password_recovery.resetting': {
    en: 'Resetting...',
    ru: 'Сброс...',
  },
  'password_recovery.check_telegram': {
    en: 'Check your Telegram for the code',
    ru: 'Проверьте ваш Telegram для получения кода',
  },
  'password_recovery.now_reset_password': {
    en: 'Now you can reset your password',
    ru: 'Теперь вы можете сбросить пароль',
  },
  'password_recovery.can_login_now': {
    en: 'You can now login with your new password',
    ru: 'Теперь вы можете войти с новым паролем',
  },
  'password_recovery.back_to_login': {
    en: 'Back to Login',
    ru: 'Вернуться к входу',
  },
  'password_recovery.step1': {
    en: 'Request',
    ru: 'Запрос',
  },
  'password_recovery.step2': {
    en: 'Verify',
    ru: 'Подтверждение',
  },
  'password_recovery.step3': {
    en: 'Reset',
    ru: 'Сброс',
  },
  'password_recovery.step1_description': {
    en: 'Enter your email or Telegram ID',
    ru: 'Введите ваш email или Telegram ID',
  },
  'password_recovery.step2_description': {
    en: 'Enter the 6-digit code from Telegram',
    ru: 'Введите 6-значный код из Telegram',
  },
  'password_recovery.step3_description': {
    en: 'Set your new password',
    ru: 'Установите новый пароль',
  },
  'password_recovery.request_title': {
    en: 'Request Recovery Code',
    ru: 'Запросить код восстановления',
  },
  'password_recovery.request_description': {
    en: 'We will send a recovery code to your Telegram',
    ru: 'Мы отправим код восстановления в ваш Telegram',
  },
  'password_recovery.verify_title': {
    en: 'Verify Code',
    ru: 'Подтвердить код',
  },
  'password_recovery.verify_description': {
    en: 'Enter the 6-digit code you received',
    ru: 'Введите полученный 6-значный код',
  },
  'password_recovery.reset_title': {
    en: 'Reset Password',
    ru: 'Сбросить пароль',
  },
  'password_recovery.reset_description': {
    en: 'Choose a strong password',
    ru: 'Выберите надежный пароль',
  },
};

