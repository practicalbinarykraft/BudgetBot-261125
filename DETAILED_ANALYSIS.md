# ДЕТАЛЬНЫЙ АНАЛИЗ ПАДЕНИЯ ТЕСТОВ

## Дата: 2026-01-30
## Запуск CI: 21507102741

---

## ПРОБЛЕМА

Два теста падают по таймауту:
1. "should filter notifications by type - missed"
2. "should filter notifications by type - upcoming"

---

## АНАЛИЗ КОДА ТЕСТОВ

### Тест "missed" (строки 240-306):

```typescript
// Создает уведомления:
// - Notification 1: дата = yesterday (вчера)
// - Notification 2: дата = today (сегодня)

// Применяет фильтр:
await waitFor(() => {
  const missedOption = screen.getByText('Пропущенные');
  fireEvent.click(missedOption);
});

// Ожидает результат:
await waitFor(() => {
  expect(screen.getByText('Notification 1')).toBeInTheDocument();
  expect(screen.queryByText('Notification 2')).not.toBeInTheDocument();
});
```

### Тест "upcoming" (строки 374-440):

```typescript
// Создает уведомления:
// - Notification 1: дата = yesterday (вчера)
// - Notification 2: дата = tomorrow (завтра)

// Применяет фильтр:
await waitFor(() => {
  const upcomingOption = screen.getByText('Предстоящие');
  fireEvent.click(upcomingOption);
});

// Ожидает результат:
await waitFor(() => {
  expect(screen.queryByText('Notification 1')).not.toBeInTheDocument();
  expect(screen.getByText('Notification 2')).toBeInTheDocument();
});
```

---

## КОРНЕВАЯ ПРИЧИНА

### Проблема #1: Неправильное использование `waitFor` с `fireEvent.click`

**Строки 297-300 и 431-434:**
```typescript
await waitFor(() => {
  const missedOption = screen.getByText('Пропущенные');
  fireEvent.click(missedOption);
});
```

**Почему это неправильно:**
1. `waitFor` ожидает, что условие внутри станет `true`
2. `fireEvent.click` возвращает `void`, не `true`
3. `waitFor` может завершиться до того, как клик обработается
4. Select может не закрыться после клика
5. Состояние компонента может не обновиться синхронно

**Правильный подход:**
1. Сначала дождаться появления опции
2. Потом кликнуть на неё
3. Потом дождаться закрытия Select (если нужно)
4. Потом дождаться изменения в DOM

---

### Проблема #2: Radix UI Select может не закрываться автоматически

Radix UI Select может не закрываться автоматически после клика на опцию в тестовой среде. Нужно явно дождаться закрытия или использовать другой подход.

---

### Проблема #3: Асинхронное обновление состояния

После клика на опцию:
1. `onValueChange` вызывается
2. `setFilterType` обновляет состояние
3. `useMemo` пересчитывает отфильтрованные уведомления
4. Компонент перерисовывается

Это может занять время, и тест не дожидается завершения этого процесса.

---

## ЛОГИКА ФИЛЬТРАЦИИ (проверка)

### Для "missed":
```typescript
if (filterType === "missed") {
  return transDate < today && 
         notification.status !== "completed" && 
         notification.status !== "dismissed";
}
```

**Проверка:**
- Notification 1 (yesterday): `yesterday < today` = `true` ✅
- Notification 2 (today): `today < today` = `false` ✅

**Логика правильная!**

### Для "upcoming":
```typescript
if (filterType === "upcoming") {
  return transDate > today;
}
```

**Проверка:**
- Notification 1 (yesterday): `yesterday > today` = `false` ✅
- Notification 2 (tomorrow): `tomorrow > today` = `true` ✅

**Логика правильная!**

---

## РЕШЕНИЕ

### Решение #1: Исправить порядок действий в тестах

**Было:**
```typescript
await waitFor(() => {
  const missedOption = screen.getByText('Пропущенные');
  fireEvent.click(missedOption);
});
```

**Должно быть:**
```typescript
// 1. Дождаться появления опции
await waitFor(() => {
  expect(screen.getByText('Пропущенные')).toBeInTheDocument();
});

// 2. Кликнуть на опцию
const missedOption = screen.getByText('Пропущенные');
fireEvent.click(missedOption);

// 3. Дождаться закрытия Select (опционально, но рекомендуется)
await waitFor(() => {
  expect(screen.queryByText('Пропущенные')).not.toBeInTheDocument();
}, { timeout: 1000 });

// 4. Дождаться изменения в DOM
await waitFor(() => {
  expect(screen.getByText('Notification 1')).toBeInTheDocument();
  expect(screen.queryByText('Notification 2')).not.toBeInTheDocument();
});
```

---

### Решение #2: Использовать `getByRole('option')` вместо `getByText`

Более надежный способ найти опцию в Select:

```typescript
// Дождаться появления опции
await waitFor(() => {
  expect(screen.getByRole('option', { name: 'Пропущенные' })).toBeInTheDocument();
});

// Кликнуть на опцию
const missedOption = screen.getByRole('option', { name: 'Пропущенные' });
fireEvent.click(missedOption);
```

---

### Решение #3: Добавить небольшую задержку после клика

Если Select не закрывается сразу, можно добавить небольшую задержку:

```typescript
fireEvent.click(missedOption);
// Дать время на обработку клика и закрытие Select
await new Promise(resolve => setTimeout(resolve, 100));
```

Но это не идеальное решение - лучше дождаться закрытия Select явно.

---

## РЕКОМЕНДУЕМОЕ РЕШЕНИЕ

Использовать комбинацию решений #1 и #2:

1. Дождаться появления опции через `getByRole('option')`
2. Кликнуть на опцию
3. Дождаться закрытия Select (проверить, что опция больше не видна)
4. Дождаться изменения в DOM (появления/исчезновения уведомлений)

---

## ПЛАН ИСПРАВЛЕНИЯ

1. ✅ Исправить тест "missed":
   - ✅ Разделить `waitFor` и `fireEvent.click`
   - ✅ Использовать `getByRole('option')` для поиска опции
   - ✅ Добавить ожидание закрытия Select

2. ✅ Исправить тест "upcoming":
   - ✅ То же самое, что и для "missed"

3. ✅ Проверить, что логика фильтрации работает правильно (уже проверено - работает)

## ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ

Оба теста теперь используют правильный паттерн:
1. Дождаться появления опции через `getByRole('option')`
2. Кликнуть на опцию
3. Дождаться закрытия Select
4. Дождаться изменения в DOM (появления/исчезновения уведомлений)
