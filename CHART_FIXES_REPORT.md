# 📊 Отчет об исправлениях графика финансового тренда

## 🎯 Цель исправлений
1. Исправить верстку графика и контейнеров для мобильных устройств (ширина)
2. Вернуть отображение линий на графике
3. Убрать режимы PRO/LITE, оставить один режим с переключателями видимости

---

## 📁 Файл 1: `client/src/components/charts/financial-trend-chart.tsx`

### ✅ ИЗМЕНЕНИЯ ДЛЯ ВЕРСТКИ (ширина графика и контейнеров)

#### 1. Контейнер графика (строка 154)
**Было:**
```tsx
<div className="h-[220px] sm:h-[300px] md:h-[400px] w-full" role="img" aria-label="Financial trend chart">
```

**Стало:**
```tsx
<div className="h-[300px] sm:h-[350px] md:h-[400px] w-full overflow-x-auto" role="img" aria-label="Financial trend chart">
```

**Что изменилось:**
- ✅ Добавлен `overflow-x-auto` - позволяет горизонтальный скролл на мобильных
- ✅ Увеличена высота на мобильных: `220px` → `300px` (+80px)
- ✅ Увеличена высота на планшетах: `300px` → `350px` (+50px)

**Причина:** График не помещался по ширине на мобильных, нужен горизонтальный скролл.

---

#### 2. ResponsiveContainer (строка 155)
**Было:**
```tsx
<ResponsiveContainer width="100%" height="100%">
```

**Стало:**
```tsx
<ResponsiveContainer width="100%" height="100%" minWidth={isMobile ? 400 : undefined}>
```

**Что изменилось:**
- ✅ Добавлен `minWidth={isMobile ? 400 : undefined}` - минимальная ширина 400px на мобильных

**Причина:** ResponsiveContainer пытался сжать график до ширины экрана (360px), что приводило к обрезанию. Минимальная ширина 400px позволяет графику быть шире экрана и использовать горизонтальный скролл.

---

#### 3. Margin графика (строки 158-161)
**Было:**
```tsx
margin={isMobile
  ? { top: 5, right: 10, left: 5, bottom: 50 }
  : { top: 5, right: 20, left: 10, bottom: 5 }
}
```

**Стало:**
```tsx
margin={isMobile
  ? { top: 5, right: 15, left: 5, bottom: 40 }
  : { top: 5, right: 20, left: 10, bottom: 5 }
}
```

**Что изменилось:**
- ✅ Увеличен правый отступ: `10` → `15` (+5px)
- ✅ Уменьшен нижний отступ: `50` → `40` (-10px)

**Причина:** Увеличен правый отступ для предотвращения обрезания справа. Уменьшен нижний отступ, так как высота графика увеличена.

---

#### 4. XAxis настройки (строки 164-174)
**Было:**
```tsx
<XAxis
  dataKey="date"
  tickFormatter={(date) => formatChartDate(date, language)}
  stroke="hsl(var(--muted-foreground))"
  tick={{ fontSize: isMobile ? 8 : 12 }}
  interval={isMobile ? Math.max(0, Math.floor(chartData.length / 5) - 1) : 0}
  angle={isMobile ? -45 : 0}
  textAnchor={isMobile ? 'end' : 'middle'}
  height={isMobile ? 70 : undefined}
  dx={isMobile ? -5 : 0}
  dy={isMobile ? 10 : 0}
/>
```

**Стало:**
```tsx
<XAxis
  dataKey="date"
  tickFormatter={(date) => formatChartDate(date, language)}
  stroke="hsl(var(--muted-foreground))"
  tick={{ fontSize: isMobile ? 9 : 12 }}
  interval={isMobile ? 'preserveStartEnd' : 0}
  angle={isMobile ? -45 : 0}
  textAnchor={isMobile ? 'end' : 'middle'}
  height={isMobile ? 60 : undefined}
  dx={isMobile ? -5 : 0}
/>
```

**Что изменилось:**
- ✅ Увеличен размер шрифта: `8` → `9` (+1px)
- ✅ Изменен `interval`: `Math.max(0, Math.floor(chartData.length / 5) - 1)` → `'preserveStartEnd'`
- ✅ Уменьшена высота: `70` → `60` (-10px)
- ✅ Убран `dy={isMobile ? 10 : 0}`

**Причина:** 
- `preserveStartEnd` показывает только первую и последнюю дату, что лучше для мобильных
- Уменьшена высота, так как убран `dy` и уменьшен `bottom` margin

