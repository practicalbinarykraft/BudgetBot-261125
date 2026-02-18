# Product Plan: BudgetBot - Что чинить, что улучшать

**Дата:** 2026-02-18
**Роль:** Product Manager
**Подход:** TDD, Junior-Friendly задачи
**Принцип:** Не сломать то, что работает

---

## Верификация анализа коллеги

Перед составлением плана проведена сверка анализа с реальным состоянием кода. Ряд задач из исходного анализа **уже решены**:

| # | Задача из анализа | Реальный статус |
|---|-------------------|-----------------|
| 1 | auth_date в /link-telegram-miniapp | **УЖЕ ИСПРАВЛЕНО** — telegram-validation.service.ts создан, auth_date проверяется (max 24h) |
| 2 | Rate limiting на /webapp-auth | **УЖЕ ИСПРАВЛЕНО** — authRateLimiter подключен |
| 5 | plannedIncome.status без .notNull() | **УЖЕ ИСПРАВЛЕНО** — `.notNull()` добавлен |
| 6 | Рефакторинг telegram/commands.ts 1534 строки | **УЖЕ СДЕЛАН** — разбит на 21 модуль в commands/, 873 строк суммарно |
| 8 | Дублирование initData валидации | **УЖЕ ИСПРАВЛЕНО** — вынесено в telegram-validation.service.ts |
| 25 | E2E тесты отсутствуют | **ЧАСТИЧНО ИСПРАВЛЕНО** — 4 файла Playwright тестов, 783 строки |

**Вывод:** из 28 задач анализа 6 уже не актуальны. Ниже — план из 16 актуальных задач.

---

## Sprint 1: Зеленый CI (неделя 1)

**Цель:** CI проходит без ошибок. Нельзя двигаться дальше с красным CI.

### Задача S1-1: Починить падающие тесты notifications-list

**Приоритет:** P0 (блокер)
**Файл:** `client/src/components/__tests__/notifications-list.test.tsx`
**Проблема:** 7 тестов падают из-за race condition — `waitForElementToBeRemoved` получает ссылку на элемент, который уже удален из DOM. Компонент загружается быстрее, чем тест успевает найти loading-индикатор.

**Корневая причина (из DEEP_ANALYSIS_REPORT.md):**
```
isLoading = isInitialLoading && allNotifications.length === 0
```
Когда fetch мгновенно возвращает пустой массив, loading-элемент вообще не рендерится, а тест ждет его удаления бесконечно.

**Что сделать (пошагово):**
1. Открыть `client/src/components/__tests__/notifications-list.test.tsx`
2. Найти все вызовы `waitForElementToBeRemoved`
3. Заменить на ожидание появления кнопки "Фильтры":
   ```typescript
   // Было (ненадежно):
   const loadingElement = screen.queryByLabelText('Loading notifications');
   if (loadingElement) {
     await waitForElementToBeRemoved(loadingElement);
   }

   // Стало (надежно):
   await waitFor(() => {
     expect(screen.getByTitle('Фильтры')).toBeInTheDocument();
   }, { timeout: 5000 });
   ```
4. Убрать неиспользуемый импорт `waitForElementToBeRemoved`
5. Запустить `npm run test:run` — убедиться, что все 444 теста проходят
6. Запушить и проверить CI

**Definition of Done:**
- [ ] 0 падающих тестов в notifications-list.test.tsx
- [ ] CI зеленый (все 444 теста проходят)
- [ ] Никакие другие тесты не сломаны

**Риски:** Минимальные. Меняем только тестовый код, не трогаем продакшн-логику.

---

## Sprint 2: Безопасность и стабильность (неделя 2)

**Цель:** Закрыть оставшиеся дыры в безопасности и стабильности.

### Задача S2-1: 302 редирект на /socket.io

**Приоритет:** P0
**Источник:** changelog TODO #1
**Проблема:** CORS/nginx может ломать WebSocket-соединения для некоторых пользователей — /socket.io отдает 302 вместо upgrade.

