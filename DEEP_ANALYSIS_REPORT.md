# ГЛУБОКИЙ АНАЛИЗ ОШИБОК CI ТЕСТОВ

## Дата анализа: 2026-01-30
## Запуск CI: 21505925662
## Статус: FAILED (5 тестов упали)

---

## ОБЩАЯ СТАТИСТИКА

- **Всего тестов**: 444
- **Упало**: 5
- **Прошло**: 425
- **Пропущено**: 14
- **Файлов с ошибками**: 1 (`client/src/components/__tests__/notifications-list.test.tsx`)

---

## ДЕТАЛЬНЫЙ АНАЛИЗ КАЖДОЙ ОШИБКИ

### ОШИБКА #1: "should render date filter"

**Файл**: `client/src/components/__tests__/notifications-list.test.tsx:113`

**Ошибка**:
```
TestingLibraryElementError: Unable to find an element with the title: Фильтры
```

**Корневая причина**:
1. Компонент находится в состоянии загрузки (`Loading notifications` видно в DOM)
2. При `isLoading === true` компонент возвращает ранний return с loader, и кнопка "Фильтры" вообще не рендерится
3. Тест использует `waitFor(() => expect(screen.queryByLabelText('Loading notifications')).not.toBeInTheDocument())` - это НЕ работает правильно, потому что `queryByLabelText` возвращает `null` сразу, если элемент не найден, и `waitFor` не ждет его исчезновения

**Доказательства из логов**:
- Строка 1902: `aria-label="Loading notifications"` присутствует в DOM
- Строка 1932: Тест пытается найти кнопку с title "Фильтры" (в искаженной кодировке `h%4h%U%h%W%d% d% d% d%`)
- Строка 1929: Ошибка происходит на строке 122:35 теста (это строка с `getByTitle('Фильтры')`)

**Решение**:
Использовать `waitForElementToBeRemoved` вместо `waitFor` с `queryByLabelText`, или ждать появления кнопки "Фильтры" вместо проверки исчезновения loading.

---

### ОШИБКА #2: "should render type filter with options"

**Файл**: `client/src/components/__tests__/notifications-list.test.tsx:137`

**Ошибка**:
```
TestingLibraryElementError: Unable to find an element with the title: Фильтры
```

**Корневая причина**: Та же самая, что и в ошибке #1 - компонент еще загружается, кнопка не видна.

**Доказательства из логов**:
- Та же проблема с состоянием загрузки
- Тест пытается найти кнопку до завершения загрузки

**Решение**: То же самое - правильное ожидание загрузки.

---

### ОШИБКА #3: "should filter notifications by date"

**Файл**: `client/src/components/__tests__/notifications-list.test.tsx:176`

**Ошибка**:
```
TestingLibraryElementError: Unable to find an element with the title: Показать до даты
```

**Корневая причина**:
1. Тест ищет элемент с title "Показать до даты", но в компоненте используется title "Дата окончания"
2. В логах видно, что тест пытается найти `h%/h%[%h%Q%h%'%h%V%h%'%d% d% h%$%h%[% h%$%h%'%d% d%` (искаженная кодировка "Показать до даты")
3. Но в компоненте (строка 371) используется `title="Дата окончания"`

**Доказательства**:
- Строка 1984: Тест ищет "Показать до даты"
- Строка 2005: В DOM есть кнопка с title "Скрыть прочитанные" (видно в логах)
- Компонент использует `title={language === "ru" ? "Дата окончания" : "End date"}` (строка 371)

**Решение**: 
Изменить тест, чтобы искать "Дата окончания" вместо "Показать до даты". ИЛИ это может быть старый отчет CI - нужно проверить актуальный код.

---

### ОШИБКА #4: "should filter notifications by type - missed"

**Файл**: `client/src/components/__tests__/notifications-list.test.tsx:219`

**Ошибка**:
```
TestingLibraryElementError: Unable to find an element with the text: Notification 1
```

**Корневая причина**:
1. Тест ждет появления "Notification 1", но компонент еще загружается или фильтр скрывает уведомление
2. Возможно, фильтр "missed" работает неправильно и скрывает уведомление, которое должно быть видно
3. Или компонент еще не загрузился полностью

**Доказательства из логов**:
- Строка 2260: Тест не может найти текст "Notification 1"
- Возможно, уведомление отфильтровано или компонент еще загружается

**Решение**: 
Убедиться, что тест ждет полной загрузки компонента и что фильтр работает правильно.