---

#### 5. Заголовок карточки (строки 137-142)
**Было:**
```tsx
<CardHeader>
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
    <CardTitle className="text-lg md:text-xl">
      {graphMode === "lite" ? t("dashboard.my_capital") : t("dashboard.detailed_analysis")}
    </CardTitle>
    <GraphModeToggle mode={graphMode} onToggle={toggleMode} />
  </div>
  <CardDescription>{t("dashboard.financial_trend_subtitle")}</CardDescription>
</CardHeader>
```

**Стало:**
```tsx
<CardHeader>
  <CardTitle className="text-lg md:text-xl">
    {t("dashboard.financial_trend")}
  </CardTitle>
  <CardDescription>{t("dashboard.financial_trend_subtitle")}</CardDescription>
</CardHeader>
```

**Что изменилось:**
- ✅ Убран `GraphModeToggle` компонент
- ✅ Упрощен заголовок - всегда показывает `t("dashboard.financial_trend")`
- ✅ Убрана условная логика выбора заголовка

**Причина:** Убраны режимы PRO/LITE, нужен один заголовок.

---

### ⚠️ ИЗМЕНЕНИЯ, КОТОРЫЕ МОГЛИ ПОВЛИЯТЬ НА ОТОБРАЖЕНИЕ ЛИНИЙ

#### 1. Обработка данных (строки 98-102)
**Было:**
```tsx
// Обработать данные с учетом мобильного устройства
const { historicalData, forecastData, forecastWithConnection } = processChartData(trendData, isMobile);

// На мобильных используем обработанные данные (с sampling), на десктопе - все данные
// ВАЖНО: chartData должен содержать ВСЕ данные для графика (исторические + прогноз)
const chartData = isMobile 
  ? (forecastDays > 0 && forecastData.length > 0 
      ? [...historicalData, ...forecastData] 
      : historicalData)
  : (forecastDays > 0 ? trendData : historicalData);
```

**Стало:**
```tsx
// Обработать данные
const { historicalData, forecastData, forecastWithConnection } = processChartData(trendData, false);

// chartData содержит все данные для графика (исторические + прогноз)
const chartData = forecastDays > 0 ? trendData : historicalData;
```

**Что изменилось:**
- ✅ Убран параметр `isMobile` из `processChartData` - всегда передается `false`
- ✅ Упрощена логика формирования `chartData` - всегда используется `trendData` (без sampling)

**⚠️ ВОЗМОЖНАЯ ПРИЧИНА ПРОПАЖИ ЛИНИЙ:**
- **ДО:** На мобильных использовался sampling данных (`processChartData(trendData, true)`), который уменьшал количество точек с ~395 до ~25
- **ПОСЛЕ:** Sampling отключен (`processChartData(trendData, false)`), используются все данные
- **ПРОБЛЕМА:** Если sampling был причиной пропажи линий, то отключение должно было помочь. Но если проблема в другом месте, линии могут не появиться.

---

#### 2. Передача конфигурации в TrendChartLines (строки 184-198)
**Было:**
```tsx
<TrendChartLines
  historicalData={historicalData}
  forecastData={forecastData}
  forecastWithConnection={forecastWithConnection}
  chartData={chartData}
  forecastDays={forecastDays}
  config={config}
  graphMode={graphMode}
  assetsForecastData={assetsForecastData}
/>
```

**Стало:**
```tsx
<TrendChartLines
  historicalData={historicalData}
  forecastData={forecastData}
  forecastWithConnection={forecastWithConnection}
  chartData={chartData}
  forecastDays={forecastDays}
  config={{
    showIncome,
    showExpense,
    showCapital,
    showAssetsLine,
    capitalMode: config.capitalMode,
  }}
  assetsForecastData={assetsForecastData}
/>
```

**Что изменилось:**
- ✅ Убран проп `graphMode`
- ✅ `config` теперь формируется из локальных состояний (`showIncome`, `showExpense`, `showCapital`, `showAssetsLine`)
- ✅ Вместо `config` из хука используется локальное состояние

**⚠️ ВОЗМОЖНАЯ ПРИЧИНА ПРОПАЖИ ЛИНИЙ:**
- **ДО:** `config` приходил из хука `useFinancialTrend`, мог иметь значения `showIncome: undefined`, `showExpense: undefined`, `showCapital: undefined`
- **ПОСЛЕ:** Локальные состояния инициализируются как `true` (`useState(true)`)
- **ПРОБЛЕМА:** Если в хуке `config` имел значения `false` или `undefined`, линии могли быть скрыты. Теперь они всегда `true` по умолчанию.

