# План реализации: Wishlist на графике + DnD + Fullscreen

**Дата:** 2026-02-12
**Статус:** Draft — ждёт утверждения

---

## 0. Закрытые вопросы (раздел 7 ТЗ)

### Q1: affordableDate вне диапазона графика
**Решение:** Не показываем маркер. Привязка к краю графика — обман пользователя ("скоро доступно", хотя это через 2 года). Если `affordableDate > lastChartPoint.date` — маркер не создаём. В списке Top-3 под графиком item всё равно видно с текстом "~X мес.".

### Q2: UI-компонент для sheet
**Решение:** React Native `Modal` с `animationType="slide"` + transparent backdrop. Это устоявшийся паттерн проекта (`FilterSheet.tsx`, `TimezoneModal.tsx`, `MobileMenuSheet.tsx`). Сторонних bottom-sheet библиотек нет и не добавляем.

### Q3: Где живёт reorder
**Решение:** На существующем `WishlistScreen.tsx`. Добавляем кнопку-иконку (grip/menu) рядом с sort-кнопками → переключает FlatList на DraggableFlatList. Без отдельного экрана.

---

## 1. Важные находки из кодовой базы

| Факт | Где | Влияние |
|------|-----|---------|
| `TrendResponse.goals` уже есть | `mobile/types/analytics.ts` | Сервер уже отдаёт цели вместе с трендом — можно использовать вместо отдельного запроса wishlist для маркеров |
| `WishlistItem.prediction` включает `affordableDate` | `mobile/types/common.ts` | Тип готов, маппинг на клиенте — чистый |
| `FinancialTrendChart` — self-contained | `DashboardAnalyticsScreen.tsx:L87` | Рендерится как `<FinancialTrendChart />` без пропсов. Нужно добавить props для маркеров или fetch wishlist внутри |
| `useFinancialTrendChart` возвращает sampled data | `mobile/hooks/useFinancialTrendChart.ts` | Маркеры привязываем к sampled points, не к raw trendData |
| `hideDataPoints` = true | `FinancialTrendChart.tsx:L91` | Точки скрыты. `customDataPoint` не сработает без `showDataPoint: true` на конкретных точках |
| `pointerConfig` уже используется | `FinancialTrendChart.tsx:L103` | Tooltip есть, расширяем его wishlist-информацией |
| `react-native-reanimated` 4.1.1 | `package.json` | Совместим с `react-native-draggable-flatlist` |
| Миграции: следующий номер `011` | `migrations/` | Файл: `011_add_wishlist_sort_order.sql` |
| `AnalyticsScreens.tsx` — регистрация | `mobile/navigation/` | FullscreenChart добавляем сюда с `presentation: "modal"` |
| `useWishlistScreen` уже имеет query `["wishlist"]` | `mobile/hooks/useWishlistScreen.ts` | Reorder mutation инвалидирует тот же ключ |

---

## 2. Архитектурное решение: маркеры на графике

### Проблема с `customDataPoint`
gifted-charts рисует `customDataPoint` только для точек с `showDataPoint: true`. Сейчас все точки имеют `showDataPoint: false`.

### Решение
В `useFinancialTrendChart` при маппинге `capitalData` — для точек, совпадающих с wishlist marker index, ставим `showDataPoint: true` + `customDataPoint` компонент. Остальные точки остаются `showDataPoint: false`.

Это требует, чтобы хук `useFinancialTrendChart` знал о wishlist markers. Два варианта:

**Вариант A:** Fetch wishlist внутри `useFinancialTrendChart` (загрязняет хук chart-а бизнес-логикой wishlist).

**Вариант B (выбран):** Новый хук `useWishlistChart` принимает `sampled TrendDataPoint[]` и `WishlistItem[]`, возвращает `markers[]`. Компонент `FinancialTrendChart` получает markers через props и применяет их к `capitalData`.

Это означает:
- `FinancialTrendChart` получает необязательный prop `wishlistMarkers`
- `DashboardAnalyticsScreen` вызывает `useWishlistChart` и пробрасывает маркеры в `<FinancialTrendChart wishlistMarkers={markers} />`
- `useFinancialTrendChart` экспортирует `trendData` (sampled) для передачи в `useWishlistChart`

---

## 3. Порядок выполнения (22 шага)

### Фаза 0: Зависимости и миграция

**Шаг 1.** Установить npm-пакеты
```
cd mobile && npm install react-native-draggable-flatlist expo-screen-orientation
```

