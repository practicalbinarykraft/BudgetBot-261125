# Requirements: BudgetBot — Code Audit + iOS App Store

**Defined:** 2026-02-19
**Core Value:** Пользователь может быстро учитывать расходы — сфотографировав чек (AI-OCR) или вручную — и видеть полную картину своих финансов.

## v1 Requirements

Requirements for iOS App Store release. Each maps to roadmap phases.

### Security (SEC)

- [x] **SEC-01**: Recovery code не логируется в plaintext — удалён `code` из `logInfo` в `password-recovery.service.ts`
- [x] **SEC-02**: JWT signing и password reset HMAC используют разные секреты — добавлен `PASSWORD_RESET_SECRET`
- [x] **SEC-03**: Fallback `|| 'default-secret'` удалён — приложение падает при отсутствии секрета
- [x] **SEC-04**: Rate limiters используют Redis store вместо in-memory
- [x] **SEC-05**: HSTS включён в production (`security-headers.ts`)
- [x] **SEC-06**: `localhost:5000` удалён из CORS `ALLOWED_ORIGINS`
- [x] **SEC-07**: Socket.IO CORS синхронизирован с Express CORS origins

### Bugs & Stability (BUG)

- [x] **BUG-01**: Password recovery корректно сообщает об отсутствии email-сервиса вместо ложного `method: 'email'`
- [x] **BUG-02**: Сервисы возвращают конкретные ошибки вместо silent null — `transaction.service.ts`, `api-key-manager.ts`, `admin-users.service.ts`
- [x] **BUG-03**: `getUserDetails()` credits calculation — добавлено конкретное логирование ошибок вместо silent zero fallback
- [x] **BUG-04**: JWT error handling в `mobile-auth.ts` покрывает все типы ошибок (не только JsonWebTokenError, TokenExpiredError)

### Code Quality (QUAL)

- [ ] **QUAL-01**: ESLint 9 flat config настроен с `@typescript-eslint` и `eslint-plugin-security`
- [ ] **QUAL-02**: `admin-metrics.service.ts` (772 LOC) разбит на модули <150 LOC
- [ ] **QUAL-03**: `auth-telegram.routes.ts` (601 LOC) разбит на модули <150 LOC
- [ ] **QUAL-04**: `admin-users.service.ts` (570 LOC) разбит на модули <150 LOC
- [ ] **QUAL-05**: `transactions.routes.ts` (552 LOC) разбит на модули <150 LOC
- [ ] **QUAL-06**: `trend-calculator.service.ts` (551 LOC) разбит на модули <150 LOC
- [ ] **QUAL-07**: Debug logging удалён из `admin-users.service.ts` (lines 220-357)
- [ ] **QUAL-08**: `any` типы заменены на proper generics в `auth-utils.ts` и `mobile-auth.ts`
- [ ] **QUAL-09**: `npm audit` не показывает critical/high уязвимостей

### App Store Config (IOS)

- [ ] **IOS-01**: `ios.bundleIdentifier` добавлен в `app.json`
- [ ] **IOS-02**: `ios.buildNumber` добавлен в `app.json`
- [ ] **IOS-03**: `NSCameraUsageDescription` добавлен в `infoPlist`
- [ ] **IOS-04**: `NSPhotoLibraryUsageDescription` добавлен в `infoPlist`
- [ ] **IOS-05**: `NSMicrophoneUsageDescription` добавлен в `infoPlist`
- [ ] **IOS-06**: Privacy Manifest (`ios.privacyManifests`) добавлен в `app.json`
- [ ] **IOS-07**: Splash screen image создан и добавлен в `app.json`
- [ ] **IOS-08**: App icon проверен: 1024x1024 PNG, без alpha channel
- [ ] **IOS-09**: `eas.json` создан с production build profile
- [ ] **IOS-10**: BillingScreen скрыт на iOS (`Platform.OS === 'ios'` guard) или реализован IAP
- [ ] **IOS-11**: Account deletion endpoint (`DELETE /api/account`) реализован на бэкенде
- [ ] **IOS-12**: Account deletion UI добавлен в ProfileScreen мобилки
- [ ] **IOS-13**: Privacy policy написана и размещена на публичном URL
- [ ] **IOS-14**: Ссылка на privacy policy доступна внутри приложения

### Build & Testing (BLD)

