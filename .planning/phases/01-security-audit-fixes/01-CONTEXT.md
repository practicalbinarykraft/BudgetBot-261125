# Phase 1 Context: Security Audit & Fixes

**Captured:** 2026-02-20

## Decisions (LOCKED)

### Coding Principles
- **Junior-friendly код** — простой, явный, без магии
- **Файлы < 200 строк** — один файл = одна ответственность
- **Переиспользуемый код (2+ раз) → отдельная функция**
- **TDD** — сначала тест, потом реализация. Для каждого security fix пишем тест ДО правки кода.

### Test-Driven Approach for Security Fixes
1. Написать тест, который ЛОМАЕТСЯ на текущем (небезопасном) поведении
2. Убедиться что тест красный
3. Исправить код
4. Убедиться что тест зелёный
5. Прогнать весь test suite

## Claude's Discretion
- Конкретная реализация Redis store для rate limiters
- Структура нового `PASSWORD_RESET_SECRET` в env schema
- Порядок выполнения security fixes внутри фазы

## Deferred Ideas
- Refresh token rotation (v2)
- Token revocation (v2)
- Email service (v2)