**Шаг 2.** Миграция БД: `sortOrder` в wishlist
- Файл: `migrations/011_add_wishlist_sort_order.sql`
- Содержимое:
```sql
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
UPDATE wishlist SET sort_order = id WHERE sort_order = 0;
```

**Шаг 3.** Обновить `shared/schema.ts`
- Добавить `sortOrder: integer("sort_order").default(0)` в таблицу `wishlist`

---

### Фаза 1: Server — reorder endpoint

**Шаг 4.** Тест first: `server/__tests__/wishlist-reorder.test.ts`
- Кейсы:
  - rejects пустой массив
  - rejects чужие ids (userId mismatch)
  - requires unique sortOrder 1..N
  - updates orders and returns sorted list
  - не ломает items других пользователей

**Шаг 5.** `server/repositories/wishlist.repository.ts` — добавить метод `reorderWishlist`
```typescript
async reorderWishlist(userId: number, items: { id: number; sortOrder: number }[]): Promise<void> {
  // Транзакция: обновить sortOrder для каждого item
  // Все items должны принадлежать userId
}
```

**Шаг 6.** `server/routes/wishlist.routes.ts` — добавить `PATCH /api/wishlist/reorder`
- Validation: массив `[{ id: number, sortOrder: number }]`
- Auth: `withAuth`
- Проверка: все id принадлежат req.user.id
- Ответ: обновлённый список wishlist с predictions (переиспользуем логику из GET)

---

### Фаза 2: Mobile — хук маркеров графика

**Шаг 7.** Тест first: `mobile/__tests__/hooks/useWishlistChart.test.ts`
- Кейсы:
  - exact match: `affordableDate === point.date` → marker на этом index
  - between points: выбираем ближайшую точку (не дальше ±1 step)
  - outside range: `affordableDate > lastPoint.date` → маркер не создаём
  - multiple items same date → группируются в один marker с `items[]`
  - items без `affordableDate` (null) → пропускаем
  - items с `isPurchased: true` → пропускаем
  - пустой wishlist → пустой массив markers

**Шаг 8.** `mobile/hooks/useWishlistChart.ts` (~80 LOC)
```typescript
export interface WishlistChartMarker {
  index: number;      // индекс в sampled capitalData
  date: string;       // дата точки графика
  items: WishlistItem[]; // одна или несколько целей
}

export function computeWishlistMarkers(
  sampledData: TrendDataPoint[],
  wishlistItems: WishlistItem[],
): WishlistChartMarker[]

export function useWishlistChart(): {
  markers: WishlistChartMarker[];
  wishlistItems: WishlistItem[];
  isLoading: boolean;
}
```
- `computeWishlistMarkers` — pure function (тестируемая)
- `useWishlistChart` — обёртка с `useQuery(["wishlist"])` и вызовом compute

---

### Фаза 3: Mobile — визуал маркеров на графике

**Шаг 9.** `mobile/components/wishlist/WishlistChartMarker.tsx` (~60 LOC)
- React component для `customDataPoint` в gifted-charts
- Рисует: маленький кружок (⊕) цвета `theme.primary` + бейдж "+N" если `items.length > 1`
- Размер: 20x20

**Шаг 10.** Модификация `mobile/hooks/useFinancialTrendChart.ts`
- Экспортировать `sampledTrendData` (массив `TrendDataPoint[]` после sampling) — нужен для `useWishlistChart`
- Без изменения существующего API хука (backwards compatible)

**Шаг 11.** Модификация `mobile/components/FinancialTrendChart.tsx`
- Добавить optional prop: `wishlistMarkers?: WishlistChartMarker[]`
- В маппинге `capitalData`: если точка совпадает с marker index → `showDataPoint: true`, `customDataPoint: () => <WishlistChartMarker />`
- В `pointerLabelComponent`: если текущая точка — marker → добавить строку "Доступно: {name}"

---

### Фаза 4: Mobile — WishlistMarkerSheet (модалка при тапе)

**Шаг 12.** `mobile/components/wishlist/WishlistMarkerSheet.tsx` (~120 LOC)
- `Modal` с `animationType="slide"`, transparent, bottom-aligned
- Props: `visible`, `onClose`, `items: WishlistItem[]`, `onEdit: (item) => void`
- Рендерит: список целей на выбранную дату
  - Название + сумма
  - Prediction status (Доступно / ~X мес. / Недостаточно)
  - Кнопка "Редактировать" → `navigation.navigate("AddWishlist", { wishlistItem })`