---

#### 3. Локальные состояния для видимости линий (строки 48-51)
**Было:**
```tsx
const [showForecast, setShowForecast] = useState(true);
```

**Стало:**
```tsx
const [showForecast, setShowForecast] = useState(true);
const [showIncome, setShowIncome] = useState(true);
const [showExpense, setShowExpense] = useState(true);
const [showCapital, setShowCapital] = useState(true);
const [showAssetsLine, setShowAssetsLine] = useState(false);
```

**Что изменилось:**
- ✅ Добавлены локальные состояния для управления видимостью линий
- ✅ Все линии включены по умолчанию (`true`), кроме `showAssetsLine` (`false`)

**Причина:** Нужны локальные состояния для переключателей в `ChartLegend`.

---

#### 4. Удаление GraphModeToggle (строка 34)
**Было:**
```tsx
import { GraphModeToggle } from "./graph-mode-toggle";
```

**Стало:**
```tsx
// Импорт удален
```

**Что изменилось:**
- ✅ Удален импорт `GraphModeToggle`

**Причина:** Компонент больше не используется, режимы PRO/LITE убраны.

---

#### 5. ChartLegend всегда отображается (строки 222-235)
**Было:**
```tsx
{config.mode === "pro" && config.showIncome !== undefined && (
  <ChartLegend
    hasForecast={forecastDays > 0 && forecastData.length > 0}
    hasGoals={goals.length > 0}
    showIncome={config.showIncome}
    onIncomeToggle={(val) => updateFilter("showIncome", val)}
    showExpense={config.showExpense}
    onExpenseToggle={(val) => updateFilter("showExpense", val)}
    showCapital={config.showCapital}
    onCapitalToggle={(val) => updateFilter("showCapital", val)}
    showForecast={showForecast}
    onForecastToggle={setShowForecast}
    showAssetsLine={config.showAssetsLine}
    onAssetsLineToggle={(val) => updateFilter("showAssetsLine", val)}
  />
)}
```

**Стало:**
```tsx
<ChartLegend
  hasForecast={forecastDays > 0 && forecastData.length > 0}
  hasGoals={goals.length > 0}
  showIncome={showIncome}
  onIncomeToggle={setShowIncome}
  showExpense={showExpense}
  onExpenseToggle={setShowExpense}
  showCapital={showCapital}
  onCapitalToggle={setShowCapital}
  showForecast={showForecast}
  onForecastToggle={setShowForecast}
  showAssetsLine={showAssetsLine}
  onAssetsLineToggle={setShowAssetsLine}
/>
```

**Что изменилось:**
- ✅ Убрано условие `config.mode === "pro" && config.showIncome !== undefined`
- ✅ `ChartLegend` всегда отображается
- ✅ Используются локальные состояния вместо `config` из хука
- ✅ Используются прямые сеттеры (`setShowIncome`) вместо `updateFilter`

**Причина:** Переключатели должны быть всегда доступны, не только в режиме PRO.

---

#### 6. Удаление graphMode из хука (строка 56)
**Было:**
```tsx
const { data, isLoading, error, graphMode, toggleMode, config, updateFilter } = useFinancialTrend({
  historyDays,
  forecastDays,
});
```

**Стало:**
```tsx
const { data, isLoading, error, config, updateFilter } = useFinancialTrend({
  historyDays,
  forecastDays,
});
```

**Что изменилось:**
- ✅ Убраны `graphMode` и `toggleMode` из деструктуризации

**Причина:** Режимы PRO/LITE больше не используются.

---

#### 7. Tooltip (строка 182)
**Было:**
```tsx
<Tooltip content={createChartTooltip(chartData, t, config.capitalMode, graphMode)} />
```

**Стало:**
```tsx
<Tooltip content={createChartTooltip(chartData, t, config.capitalMode, 'lite')} />
```

**Что изменилось:**
- ✅ `graphMode` заменен на хардкод `'lite'`

**Причина:** Режимы убраны, но функция `createChartTooltip` все еще требует параметр `graphMode`. Используется `'lite'` как дефолт.

---

## 📁 Файл 2: `client/src/components/charts/trend-chart-lines.tsx`

