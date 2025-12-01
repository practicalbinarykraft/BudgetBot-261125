# Junior-Friendly Code Refactoring Plan

## 🎯 Goal
Разбить все файлы >200 строк на модульные компоненты по принципу "один файл = одна ответственность"

---

## 📊 Audit Results

### Critical Files (>500 lines) - 6 files
1. **server/telegram/commands.ts** - 1534 lines ❌
2. **client/src/components/ui/sidebar.tsx** - 727 lines ❌
3. **client/src/pages/settings-page.tsx** - 682 lines ❌
4. **client/src/components/assets/asset-form.tsx** - 527 lines ❌
5. **server/routes/assets.routes.ts** - 525 lines ❌
6. **server/services/forecast.service.ts** - 507 lines ❌

### Warning Files (200-500 lines) - 50 files
- 24 server files
- 26 client files

**Total files to refactor: 56 files**

---

## 🔥 Phase 1: Critical Files (Priority 1)

### 1. server/telegram/commands.ts (1534 lines → ~150 lines each)

**Current structure:**
- formatTransactionMessage()
- handleStartCommand()
- handleVerifyCommand()
- handleHelpCommand()
- handleBalanceCommand()
- handleTextMessage()
- handlePhotoMessage()
- handleLanguageCommand()
- handleCallbackQuery()
- handleLastCommand()
- handleStatusCommand()
- handleIncomeCommand()

**New structure:**
```
server/telegram/commands/
├── index.ts (40 lines) - экспорты
├── start.command.ts (120 lines) - handleStartCommand
├── verify.command.ts (80 lines) - handleVerifyCommand
├── help.command.ts (50 lines) - handleHelpCommand
├── balance.command.ts (80 lines) - handleBalanceCommand
├── text-message.handler.ts (200 lines) - handleTextMessage
├── photo.handler.ts (120 lines) - handlePhotoMessage
├── language.command.ts (60 lines) - handleLanguageCommand
├── callback-query.handler.ts (400 lines) - handleCallbackQuery (может нужен дальнейший split)
├── last.command.ts (80 lines) - handleLastCommand
├── status.command.ts (60 lines) - handleStatusCommand
├── income.command.ts (80 lines) - handleIncomeCommand
└── utils/
    └── format-transaction-message.ts (150 lines) - formatTransactionMessage
```

**Impact:** 1534 lines → 12 files по 40-200 строк

---

### 2. client/src/components/ui/sidebar.tsx (727 lines)

**Current structure:**
- Огромный компонент с множеством условий и разделов

**New structure:**
```
client/src/components/ui/sidebar/
├── index.tsx (100 lines) - главный компонент
├── sidebar-header.tsx (80 lines) - заголовок
├── sidebar-navigation.tsx (150 lines) - основная навигация
├── sidebar-footer.tsx (100 lines) - футер с настройками
├── sidebar-menu-item.tsx (60 lines) - отдельный пункт меню
├── sidebar-submenu.tsx (80 lines) - подменю
└── sidebar-utils.ts (80 lines) - утилиты
```

**Impact:** 727 lines → 7 files по 60-150 строк

---

### 3. client/src/pages/settings-page.tsx (682 lines)

**Current structure:**
- Страница с множеством табов (API Keys, Telegram, Notifications, etc.)

**New structure:**
```
client/src/pages/settings-page/
├── index.tsx (150 lines) - главная страница с табами
└── tabs/
    ├── api-keys-tab.tsx (120 lines)
    ├── telegram-tab.tsx (100 lines)
    ├── notifications-tab.tsx (100 lines)
    ├── preferences-tab.tsx (100 lines)
    └── danger-zone-tab.tsx (80 lines)
```

**Impact:** 682 lines → 6 files по 80-150 строк

---

### 4. client/src/components/assets/asset-form.tsx (527 lines)

**Current structure:**
- Огромная форма с множеством полей

**New structure:**
```
client/src/components/assets/asset-form/
├── index.tsx (150 lines) - главная форма
├── basic-info-section.tsx (100 lines) - основная информация
├── financial-section.tsx (120 lines) - финансовые поля
├── additional-section.tsx (100 lines) - дополнительные поля
└── form-validation.ts (80 lines) - валидация
```

**Impact:** 527 lines → 5 files по 80-150 строк

---

### 5. server/routes/assets.routes.ts (525 lines)

**Current structure:**
- Роутер с большим количеством бизнес-логики внутри

**New structure:**
```
server/routes/assets.routes.ts (150 lines) - только роуты
server/services/assets/
├── assets.service.ts (150 lines) - основной сервис
├── assets-crud.service.ts (120 lines) - CRUD операции
└── assets-calculation.service.ts (100 lines) - расчеты
```

**Impact:** 525 lines → 4 files по 100-150 строк

---

### 6. server/services/forecast.service.ts (507 lines)

**Current structure:**
- Монолитный сервис прогнозирования

**New structure:**
```
server/services/forecast/
├── index.ts (50 lines) - экспорты
├── forecast.service.ts (150 lines) - главный сервис
├── linear-forecast.ts (100 lines) - линейный прогноз
├── exponential-forecast.ts (120 lines) - экспоненциальный
└── seasonal-forecast.ts (120 lines) - сезонный
```

**Impact:** 507 lines → 5 files по 50-150 строк

---

## 🔶 Phase 2: Warning Files (Priority 2)

После Phase 1, будем рефакторить файлы 200-500 строк по аналогичному принципу.

**Подход:**
1. Если файл 200-300 строк - возможно оставить как есть, если он имеет одну четкую ответственность
2. Если файл >300 строк - разбить на модули

---

## 🎯 Принципы рефакторинга

### ✅ DO:
- Один файл = одна ответственность
- Максимум 200 строк на файл
- Понятные имена файлов и функций
- Группировка по папкам (features, utilities, etc.)
- Экспорты через index.ts для удобного импорта

### ❌ DON'T:
- Не менять API (публичные функции остаются с теми же сигнатурами)
- Не менять логику (только структуру)
- Не создавать слишком много маленьких файлов (минимум 40-50 строк)

---

## 📋 Execution Plan

### Week 1: Critical Files (Phase 1)
- Day 1: telegram/commands.ts refactoring
- Day 2: ui/sidebar.tsx refactoring
- Day 3: settings-page.tsx refactoring
- Day 4: asset-form.tsx refactoring
- Day 5: assets.routes.ts + forecast.service.ts refactoring
- Day 6-7: Testing + documentation

### Week 2-3: Warning Files (Phase 2)
- Refactor 200-500 line files
- Priority: Most used files first

---

## ✅ Success Criteria

1. ✅ Все файлы ≤200 строк
2. ✅ Каждый файл имеет одну четкую ответственность
3. ✅ Понятная структура папок
4. ✅ Все тесты проходят
5. ✅ Build успешный
6. ✅ Backward compatibility сохранена

---

**Status:** Ready to start Phase 1
**Next step:** Refactor telegram/commands.ts