**Что сделать (пошагово):**
1. Проверить nginx конфигурацию в `nginx/` — найти блок для /socket.io
2. Убедиться, что есть правильные заголовки:
   ```nginx
   location /socket.io/ {
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_http_version 1.1;
       proxy_pass http://app:5000;
   }
   ```
3. Проверить CORS-настройки в `server/index.ts` — origin должен включать домен production
4. Написать тест: подключиться к WebSocket из браузера и проверить, что upgrade проходит (не 302)

**Definition of Done:**
- [ ] WebSocket-соединение устанавливается без 302
- [ ] Протестировано в dev-окружении
- [ ] nginx.conf обновлен (если нужно)

**Риски:** Средние. Изменения nginx могут повлиять на другие маршруты. Тестировать на staging.

---

### Задача S2-2: Вынести hardcoded bot username в env

**Приоритет:** P1
**Проблема:** `'BudgetBuddyAIBot'` найден hardcoded в тесте `telegram-login-button.test.tsx`. Нужно проверить, используется ли он в продакшн-коде и вынести в переменную окружения.

**Что сделать (пошагово):**
1. Поискать `BudgetBuddyAIBot` по всему проекту: `grep -r "BudgetBuddyAIBot"`
2. Для каждого найденного файла:
   - Если продакшн-код: заменить на `import.meta.env.VITE_TELEGRAM_BOT_USERNAME` (client) или `process.env.TELEGRAM_BOT_USERNAME` (server)
   - Если тест: использовать мок/env переменную
3. Добавить `TELEGRAM_BOT_USERNAME` в `.env.example`
4. Добавить `VITE_TELEGRAM_BOT_USERNAME` в `client/src/lib/env.ts` (Zod-схема)
5. Запустить тесты

**Definition of Done:**
- [ ] Нет hardcoded bot username в продакшн-коде
- [ ] Переменная добавлена в .env.example
- [ ] Тесты проходят
- [ ] Zod-валидация env обновлена

**Риски:** Низкие. Простая замена строки на env-переменную.

---

## Sprint 3: Техдолг (недели 3-4)

**Цель:** Снизить технический долг, не меняя функциональность.

### Задача S3-1: Дедупликация default categories

**Приоритет:** P1
**Файлы:**
- `server/auth.ts` (определение default categories)
- `server/routes/auth-miniapp.routes.ts` (дублирует то же самое)

**Проблема:** Одинаковый массив default categories в 2 местах. Если нужно добавить категорию — менять в 2 файлах, легко забыть один.

**Что сделать (пошагово):**
1. Создать файл `server/services/user-initialization.service.ts`
2. Вынести `DEFAULT_CATEGORIES` массив туда (единый источник правды)
3. Создать функцию `initializeNewUser(userId: number)` — создает категории, теги, welcome bonus
4. **СНАЧАЛА написать тест** `server/services/__tests__/user-initialization.service.test.ts`:
   ```typescript
   describe('initializeNewUser', () => {
     it('should create 8 default categories', async () => { ... });
     it('should create default tags', async () => { ... });
     it('should grant welcome bonus', async () => { ... });
     it('should not fail if called twice', async () => { ... });
   });
   ```
5. Заменить дублированный код в `server/auth.ts` и `auth-miniapp.routes.ts` на вызов `initializeNewUser()`
6. Запустить все тесты — ничего не должно сломаться

**Definition of Done:**
- [ ] DEFAULT_CATEGORIES определен в одном месте
- [ ] Тесты для initializeNewUser написаны и проходят
- [ ] Все существующие тесты проходят
- [ ] CI зеленый

**Риски:** Низкие. Выносим существующую логику без изменения поведения.

---

### Задача S3-2: Дедупликация OCR prompt

**Приоритет:** P1
**Источник:** changelog TODO #6
**Проблема:** Один и тот же prompt для OCR чеков дублируется в `receipt-parser` и `openai-receipt-parser`.