- Паттерн: как `FilterSheet.tsx`

**Шаг 13.** Подключение тапа в `FinancialTrendChart.tsx`
- State: `selectedMarker: WishlistChartMarker | null`
- При тапе на `customDataPoint` → `setSelectedMarker(marker)`
- Рендер `<WishlistMarkerSheet visible={!!selectedMarker} items={selectedMarker?.items} onClose={...} />`

---

### Фаза 5: Mobile — WishlistSummaryList (Top-3 под графиком)

**Шаг 14.** `mobile/components/wishlist/WishlistSummaryList.tsx` (~100 LOC)
- Props: `items: WishlistItem[]` (уже с predictions)
- Берёт top-3 по `sortOrder` (если sortOrder === 0 у всех — по id)
- Фильтрует `isPurchased: false`
- Каждый item: строка с:
  - Название (bold)
  - Сумма (muted)
  - Статус прогноза:
    - `canAfford` → "Уже доступно" (зелёный)
    - `monthsToAfford !== null` → "~X мес." (синий)
    - else → "Недостаточно средств" (красный)
- Кнопка "Все цели →" → `navigation.navigate("Wishlist")`

**Шаг 15.** Модификация `mobile/screens/DashboardAnalyticsScreen.tsx`
- Import `useWishlistChart` и `WishlistSummaryList`
- Между `<FinancialTrendChart>` и `<RecentTransactions>` добавить:
```tsx
<WishlistSummaryList items={wishlistItems} />
```
- Передать `wishlistMarkers` в `<FinancialTrendChart wishlistMarkers={markers} />`
- Добавить кнопку "На весь экран" (иконка maximize-2) рядом с заголовком графика

---

### Фаза 6: Mobile — Drag & Drop reorder

**Шаг 16.** Тест first: `mobile/__tests__/hooks/wishlistReorder.test.ts`
- Кейсы:
  - `buildReorderPayload(items)` → `[{ id, sortOrder: 1 }, { id, sortOrder: 2 }, ...]`
  - stable ordering after drag (from→to positions)
  - empty list → empty payload

**Шаг 17.** `mobile/hooks/useWishlistReorder.ts` (~80 LOC)
```typescript
export function buildReorderPayload(items: WishlistItem[]): { id: number; sortOrder: number }[]

export function useWishlistReorder(): {
  isReorderMode: boolean;
  setReorderMode: (v: boolean) => void;
  reorderItems: WishlistItem[];        // локальная копия для DnD
  handleDragEnd: (data: WishlistItem[]) => void;  // обновляет локально + мутация
  isSaving: boolean;
}
```
- Optimistic update: `queryClient.setQueryData(["wishlist"], ...)` при drag end
- Mutation: `PATCH /api/wishlist/reorder`
- При ошибке: rollback через `onError` + Alert

**Шаг 18.** `mobile/components/wishlist/WishlistReorderList.tsx` (~120 LOC)
- Обёртка над `DraggableFlatList` из `react-native-draggable-flatlist`
- Props: `items`, `onDragEnd`, `renderItem`
- Каждый item: `#N` слева + название + grip-иконка справа
- `ScaleDecorator` при drag

**Шаг 19.** Модификация `mobile/screens/WishlistScreen.tsx`
- Import `useWishlistReorder` и `WishlistReorderList`
- Добавить кнопку-иконку "menu" (или "move") в header рядом с "Add"
- Условный рендер:
  - `isReorderMode` → `<WishlistReorderList />`
  - else → текущий `<FlatList />`

---

### Фаза 7: Fullscreen Chart

**Шаг 20.** `mobile/hooks/useFullscreenChart.ts` (~40 LOC)
```typescript
export function useFullscreenChart(): void
// useEffect: unlock landscape on mount, lock portrait on unmount
// Uses ScreenOrientation from expo-screen-orientation
```

**Шаг 21.** `mobile/screens/FullscreenChartScreen.tsx` (~150 LOC)
- Вызывает `useFullscreenChart()` для landscape
- Рендерит `useFinancialTrendChart()` с бОльшим `screenWidth`
- Контролы: ChartControls (7D/30D/90D/1Y + Forecast toggle) + Close button (X)
- Маркеры wishlist: переиспользует `useWishlistChart` + передаёт в `<FinancialTrendChart />`
- Без `WishlistSummaryList` — только график