### ⚠️ ИЗМЕНЕНИЯ, КОТОРЫЕ МОГЛИ ПОВЛИЯТЬ НА ОТОБРАЖЕНИЕ ЛИНИЙ

#### 1. Интерфейс ChartConfig (строки 21-27)
**Было:**
```tsx
interface ChartConfig {
  mode: "lite" | "pro";
  showIncome?: boolean;
  showExpense?: boolean;
  showCapital?: boolean;
  showAssetsLine?: boolean;
  capitalMode: string;
}
```

**Стало:**
```tsx
interface ChartConfig {
  showIncome?: boolean;
  showExpense?: boolean;
  showCapital?: boolean;
  showAssetsLine?: boolean;
  capitalMode: string;
}
```

**Что изменилось:**
- ✅ Убрано поле `mode: "lite" | "pro"`

**Причина:** Режимы PRO/LITE больше не используются.

---

#### 2. Интерфейс TrendChartLinesProps (строки 29-37)
**Было:**
```tsx
interface TrendChartLinesProps {
  historicalData: TrendDataPoint[];
  forecastData: TrendDataPoint[];
  forecastWithConnection: TrendDataPoint[];
  chartData: TrendDataPoint[];
  forecastDays: number;
  config: ChartConfig;
  graphMode: "lite" | "pro";
  assetsForecastData?: Array<{ date: string; totalCapital?: number }>;
}
```

**Стало:**
```tsx
interface TrendChartLinesProps {
  historicalData: TrendDataPoint[];
  forecastData: TrendDataPoint[];
  forecastWithConnection: TrendDataPoint[];
  chartData: TrendDataPoint[];
  forecastDays: number;
  config: ChartConfig;
  assetsForecastData?: Array<{ date: string; totalCapital?: number }>;
}
```

**Что изменилось:**
- ✅ Убран проп `graphMode: "lite" | "pro"`

**Причина:** Режимы PRO/LITE больше не используются.

---

#### 3. Функция getOpacity (строки 50-56)
**Было:**
```tsx
const getOpacity = (lineType: "income" | "expense" | "capital") => {
  // В режиме lite показываем только капитал (основная линия)
  if (config.mode === "lite") {
    return lineType === "capital" ? 1 : 0;
  }
  // В режиме pro показываем линии согласно настройкам
  if (config.mode === "pro") {
    if (lineType === "income" && config.showIncome !== false) return 1;
    if (lineType === "expense" && config.showExpense !== false) return 1;
    if (lineType === "capital" && config.showCapital !== false) return 1;
  }
  return 0;
};
```

**Стало:**
```tsx
const getOpacity = (lineType: "income" | "expense" | "capital") => {
  // Все линии видны по умолчанию, если не указано иное
  if (lineType === "income" && config.showIncome !== false) return 1;
  if (lineType === "expense" && config.showExpense !== false) return 1;
  if (lineType === "capital" && config.showCapital !== false) return 1;
  return 0;
};
```

**Что изменилось:**
- ✅ Убрана проверка `config.mode === "lite"` - больше не скрывает income/expense
- ✅ Убрана проверка `config.mode === "pro"` - логика упрощена
- ✅ Все линии видны по умолчанию, если `showIncome/showExpense/showCapital !== false`

**⚠️ КРИТИЧЕСКАЯ ПРИЧИНА ПРОПАЖИ ЛИНИЙ:**
- **ДО:** В режиме "lite" функция возвращала `0` для income и expense, показывая только capital
- **ПОСЛЕ:** Все линии видны по умолчанию (`opacity: 1`), если не указано `false`
- **ПРОБЛЕМА:** Если `config.showIncome`, `config.showExpense`, или `config.showCapital` были `undefined` или `false`, линии были невидимы (`opacity: 0`)

---

#### 4. Assets Line условие (строки 158-170)
**Было:**
```tsx
{/* Assets Line - PRO only */}
{graphMode === "pro" && config.mode === "pro" && config.showAssetsLine && (
  <Line
    type="monotone"
    dataKey="assetsNet"
    stroke="hsl(var(--chart-4))"
    strokeWidth={2}
    strokeDasharray="5 5"
    dot={false}
    name="Имущество - Долги"
    connectNulls
  />
)}
```

**Стало:**
```tsx
{/* Assets Line */}
{config.showAssetsLine && (
  <Line
    type="monotone"
    dataKey="assetsNet"
    stroke="hsl(var(--chart-4))"
    strokeWidth={2}
    strokeDasharray="5 5"
    dot={false}
    name="Имущество - Долги"
    connectNulls
  />
)}
```