**Что сделать (пошагово):**
1. Найти оба файла с OCR парсерами
2. Сравнить промпты — убедиться, что они действительно одинаковые
3. Создать `server/services/ocr/shared-prompt.ts` с общим промптом
4. Импортировать в оба парсера
5. **Тест:** Запустить существующие OCR-тесты (если есть) или ручной тест — результат парсинга чека не должен измениться

**Definition of Done:**
- [ ] OCR prompt определен в одном месте
- [ ] Оба парсера используют общий prompt
- [ ] Существующие тесты проходят

**Риски:** Низкие. Выносим константу, не меняем логику.

---

### Задача S3-3: Рефакторинг оставшихся крупных файлов

**Приоритет:** P1
**Источник:** REFACTORING_PLAN.md

commands.ts уже разбит. Остаются 5 файлов >500 строк:
1. `client/src/components/ui/sidebar.tsx` — 727 строк
2. `client/src/pages/settings-page.tsx` — 682 строки
3. `client/src/components/assets/asset-form.tsx` — 527 строк
4. `server/routes/assets.routes.ts` — 525 строк
5. `server/services/forecast.service.ts` — 507 строк

**Подход:** Каждый файл — отдельный PR. Не менять логику, только структуру. Порядок: от наименее рискованного.

**Для каждого файла:**
1. Прочитать весь файл, понять структуру
2. Определить логические блоки (секции, табы, хендлеры)
3. Создать папку с тем же именем (например `settings-page/`)
4. Вынести блоки в отдельные файлы (80-200 строк каждый)
5. Создать `index.tsx` с реэкспортами
6. Запустить все тесты — ничего не должно измениться
7. Проверить build: `npm run build`

**Структура разбиения описана в REFACTORING_PLAN.md** — следовать ей.

**Definition of Done (для каждого файла):**
- [ ] Файл разбит на модули по 80-200 строк
- [ ] Импорты в других файлах обновлены (или используют index-реэкспорт)
- [ ] Все тесты проходят
- [ ] Build проходит
- [ ] Функциональность не изменилась (ручная проверка в браузере)

**Риски:** Средние. Могут сломаться импорты. Обязательна ручная проверка UI.

---

## Sprint 4: Незавершённые фичи (недели 5-6)

**Цель:** Закрыть критичные для пользователей пробелы.

### Задача S4-1: Email для восстановления пароля

**Приоритет:** P1
**Файл:** `server/services/password-recovery.service.ts`
**Проблема:** Endpoint существует, но email не отправляется — стоит TODO. Пользователи без Telegram не могут восстановить пароль.

**Что сделать (пошагово):**
1. Выбрать email-провайдер (Resend, Nodemailer + SMTP, SendGrid)
2. **СНАЧАЛА написать тесты:**
   ```typescript
   describe('sendPasswordRecoveryEmail', () => {
     it('should send email with recovery link', async () => { ... });
     it('should fail gracefully if email service is down', async () => { ... });
     it('should not reveal if email exists (security)', async () => { ... });
     it('should rate limit recovery attempts', async () => { ... });
   });
   ```
3. Создать `server/services/email.service.ts` — обертка для отправки email
4. Реализовать отправку recovery email с одноразовым токеном
5. Добавить env-переменные для SMTP/API key в `.env.example`

**Definition of Done:**
- [ ] Email с recovery link отправляется пользователю
- [ ] Токен одноразовый и expires через 1 час
- [ ] Rate limiting работает (не больше 3 запросов в 15 минут)
- [ ] Тесты написаны и проходят
- [ ] Не ломает существующий Telegram recovery flow

**Риски:** Средние. Нужен email-провайдер. Не ломает существующий flow (Telegram recovery остается).

---

### Задача S4-2: Service Worker update banner

**Приоритет:** P2
**Источник:** changelog TODO #8
**Проблема:** Пользователи видят stale build после обновления. Нет баннера "Доступно обновление".

**Что сделать (пошагово):**
1. Проверить текущую SW-конфигурацию в Vite
2. Создать компонент `client/src/components/UpdateBanner.tsx`:
   - Слушает событие `controllerchange` от SW
   - Показывает ненавязчивый баннер "Доступна новая версия"
   - Кнопка "Обновить" перезагружает страницу
