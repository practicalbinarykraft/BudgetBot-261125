# Roadmap: BudgetBot — Code Audit + iOS App Store

**Created:** 2026-02-19
**Milestone:** v1.0 iOS App Store Release
**Phases:** 6
**Requirements covered:** 42/42

---

## Phase 1: Security Audit & Fixes

**Goal:** Устранить все критические уязвимости безопасности. После этой фазы приложение безопасно для production-использования.

**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — TDD: Fix password recovery/reset secrets (SEC-01, SEC-02, SEC-03) [COMPLETE]
- [x] 01-02-PLAN.md — TDD: Fix HSTS, CORS, WebSocket CORS sync (SEC-05, SEC-06, SEC-07) [COMPLETE]
- [x] 01-03-PLAN.md — TDD: Add Redis store to rate limiters (SEC-04) [COMPLETE]

**Scope:**
- Удалить plaintext recovery code из логов (`password-recovery.service.ts:81`)
- Добавить `PASSWORD_RESET_SECRET` в env schema, разделить JWT и HMAC секреты
- Удалить `|| 'default-secret'` fallback — crash при отсутствии секрета
- Подключить Redis store к rate limiters (`rate-limit-redis`)
- Включить HSTS в production (`security-headers.ts`)
- Убрать `localhost:5000` из CORS `ALLOWED_ORIGINS`
- Синхронизировать Socket.IO CORS с Express CORS

**Success criteria:**
- Ни один секрет не логируется в plaintext
- Rate limiters сохраняют состояние между перезапусками pm2
- `curl -I https://budgetbot.online` возвращает `Strict-Transport-Security` header
- `tsc --noEmit` проходит без ошибок

**Estimated complexity:** MEDIUM
**Dependencies:** None

---

## Phase 2: Bug Fixes & Stability

**Goal:** Исправить известные баги, убрать silent failures. После этой фазы приложение стабильно и предсказуемо.

**Requirements:** BUG-01, BUG-02, BUG-03, BUG-04

**Scope:**
- Password recovery: честно сообщать "email recovery не реализован" вместо ложного `method: 'email'`
- Заменить silent null returns на конкретные ошибки в сервисах
- `getUserDetails()` credits: конкретное логирование ошибок вместо silent zero
- JWT error handling: покрыть все типы ошибок в `mobile-auth.ts`

**Success criteria:**
- Password recovery возвращает честное сообщение об ошибке для users без Telegram
- Ни один сервис не возвращает `null` без контекста ошибки
- Все JWT ошибки обрабатываются и логируются

**Estimated complexity:** LOW-MEDIUM
**Dependencies:** Phase 1 (security fixes establish stable auth foundation)

---

## Phase 3: Code Quality

**Goal:** Привести код в соответствие с правилами проекта (<150 LOC/файл). Настроить статический анализ. После этой фазы код чистый и поддерживаемый.

**Requirements:** QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, QUAL-06, QUAL-07, QUAL-08, QUAL-09

**Scope:**
- Настроить ESLint 9 flat config с `@typescript-eslint` и `eslint-plugin-security`
- Разбить 5 файлов >500 LOC на модули <150 LOC:
  - `admin-metrics.service.ts` (772) → hero-metrics, user-metrics, revenue-metrics
  - `auth-telegram.routes.ts` (601) → auth flow, webhook handler, mini-app handler
  - `admin-users.service.ts` (570) → user list, user details, user stats
  - `transactions.routes.ts` (552) → CRUD routes, receipt routes, export routes
  - `trend-calculator.service.ts` (551) → trend calc, forecast, helpers
- Удалить debug logging из `admin-users.service.ts`
- Заменить `any` типы в `auth-utils.ts` и `mobile-auth.ts`
- Прогнать `npm audit` и исправить critical/high уязвимости

**Success criteria:**
- `npx eslint .` проходит без ошибок
- Ни один файл в `server/` не превышает 200 LOC
- `npm audit --audit-level=high` чистый
- `tsc --noEmit` проходит

**Estimated complexity:** HIGH (много файлов, рефакторинг)
**Dependencies:** Phase 2 (bug fixes before refactoring prevents masking symptoms)