**Что изменилось:**
- ✅ Убраны проверки `graphMode === "pro" && config.mode === "pro"`
- ✅ Осталась только проверка `config.showAssetsLine`

**Причина:** Режимы PRO/LITE убраны, линия активов показывается если `showAssetsLine === true`.

---

#### 5. Assets Forecast Line условие (строки 172-184)
**Было:**
```tsx
{/* 12-month Total Capital Forecast - отключено на мобильных */}
{assetsForecastData.length > 0 && graphMode !== "lite" && (
```

**Стало:**
```tsx
{/* 12-month Total Capital Forecast */}
{assetsForecastData.length > 0 && (
```

**Что изменилось:**
- ✅ Убрана проверка `graphMode !== "lite"`

**Причина:** Режимы PRO/LITE убраны, линия прогноза показывается всегда, если есть данные.

---

## 📁 Файл 3: `client/src/lib/process-chart-data.ts`

### ⚠️ ИЗМЕНЕНИЯ, КОТОРЫЕ МОГЛИ ПОВЛИЯТЬ НА ОТОБРАЖЕНИЕ ЛИНИЙ

#### 1. Защита от пустых данных (строки 62-70)
**Было:**
```tsx
export function processChartData(trendData: TrendDataPoint[], isMobile: boolean = false): ProcessedChartData {
  const todayIndex = trendData.findIndex(d => d.isToday);
  const todayDate = todayIndex !== -1 ? trendData[todayIndex].date : null;

  // На мобильных уменьшаем количество точек для лучшей производительности
  const processedData = isMobile ? sampleDataForMobile(trendData, 30) : trendData;
```

**Стало:**
```tsx
export function processChartData(trendData: TrendDataPoint[], isMobile: boolean = false): ProcessedChartData {
  // Защита от пустых данных
  if (!trendData || trendData.length === 0) {
    return {
      todayDate: null,
      historicalData: [],
      forecastData: [],
      forecastWithConnection: [],
    };
  }

  const todayIndex = trendData.findIndex(d => d.isToday);
  const todayDate = todayIndex !== -1 ? trendData[todayIndex].date : null;

  // На мобильных уменьшаем количество точек для лучшей производительности
  const processedData = isMobile ? sampleDataForMobile(trendData, 30) : trendData;
```

**Что изменилось:**
- ✅ Добавлена проверка на пустые данные в начале функции
- ✅ Возвращается пустой объект, если данных нет

**Причина:** Защита от ошибок при отсутствии данных.

**⚠️ ВОЗМОЖНАЯ ПРИЧИНА ПРОПАЖИ ЛИНИЙ:**
- Если `trendData` пустой или `undefined`, функция вернет пустые массивы
- Это приведет к тому, что `chartData` будет пустым, и линии не будут отображаться
- **НО:** В компоненте есть проверка `if (trendData.length === 0) return <ChartEmptyState />`, так что это не должно быть проблемой

---

## 🔍 АНАЛИЗ ПРИЧИН ПРОПАЖИ ЛИНИЙ

### Основные причины (по приоритету):

#### 1. ⚠️ КРИТИЧЕСКАЯ: Логика `getOpacity` в режиме "lite"
**Причина:**
- В режиме "lite" функция `getOpacity` возвращала `0` для income и expense
- Показывалась только линия capital

**Следствие:**
- Линии income и expense были невидимы (`strokeOpacity={0}`)
- Видна была только линия capital

**Исправление:**
- Убрана проверка режима "lite"
- Все линии видны по умолчанию, если `showIncome/showExpense/showCapital !== false`

---

#### 2. ⚠️ ВАЖНАЯ: Значения `config.showIncome/showExpense/showCapital` из хука
**Причина:**
- Хук `useFinancialTrend` возвращал `config` с возможными значениями `undefined` или `false`
- Если значения были `undefined`, проверка `config.showIncome !== false` возвращала `true`, но если были `false`, возвращала `false`

**Следствие:**
- Если в хуке `config.showIncome === false`, линия income была невидима
- То же самое для expense и capital

**Исправление:**
- Добавлены локальные состояния `showIncome`, `showExpense`, `showCapital` с дефолтным значением `true`
- Эти состояния передаются в `TrendChartLines` вместо значений из хука

---