3. Добавить в App.tsx
4. **Тест:**
   ```typescript
   describe('UpdateBanner', () => {
     it('should not show banner initially', () => { ... });
     it('should show banner when SW update available', () => { ... });
     it('should reload page on click', () => { ... });
   });
   ```

**Definition of Done:**
- [ ] Баннер появляется при наличии обновления
- [ ] Перезагрузка по клику работает
- [ ] Тесты написаны и проходят
- [ ] Не мешает работе приложения (ненавязчивый UI)

**Риски:** Низкие. Добавляем новый компонент, не трогаем существующие.

---

### Задача S4-3: Fallback monitoring (AI provider)

**Приоритет:** P2
**Источник:** changelog TODO #7
**Проблема:** Не видно когда срабатывает OpenAI fallback (когда Anthropic лимиты превышены). Нет метрик.

**Что сделать (пошагово):**
1. Найти место в коде, где происходит fallback с Anthropic на OpenAI
2. Добавить Winston-логирование при каждом fallback:
   ```typescript
   logger.warn('AI provider fallback triggered', {
     primary: 'anthropic',
     fallback: 'openai',
     reason: error.message,
     userId: req.user?.id,
   });
   ```
3. (Опционально) Создать счетчик fallback-ов в admin panel metrics
4. **Тест:**
   ```typescript
   it('should log when fallback is triggered', async () => { ... });
   ```

**Definition of Done:**
- [ ] Fallback логируется в Winston
- [ ] Логи содержат причину fallback и userId
- [ ] Тесты написаны

**Риски:** Минимальные. Добавляем логирование, не меняем логику.

---

## Sprint 5: DevOps и документация (недели 7-8)

### Задача S5-1: Nginx — убрать дублирующие конфиги

**Приоритет:** P2
**Источник:** changelog TODO #4
**Проблема:** Conflicting server name warning в логах nginx.

**Что сделать (пошагово):**
1. Прочитать все .conf файлы в `nginx/`
2. Найти дублирующиеся `server_name` директивы
3. Объединить в один конфиг или убрать дубликат
4. Проверить: `nginx -t` (тест конфигурации)
5. Перезапустить nginx

**Definition of Done:**
- [ ] `nginx -t` проходит без warning
- [ ] Один server_name на домен
- [ ] Приложение работает после перезапуска nginx

**Риски:** Средние. Ошибка в nginx может уронить продакшн. Тестировать на staging.

---

### Задача S5-2: Уборка документации в корне

**Приоритет:** P2
**Проблема:** 67 .md файлов в корне проекта. Большинство — одноразовые саммари, не обновляются.

**Что сделать (пошагово):**
1. Создать структуру:
   ```
   docs/
   ├── guides/        # гайды (env, rate-limiting, logging, sessions, billing, deploy)
   ├── reports/       # отчеты (test reports, analysis, postmortems)
   ├── summaries/     # саммари фич (encryption, redis, lazy-loading, etc.)
   ├── plans/         # планы (improvement, refactoring, mobile, fix)
   ├── specs/         # уже существует
   └── archive/       # устаревшие документы
   ```
2. Переместить каждый файл в соответствующую папку (НЕ удалять)
3. Обновить ссылки в PROGRESS.md (если есть)
4. В корне оставить ТОЛЬКО:
   - `README.md` (если есть)
   - `PROGRESS.md` (обновить)
   - `CHANGES.md`

**Definition of Done:**
- [ ] В корне не более 5 .md файлов
- [ ] Все документы перемещены (не удалены)
- [ ] Структура docs/ логична и понятна
- [ ] Ссылки в документах обновлены

**Риски:** Минимальные. Не затрагивает код.

---

### Задача S5-3: Обновить PROGRESS.md

**Приоритет:** P2
**Проблема:** Последнее обновление Jan 26 2025. Не отражает работу Feb 2026. Содержит раздутые метрики ("улучшение +500%").