---

## Phase 4: App Store Preparation

**Goal:** Подготовить всю конфигурацию и контент для iOS App Store. После этой фазы приложение готово к нативной сборке.

**Requirements:** IOS-01 — IOS-14

**Scope:**
- `app.json`: bundleIdentifier, buildNumber, infoPlist (camera/mic/photo permissions), privacyManifests, splash image
- `eas.json`: создать с development, preview, production profiles
- Account deletion: `DELETE /api/account` endpoint + UI в ProfileScreen
- BillingScreen: `Platform.OS === 'ios'` guard (скрыть pricing на iOS)
- Privacy policy: написать и разместить на публичном URL
- App icon: проверить 1024x1024, без alpha channel

**Success criteria:**
- `npx expo-doctor` проходит без ошибок
- Account deletion работает end-to-end (API + UI)
- BillingScreen не показывает pricing на `Platform.OS === 'ios'`
- Privacy policy доступна по URL

**Estimated complexity:** HIGH (account deletion + privacy policy + config)
**Dependencies:** Phase 1-3 (audit baseline established before native build)

---

## Phase 5: Build & TestFlight

**Goal:** Собрать нативный iOS binary и протестировать на физическом устройстве. После этой фазы приложение верифицировано на реальном железе.

**Requirements:** BLD-01 — BLD-05

**Scope:**
- `eas build --platform ios --profile production`
- Upload через `eas submit` в TestFlight
- Ручное тестирование на iPhone:
  - Receipt scanning (камера + фото)
  - Voice input (микрофон)
  - Навигация (все потоки)
  - Auth flow (login, register, logout)
  - Offline/poor connectivity behaviour
- UI polish по результатам тестирования

**Success criteria:**
- EAS Build завершается успешно
- Приложение устанавливается через TestFlight
- Все core features работают на физическом iOS устройстве
- Нет crash'ей при обычном использовании

**Estimated complexity:** MEDIUM
**Dependencies:** Phase 4 (app.json + eas.json must be complete), Apple Developer Account ($99/year)

---

## Phase 6: App Store Release

**Goal:** Опубликовать приложение в iOS App Store. После этой фазы BudgetBot доступен всем пользователям iOS.

**Requirements:** REL-01 — REL-06

**Scope:**
- Screenshots для iPhone 6.7" (Pro Max) и 6.5" (Plus)
- App Store Connect metadata: title, subtitle, description, keywords
- Age rating: 4+ (финансовый трекер, нет offensive content)
- Submit for App Review
- Ответить на вопросы reviewer'а если будут
- Release after approval

**Success criteria:**
- App Store listing заполнен полностью
- App Review пройден
- Приложение доступно для скачивания в App Store

**Estimated complexity:** MEDIUM
**Dependencies:** Phase 5 (TestFlight testing passed)

---

## Phase Dependencies

```
Phase 1 (Security) → Phase 2 (Bugs) → Phase 3 (Quality)
                                              ↓
                                        Phase 4 (iOS Config)
                                              ↓
                                        Phase 5 (Build & Test)
                                              ↓
                                        Phase 6 (Release)
```

## Risk Register

| Risk | Phase | Probability | Impact | Mitigation |
|------|-------|-------------|--------|------------|
| App Store rejection — IAP | Phase 6 | HIGH | Blocks release | Hide BillingScreen on iOS (Phase 4) |
| App Store rejection — account deletion | Phase 6 | HIGH | Blocks release | Implement in Phase 4 |
| EAS Build failure | Phase 5 | MEDIUM | Delays release | Run `expo-doctor` first; fix incrementally |
| Refactoring breaks existing functionality | Phase 3 | MEDIUM | Rework needed | Run full test suite after each file split |
| Apple Developer Account not ready | Phase 5 | LOW | Blocks build | Enroll early (Phase 4) |
| App Review takes >1 week | Phase 6 | LOW | Delays launch | Submit ASAP; standard is 24-48h |

---
*Roadmap created: 2026-02-19*
*Last updated: 2026-02-20 after Phase 1 execution (all 3 plans complete, SEC-01..SEC-07 done)*