#### 3. ⚠️ ВОЗМОЖНАЯ: Sampling данных на мобильных
**Причина:**
- На мобильных использовался sampling данных (`processChartData(trendData, true)`)
- Количество точек уменьшалось с ~395 до ~25

**Следствие:**
- Если sampling ломал структуру данных или терял нужные поля (income, expense, capital), линии могли не отображаться
- Recharts требует, чтобы все точки данных имели одинаковую структуру

**Исправление:**
- Sampling отключен: `processChartData(trendData, false)`
- Используются все данные без уменьшения

---

#### 4. ⚠️ ВОЗМОЖНАЯ: Несоответствие данных между `chartData` и `historicalData/forecastData`
**Причина:**
- `chartData` формировался из `trendData` (все данные)
- `historicalData` и `forecastData` формировались из `processedData` (после sampling на мобильных)
- `Line` компоненты используют `dataKey` без указания `data`, значит они берут данные из родительского `LineChart`

**Следствие:**
- Если структура `chartData` не совпадала со структурой данных в `LineChart`, линии могли не отображаться
- Recharts требует, чтобы `dataKey` соответствовал полям в `data` пропе `LineChart`

**Исправление:**
- Теперь `chartData` всегда формируется из `trendData` (без sampling)
- `historicalData` и `forecastData` также формируются без sampling (`isMobile = false`)
- Все данные имеют одинаковую структуру

---

## ✅ ИТОГОВЫЙ СПИСОК ИЗМЕНЕНИЙ ДЛЯ ВЕРСТКИ

### Файл: `client/src/components/charts/financial-trend-chart.tsx`

1. **Строка 154:** Добавлен `overflow-x-auto` для горизонтального скролла
2. **Строка 155:** Добавлен `minWidth={isMobile ? 400 : undefined}` для ResponsiveContainer
3. **Строка 159:** Увеличен правый отступ: `10` → `15`
4. **Строка 160:** Уменьшен нижний отступ: `50` → `40`
5. **Строка 168:** Увеличен размер шрифта: `8` → `9`
6. **Строка 169:** Изменен `interval`: динамический → `'preserveStartEnd'`
7. **Строка 172:** Уменьшена высота XAxis: `70` → `60`
8. **Строка 173:** Убран `dy={isMobile ? 10 : 0}`
9. **Строка 154:** Увеличена высота контейнера: `220px` → `300px` (мобильные), `300px` → `350px` (планшеты)

---

## ⚠️ ИТОГОВЫЙ СПИСОК ИЗМЕНЕНИЙ, ВЛИЯЮЩИХ НА ОТОБРАЖЕНИЕ ЛИНИЙ

### Файл: `client/src/components/charts/trend-chart-lines.tsx`

1. **Строки 50-56:** Упрощена функция `getOpacity` - убраны проверки режима "lite"
2. **Строки 21-27:** Убрано поле `mode` из интерфейса `ChartConfig`
3. **Строки 29-37:** Убран проп `graphMode` из интерфейса `TrendChartLinesProps`
4. **Строки 158-170:** Убраны проверки `graphMode === "pro"` для Assets Line
5. **Строки 172-184:** Убрана проверка `graphMode !== "lite"` для Assets Forecast Line

### Файл: `client/src/components/charts/financial-trend-chart.tsx`

1. **Строка 99:** Отключен sampling: `processChartData(trendData, false)`
2. **Строки 48-51:** Добавлены локальные состояния для видимости линий (все `true` по умолчанию)
3. **Строки 184-198:** `config` формируется из локальных состояний вместо значений из хука
4. **Строки 222-235:** `ChartLegend` всегда отображается, использует локальные состояния

---

## 🎯 ВЫВОДЫ

### Верстка исправлена:
- ✅ График помещается по ширине благодаря `overflow-x-auto` и `minWidth={400}`
- ✅ Контейнеры корректно адаптируются под мобильные устройства

### Линии должны быть видны:
- ✅ Убрана логика скрытия линий в режиме "lite"
- ✅ Все линии включены по умолчанию (`showIncome/showExpense/showCapital = true`)
- ✅ Sampling отключен, используются все данные

### Если линии все еще не видны, проверьте:
1. Есть ли данные в `chartData` (проверьте в консоли)
2. Правильно ли работают переключатели в `ChartLegend`
3. Нет ли ошибок в консоли браузера
4. Правильно ли передаются данные в `LineChart` (проверьте структуру данных)