**Что сделать:**
1. Обновить статистику на актуальную
2. Убрать нереалистичные метрики (+500%, +1000%)
3. Добавить реальные данные: количество тестов, файлов, покрытие
4. Добавить раздел "Текущие проблемы" со ссылкой на этот план

**Definition of Done:**
- [ ] PROGRESS.md содержит актуальную информацию
- [ ] Нет раздутых метрик
- [ ] Есть ссылка на текущий план работ

---

## Backlog (не в ближайших спринтах)

Эти задачи важны, но не блокируют текущую работу. Брать по мере освобождения ресурсов.

### B-1: Auto-deploy pipeline
**Приоритет:** P2
**Что:** Сейчас деплой ручной (SSH → git pull → build → pm2 restart). Создать CD pipeline.
**Зависимости:** CI должен быть зеленый (Sprint 1).

### B-2: Admin panel — реальные метрики
**Приоритет:** P3
**Что:** CPU/requests metrics — заглушки. churnedMRR = 0 захардкожен.
**Почему backlog:** Admin panel не пользователь-facing. Можно отложить.

### B-3: Хранение фото чеков
**Приоритет:** P3
**Что:** Фото чеков не сохраняются — только распознанные данные. Нужна таблица `transaction_attachments` + S3/R2 storage.
**Почему backlog:** Большая задача, требует выбора storage провайдера.

### B-4: Mobile — App Store Gate
**Приоритет:** P3
**Что:** Иконки, splash, privacy policy, EAS build для публикации.
**Почему backlog:** Маркетинговая задача + review процесс App Store.

### B-5: Реферальная система
**Приоритет:** P3
**Что:** Спецификация написана, код не реализован.
**Почему backlog:** Фича роста. Нет смысла делать до стабильного продукта.

### B-6: Broadcast/рассылки
**Приоритет:** P3
**Что:** Спецификация написана, код не реализован.
**Почему backlog:** Зависит от email-сервиса (Sprint 4, S4-1).

### B-7: Frontend тесты для Telegram auth flow
**Приоритет:** P2
**Что:** Нет тестов для `telegram-link-prompt.tsx` и `use-telegram-miniapp.ts`.
**Подход:** Написать unit-тесты по примеру из AUTH_FLOW_REVIEW.md.

### B-8: Expo Web deploy script
**Приоритет:** P3
**Что:** Ручной, легко забыть EXPO_PUBLIC_API_URL.

---

## Принципы работы

### TDD
1. **Для каждой задачи СНАЧАЛА пишем тест**, потом код
2. Тесты должны падать до реализации (red)
3. Минимальный код чтобы тест прошел (green)
4. Рефакторинг (refactor)
5. Для рефакторинга файлов (S3-3): тесты уже есть, проверяем что не ломаем

### Junior-Friendly
1. Каждая задача содержит **пошаговую инструкцию**
2. Указаны конкретные файлы и строки
3. Есть примеры кода "было/стало"
4. Definition of Done — чек-лист для самопроверки
5. Риски описаны простым языком

### Не сломать то, что работает
1. **Никогда** не менять и тесты и продакшн-код одновременно в одном PR
2. Сначала тесты, потом код (или наоборот — но не вместе)
3. Каждый PR — одна задача
4. `npm run test:run` и `npm run build` после каждого изменения
5. Ручная проверка UI для фронтенд-изменений

---

## Порядок приоритетов (резюме)

```
Sprint 1 (неделя 1):   S1-1 — Зеленый CI
Sprint 2 (неделя 2):   S2-1, S2-2 — Безопасность
Sprint 3 (недели 3-4): S3-1, S3-2, S3-3 — Техдолг
Sprint 4 (недели 5-6): S4-1, S4-2, S4-3 — Фичи
Sprint 5 (недели 7-8): S5-1, S5-2, S5-3 — DevOps + Docs
Backlog:               B-1 .. B-8 — по мере ресурсов
```

**Всего задач:** 16 активных + 8 в backlog
**Оценка:** 8 недель при 1 разработчике
**Главный риск:** Рефакторинг крупных файлов (S3-3) — тестировать каждый PR отдельно