---

### ОШИБКА #5: "should filter notifications by type - upcoming"

**Файл**: `client/src/components/__tests__/notifications-list.test.tsx:346`

**Ошибка**:
```
TestingLibraryElementError: Unable to find an element with the text: Notification 1
```

**Корневая причина**: Та же самая, что и в ошибке #4 - уведомление не найдено после применения фильтра.

---

## КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### Проблема #1: Неправильное ожидание загрузки компонента

**Текущий код** (НЕПРАВИЛЬНО):
```typescript
await waitFor(() => {
  expect(screen.queryByLabelText('Loading notifications')).not.toBeInTheDocument();
});
```

**Почему не работает**:
- `queryByLabelText` возвращает `null` сразу, если элемент не найден
- `waitFor` не ждет исчезновения элемента - он проверяет условие периодически
- Если элемент уже отсутствует, `queryByLabelText` вернет `null`, и `not.toBeInTheDocument()` пройдет сразу, не дождавшись реальной загрузки

**Правильное решение**:
```typescript
const loadingElement = screen.queryByLabelText('Loading notifications');
if (loadingElement) {
  await waitForElementToBeRemoved(loadingElement);
}
// ИЛИ ждать появления кнопки "Фильтры"
await waitFor(() => {
  expect(screen.getByTitle('Фильтры')).toBeInTheDocument();
});
```

---

### Проблема #2: Несоответствие title в тестах

**Проблема**: 
В логах CI тест ищет "Показать до даты", но в компоненте используется "Дата окончания".

**Возможные причины**:
1. Старый отчет CI (до применения исправлений)
2. Изменения не попали в CI
3. Проблема с кодировкой в логах CI (кириллица отображается искаженно)

**Решение**: 
Проверить актуальный код и убедиться, что все тесты используют правильный title.

---

## ПЛАН ИСПРАВЛЕНИЙ

### Шаг 1: Исправить ожидание загрузки во всех тестах
- [x] Добавить `waitForElementToBeRemoved` в импорты
- [x] Заменить все `waitFor(() => expect(queryByLabelText(...)).not.toBeInTheDocument())` на `waitForElementToBeRemoved`
- [x] Добавить ожидание появления кнопки "Фильтры" после загрузки

### Шаг 2: Проверить соответствие title в тестах
- [x] Убедиться, что все тесты используют "Дата окончания" вместо "Показать до даты"
- [ ] Проверить, что изменения попали в CI

### Шаг 3: Улучшить тесты для фильтров
- [ ] Убедиться, что тесты ждут появления уведомлений после применения фильтров
- [ ] Проверить логику фильтрации в компоненте

---

## ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Структура компонента NotificationsList

1. **Состояние загрузки** (`isLoading`):
   - Если `true` → возвращает только loader с `aria-label="Loading notifications"`
   - Если `false` → рендерит полный компонент с кнопками и фильтрами

2. **Кнопка "Фильтры"**:
   - Рендерится только когда `isLoading === false`
   - Имеет `title="Фильтры"` (или "Filters" для английского)
   - Находится в header компонента

3. **Фильтры**:
   - Показываются только когда `showFilters === true`
   - Кнопка "Фильтры" переключает `showFilters`
   - Поле даты окончания имеет `title="Дата окончания"`

### Логика загрузки

```typescript
const { data: allNotifications = [], isLoading: isInitialLoading } = useQuery(...);
const isLoading = isInitialLoading && allNotifications.length === 0;

if (isLoading) {
  return <div aria-label="Loading notifications">...</div>;
}
```

**Проблема**: `isLoading` становится `false` только когда:
1. `isInitialLoading === false` (запрос завершен)
2. И `allNotifications.length > 0` (есть данные)

Если запрос вернул пустой массив `[]`, то `isLoading` все равно будет `false`, но компонент может быть еще не готов.

---

## РЕКОМЕНДАЦИИ

1. **Использовать `waitForElementToBeRemoved`** для ожидания исчезновения loading
2. **Ждать появления конкретных элементов** (кнопка "Фильтры") вместо проверки отсутствия loading
3. **Добавить таймауты** для `waitFor` чтобы избежать бесконечного ожидания
4. **Проверить логику `isLoading`** - возможно, нужно изменить условие

---

## СЛЕДУЮЩИЕ ШАГИ

1. Применить исправления ожидания загрузки
2. Проверить соответствие title в тестах
3. Запустить тесты локально для проверки
4. Отправить изменения и проверить CI