- [ ] **BLD-01**: EAS Build проходит успешно для iOS production profile
- [ ] **BLD-02**: Приложение установлено через TestFlight и протестировано на физическом устройстве
- [ ] **BLD-03**: Receipt scanning (камера + фото) работает на iOS device
- [ ] **BLD-04**: Voice input (микрофон) работает на iOS device
- [ ] **BLD-05**: Все навигационные потоки работают без crash на iOS

### Release (REL)

- [ ] **REL-01**: Screenshots подготовлены для iPhone 6.7" и 6.5"
- [ ] **REL-02**: App Store metadata заполнен (title, subtitle, description, keywords)
- [ ] **REL-03**: Age rating установлен (4+)
- [ ] **REL-04**: App Store Connect запись создана
- [ ] **REL-05**: Приложение отправлено на App Review
- [ ] **REL-06**: Приложение опубликовано в App Store

## v2 Requirements

Deferred to post-launch. Tracked but not in current roadmap.

### Enhanced Security

- **SEC-V2-01**: Refresh token rotation — access token 1 hour, refresh token 7 days
- **SEC-V2-02**: Token revocation mechanism for logout
- **SEC-V2-03**: Email service integration for password recovery

### Mobile Enhancements

- **MOB-V2-01**: Biometric authentication (Face ID / Touch ID) via `expo-local-authentication`
- **MOB-V2-02**: Offline-first mode for dashboard and transaction list
- **MOB-V2-03**: Push notifications via `expo-notifications` + APNs
- **MOB-V2-04**: Deep links от Telegram бота к экранам мобилки
- **MOB-V2-05**: `@sentry/react-native` crash reporting

### Monetization

- **MON-V2-01**: StoreKit2 IAP для iOS подписок (если решим продавать через App Store)
- **MON-V2-02**: App Store rating prompt через `expo-store-review`

## Out of Scope

| Feature | Reason |
|---------|--------|
| Google Play (Android) | Фокус на iOS; Android отложен |
| Новые фичи (forecast, AI advisor improvements) | Стабилизация перед релизом |
| Переписывание архитектуры | Только точечные исправления |
| Email-уведомления | Не нужны для App Store релиза |
| Redis для metrics caching | Premature optimization для текущей нагрузки |
| Горизонтальное масштабирование | Один VPS достаточен для текущей аудитории |
| iPad-specific UI | `supportsTablet: true` но iPad screenshots опциональны |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| SEC-04 | Phase 1 | Complete |
| SEC-05 | Phase 1 | Complete |
| SEC-06 | Phase 1 | Complete |
| SEC-07 | Phase 1 | Complete |
| BUG-01 | Phase 2 | Complete |
| BUG-02 | Phase 2 | Complete |
| BUG-03 | Phase 2 | Complete |
| BUG-04 | Phase 2 | Complete |
| QUAL-01 | Phase 3 | Pending |
| QUAL-02 | Phase 3 | Pending |
| QUAL-03 | Phase 3 | Pending |
| QUAL-04 | Phase 3 | Pending |
| QUAL-05 | Phase 3 | Pending |
| QUAL-06 | Phase 3 | Pending |
| QUAL-07 | Phase 3 | Pending |
| QUAL-08 | Phase 3 | Pending |
| QUAL-09 | Phase 3 | Pending |
| IOS-01 | Phase 4 | Pending |
| IOS-02 | Phase 4 | Pending |
| IOS-03 | Phase 4 | Pending |
| IOS-04 | Phase 4 | Pending |
| IOS-05 | Phase 4 | Pending |
| IOS-06 | Phase 4 | Pending |
| IOS-07 | Phase 4 | Pending |
| IOS-08 | Phase 4 | Pending |
| IOS-09 | Phase 4 | Pending |
| IOS-10 | Phase 4 | Pending |
| IOS-11 | Phase 4 | Pending |
| IOS-12 | Phase 4 | Pending |
| IOS-13 | Phase 4 | Pending |
| IOS-14 | Phase 4 | Pending |
| BLD-01 | Phase 5 | Pending |
| BLD-02 | Phase 5 | Pending |
| BLD-03 | Phase 5 | Pending |
| BLD-04 | Phase 5 | Pending |
| BLD-05 | Phase 5 | Pending |
| REL-01 | Phase 6 | Pending |
| REL-02 | Phase 6 | Pending |
| REL-03 | Phase 6 | Pending |
| REL-04 | Phase 6 | Pending |
| REL-05 | Phase 6 | Pending |
| REL-06 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after research synthesis*