**Шаг 22.** Регистрация навигации
- `mobile/navigation/AnalyticsScreens.tsx`: добавить `FullscreenChart` с `presentation: "modal"`
- `mobile/navigation/RootStackNavigator.tsx`: добавить `FullscreenChart: undefined` в `RootStackParamList`

---

### Фаза 8: i18n ключи

Файл: `shared/i18n/mobile-extra.ts`

```
wishlist.summary_title        "Goals"                              "Цели"
wishlist.all_goals            "All goals →"                        "Все цели →"
wishlist.available_now        "Available now"                      "Уже доступно"
wishlist.available_in_months  "~{count} months"                   "~{count} мес."
wishlist.not_affordable       "Not enough funds"                   "Недостаточно средств"
wishlist.reorder              "Reorder"                            "Порядок"
wishlist.reorder_saved        "Order saved"                        "Порядок сохранён"
wishlist.drag_hint            "Hold and drag to reorder"           "Удерживайте и перетаскивайте"
chart.fullscreen              "Full screen"                        "На весь экран"
chart.close_fullscreen        "Close"                              "Закрыть"
chart.goal_available          "Available: {name}"                  "Доступно: {name}"
chart.goals_on_date           "{count} goals on this date"         "{count} целей на эту дату"
nav.fullscreen_chart          "Chart"                              "График"
```

---

## 4. Граф зависимостей между шагами

```
Шаг 1 (npm install) ─────────────────────────────┐
Шаг 2 (migration) ──→ Шаг 3 (schema) ──→ Шаг 5 (repo) ──→ Шаг 6 (route)
                                                   │
Шаг 4 (server test) ──────────────────────→ Шаг 6 ─┤
                                                     │
Шаг 7 (chart test) ──→ Шаг 8 (useWishlistChart) ────┤
                                                      │
Шаг 10 (export sampledData) ──→ Шаг 8 ───────────────┤
                                                       │
Шаг 9 (MarkerComponent) ──→ Шаг 11 (chart props) ─────┤
                                                        │
Шаг 12 (MarkerSheet) ──→ Шаг 13 (tap handler) ─────────┤
                                                         │
Шаг 14 (SummaryList) ──→ Шаг 15 (Dashboard) ────────────┤
                                                          │
Шаг 16 (reorder test) ──→ Шаг 17 (useReorder) ──→ Шаг 18 (DnD list) ──→ Шаг 19 (WishlistScreen)
                                                          │
Шаг 20 (useFullscreen) ──→ Шаг 21 (FullscreenScreen) ──→ Шаг 22 (navigation)
```

**Параллельные треки:**
- Track A: Server (шаги 2-6)
- Track B: Chart markers (шаги 7-13)
- Track C: Summary list (шаг 14)
- Track D: DnD reorder (шаги 16-19)
- Track E: Fullscreen (шаги 20-22)

Tracks B, C, D, E зависят от Track A (нужен `sortOrder` в ответе API).
Track B и C могут идти параллельно.
Track D зависит от Шага 1 (npm install).
Track E зависит от Шага 1 (npm install).

---

## 5. Полный список файлов

### Новые файлы (12)

| # | Файл | LOC | Назначение |
|---|-------|-----|------------|
| 1 | `migrations/011_add_wishlist_sort_order.sql` | ~5 | Миграция: добавить sortOrder |
| 2 | `server/__tests__/wishlist-reorder.test.ts` | ~80 | Тесты reorder endpoint |
| 3 | `mobile/__tests__/hooks/useWishlistChart.test.ts` | ~80 | Тесты маппинга маркеров |
| 4 | `mobile/__tests__/hooks/wishlistReorder.test.ts` | ~50 | Тесты reorder payload |
| 5 | `mobile/hooks/useWishlistChart.ts` | ~80 | Хук: wishlist → chart markers |
| 6 | `mobile/hooks/useWishlistReorder.ts` | ~80 | Хук: DnD + mutation |
| 7 | `mobile/hooks/useFullscreenChart.ts` | ~40 | Хук: orientation lock/unlock |
| 8 | `mobile/components/wishlist/WishlistChartMarker.tsx` | ~60 | Компонент маркера на графике |
| 9 | `mobile/components/wishlist/WishlistMarkerSheet.tsx` | ~120 | Модалка при тапе на маркер |
| 10 | `mobile/components/wishlist/WishlistSummaryList.tsx` | ~100 | Top-3 список под графиком |
| 11 | `mobile/components/wishlist/WishlistReorderList.tsx` | ~120 | DraggableFlatList обёртка |
| 12 | `mobile/screens/FullscreenChartScreen.tsx` | ~150 | Fullscreen modal экран |

