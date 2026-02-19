# BudgetBot

## What This Is

BudgetBot — персональный менеджер финансов с AI-распознаванием чеков. Три клиента (веб, мобильное веб-приложение на Expo, Telegram-бот) подключены к единому Node.js/Express бэкенду с PostgreSQL. Мобилка уже функциональнее веба — следующий шаг: подготовка к релизу в App Store (iOS).

## Core Value

Пользователь может быстро учитывать расходы — сфотографировав чек (AI-OCR) или вручную — и видеть полную картину своих финансов.

## Requirements

### Validated

<!-- Shipped and confirmed valuable — existing functionality. -->

- ✓ Учёт транзакций (доходы/расходы) — existing
- ✓ AI-OCR чеков (Anthropic + OpenAI fallback) — existing
- ✓ Telegram-бот для быстрого ввода расходов — existing
- ✓ Веб-приложение (budgetbot.online) — existing
- ✓ Мобильное веб-приложение (m.budgetbot.online, Expo Web) — existing
- ✓ Бюджеты по категориям — existing
- ✓ Мультивалютность — existing
- ✓ Аналитика и графики — existing
- ✓ BYOK (bring your own API key) + система кредитов — existing
- ✓ Аутентификация через Telegram — existing
- ✓ Админ-панель — existing
- ✓ WebSocket-уведомления — existing
- ✓ CI/CD с автодеплоем — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Код прошёл аудит безопасности — нет критических уязвимостей
- [ ] Критические баги исправлены — приложение стабильно
- [ ] Технический долг сокращён — код чистый, файлы <150 LOC
- [ ] UI мобилки отполирован — профессиональный вид для App Store
- [ ] App Store требования выполнены (privacy policy, скриншоты, описание, иконка)
- [ ] Приложение опубликовано в App Store (iOS)

### Out of Scope

<!-- Explicit boundaries. -->

- Google Play (Android) — отложено, сначала iOS
- Новые фичи — фокус на стабилизации существующего функционала
- Переписывание архитектуры — только точечные исправления
- Email-уведомления — не реализованы, пока не нужны для релиза

## Context

- **Прод-сервер:** 5.129.230.171, pm2, автодеплой через GitHub Actions
- **Веб:** budgetbot.online (Express static), m.budgetbot.online (nginx, Expo Web build)
- **OCR:** plugin-архитектура с fallback (Anthropic → OpenAI)
- **Сборка:** ESM (esbuild), require() в рантайме отсутствует
- **Известные проблемы из CONCERNS.md:** избыточное логирование, `any` типы в auth middleware, файлы >500 LOC, TODO-заглушки, тихие fallback на null
- **CLAUDE.md:** есть полный онбординг-документ с правилами проекта

## Constraints

- **ESM:** Сервер — ESM bundle, require.resolve() использовать нельзя
- **Файлы:** Не более ~200 строк на файл, одна ответственность
- **Тесты:** Обязательны для новой логики (vitest для сервера, jest для мобилки)
- **Runtime OCR:** Менять runtime OCR flow нельзя без явного запроса
- **Deploy:** SSH ключ ограничен command="/root/deploy.sh"
- **App Store:** Соответствие Apple App Review Guidelines

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Сначала аудит, потом мобилка | Нет смысла полировать UI на сломанном фундаменте | — Pending |
| Только iOS на первый релиз | Фокус на одной платформе снижает объём работы | — Pending |
| Expo Web для мобилки | Уже используется, переписывать не нужно | ✓ Good |
| Не добавлять новые фичи | Стабилизация важнее расширения перед релизом | — Pending |

---
*Last updated: 2026-02-19 after initialization*