### Изменяемые файлы (9)

| # | Файл | Изменения |
|---|-------|-----------|
| 1 | `shared/schema.ts` | +1 строка: `sortOrder` column |
| 2 | `server/repositories/wishlist.repository.ts` | +15 строк: метод `reorderWishlist` |
| 3 | `server/routes/wishlist.routes.ts` | +30 строк: `PATCH /reorder` endpoint |
| 4 | `mobile/hooks/useFinancialTrendChart.ts` | +3 строки: экспорт `sampledTrendData` |
| 5 | `mobile/components/FinancialTrendChart.tsx` | +25 строк: props markers, customDataPoint, MarkerSheet |
| 6 | `mobile/screens/DashboardAnalyticsScreen.tsx` | +15 строк: WishlistSummary + fullscreen button |
| 7 | `mobile/screens/WishlistScreen.tsx` | +20 строк: reorder mode toggle |
| 8 | `mobile/navigation/AnalyticsScreens.tsx` | +3 строки: FullscreenChart registration |
| 9 | `mobile/navigation/RootStackNavigator.tsx` | +1 строка: FullscreenChart param type |
| 10 | `shared/i18n/mobile-extra.ts` | +13 строк: новые ключи |

---

## 6. Тесты (обязательные, TDD-first)

### `mobile/__tests__/hooks/useWishlistChart.test.ts`
```
describe("computeWishlistMarkers")
  ✓ exact date match → marker at correct index
  ✓ date between two points → picks closest
  ✓ date beyond last point → no marker
  ✓ date before first point → no marker
  ✓ multiple items same affordableDate → one marker with items[]
  ✓ items with null affordableDate → skipped
  ✓ isPurchased items → skipped
  ✓ empty wishlist → empty markers
  ✓ empty trendData → empty markers
```

### `mobile/__tests__/hooks/wishlistReorder.test.ts`
```
describe("buildReorderPayload")
  ✓ assigns sortOrder 1..N in order
  ✓ preserves item ids
  ✓ empty list → empty payload
  ✓ single item → [{ id, sortOrder: 1 }]
```

### `server/__tests__/wishlist-reorder.test.ts`
```
describe("PATCH /api/wishlist/reorder")
  ✓ updates sort order for all items
  ✓ rejects empty array (400)
  ✓ rejects items not belonging to user (403)
  ✓ rejects duplicate sortOrder values (400)
  ✓ requires authentication (401)
```

---

## 7. Definition of Done (чеклист)

- [ ] `npx tsc --noEmit` — 0 ошибок (mobile + server)
- [ ] Все тесты green: `npm test -- --forceExit`
- [ ] Никаких `test.skip`, `describe.skip`, `console.log`, `any` без причины
- [ ] Каждый файл ≤ 200 LOC
- [ ] DashboardAnalytics: маркеры целей на линии capital
- [ ] DashboardAnalytics: тап по маркеру → modal со списком целей
- [ ] DashboardAnalytics: бейдж "+N" при >1 цели на дату
- [ ] DashboardAnalytics: Top-3 список под графиком
- [ ] Wishlist: кнопка reorder → DnD режим
- [ ] Wishlist: ранг #1..N виден слева
- [ ] Wishlist: порядок сохраняется через PATCH /reorder
- [ ] Fullscreen: модалка с landscape
- [ ] Fullscreen: portrait восстанавливается при закрытии
- [ ] i18n: все строки — EN + RU

---

## 8. Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| `customDataPoint` не работает с `hideDataPoints` | Средняя | Поставить `showDataPoint: true` только для marker-точек |
| `draggable-flatlist` несовместим с reanimated 4.1 | Низкая | Проверить при `npm install`, fallback: PanResponder |
| `expo-screen-orientation` требует rebuild | Средняя | В Expo 54 должен работать без eject, но проверить |
| Marker перекрывает tooltip | Средняя | Z-index + offset маркера выше линии |
| Server: транзакция reorder может быть медленной | Низкая | Wishlist обычно <20 items, ОК |
