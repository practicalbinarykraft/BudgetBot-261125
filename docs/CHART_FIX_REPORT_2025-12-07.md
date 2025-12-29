# Отчёт по исправлению графика "Мой капитал"

**Дата:** 7-8 декабря 2025
**Разработчик:** Claude Code (AI Assistant)
**Задача:** График "Мой капитал" не отображает линии, несмотря на наличие данных в кошельках ($29,210) и активах ($21,811)

---

## Исходная проблема

На дашборде график "Мой капитал" показывал:
- Корректную ось Y с значениями ($57.6k, $34.8k, etc.)
- Корректную ось X с датами
- Баннер прогноза "$51,021 (+8.3%)"
- **НО**: Никаких линий на графике

---

## Этап 1: Анализ архитектуры Recharts

### Обнаруженная проблема #1: Отдельные `data` props на Line компонентах

**Файл:** `client/src/components/charts/trend-chart-lines.tsx`

**Проблема:** В Recharts 2.x, когда Line компоненты имеют свой собственный `data` prop, они используют эти данные независимо от родительского LineChart. Это приводило к рассинхронизации осей с данными линий.

**Было:**
```tsx
<Line
  data={historicalData}  // <-- Отдельные данные для каждой линии
  dataKey="capital"
  stroke={CHART_COLORS.capital}
  ...
/>
```

**Исправлено:**
```tsx
<Line
  type="monotone"
  dataKey="capital"
  stroke={CHART_COLORS.capital}
  // Теперь использует data из родительского LineChart
  ...
/>
```

**Результат:** Линии должны были использовать данные из родительского `<LineChart data={chartData}>`, но проблема не решилась полностью.

---

## Этап 2: Проблема с растянутой осью X

### Обнаруженная проблема #2: X-ось показывала даты до декабря 2026

**Файл:** `client/src/components/charts/financial-trend-chart.tsx`

**Проблема:** `assetsForecastData` содержал точку на 365 дней вперёд, что растягивало ось X до декабря 2026, делая историческую линию визуально плоской.

**Было:**
```tsx
const chartData = trendData;  // Включая forecast данные

const assetsForecastData = assetsForecast && chartData.length > 0
  ? [
      chartData[chartData.length - 1],
      {
        date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        totalCapital: assetsForecast.projected,
        isForecast: true,
      },
    ]
  : [];
```

**Исправлено:**
```tsx
const { historicalData, forecastData } = processChartData(trendData);
// Используем ТОЛЬКО исторические данные для графика
const chartData = historicalData.length > 0 ? historicalData : trendData;

// Явный domain для X-оси
<XAxis
  dataKey="date"
  domain={chartData.length > 0 ? [chartData[0].date, chartData[chartData.length - 1].date] : ['auto', 'auto']}
  allowDataOverflow={true}
/>

// Отключили 12-месячную линию прогноза
<TrendChartLines
  config={config}
  graphMode={graphMode}
  assetsForecastData={[]}  // <-- Пустой массив
/>
```

---

## Этап 3: Проблемы с деплоем на VPS

### Проблема #3: PM2 не загружал environment variables

**Сервер:** 5.129.230.171:5000

**Ошибка:**
```
❌ ENCRYPTION_KEY: Required
❌ DATABASE_URL: Required
❌ SESSION_SECRET: Required
```

**Причина:** PM2 не читает .env файл автоматически, а package.json имеет `"type": "module"`, что ломает CommonJS синтаксис в ecosystem.config.js.

**Решение:** Создан `ecosystem.config.cjs` (с расширением .cjs для CommonJS):

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'budgetbot',
    script: 'dist/index.js',
    cwd: '/var/www/budgetbot',
    env: {
      DATABASE_URL: 'postgresql://...',
      SESSION_SECRET: '...',
      ENCRYPTION_KEY: '...',
      TELEGRAM_BOT_TOKEN: '...',
      PORT: 5000,
      NODE_ENV: 'production'
    }
  }]
};
```

**Команда запуска:**
```bash
pm2 delete all
pm2 start ecosystem.config.cjs
```

### Проблема #4: Отсутствующие npm пакеты на сервере

При использовании `esbuild --packages=external`, runtime dependencies должны быть установлены на сервере.

**Отсутствовали:**
- `otplib` - для 2FA
- `qrcode` - для генерации QR кодов
- `helmet` - security headers
- `compression` - gzip compression
- `express-rate-limit` - rate limiting
- `hpp` - HTTP parameter pollution protection

**Решение:**
```bash
npm install otplib qrcode helmet compression express-rate-limit hpp
```

### Проблема #5: Browser кэширование (Service Worker)

**Симптом:** После деплоя браузер показывал старый bundle (index-C2LPgmFD.js вместо нового).

**Причина:** Service Worker кэшировал старые файлы даже при включенном "Disable cache" в DevTools.

**Решение:**
1. DevTools → Application → Service Workers → Unregister
2. Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Win)

---

## Этап 4: Главная причина - Recharts и child компоненты

### Обнаруженная проблема #6: Recharts не рендерит Line из child компонентов

**Открытие:** После всех предыдущих исправлений график всё ещё не показывал линии.

**Диагностика:**
```bash
# Проверка API данных
DATABASE_URL="..." npx tsx -e "
import { calculateTrend } from './server/services/trend-calculator.service';
const result = await calculateTrend({ userId: 10, historyDays: 30, forecastDays: 30 });
console.log('Historical:', result.trendData.filter(d => !d.isForecast).length);
console.log('First:', JSON.stringify(result.trendData[0]));
"
```

**Результат:**
```
Total points: 61
Historical (isForecast=false): 31
Forecast (isForecast=true): 30
First historical: {"date":"2025-11-06","capital":52186.27...,"isForecast":false}
```

**Данные были корректны!** Проблема была в рендеринге.

**Корневая причина:** Recharts не распознаёт Line компоненты, возвращённые из child компонента через React Fragment. Компонент `TrendChartLines` возвращал `<>...</>` с Line внутри, но Recharts ожидает прямых детей LineChart.

**Было:**
```tsx
// TrendChartLines.tsx
export function TrendChartLines({ config, graphMode }) {
  return (
    <>
      <ReferenceLine ... />
      <Line dataKey="capital" ... />
      <Line dataKey="income" ... />
    </>
  );
}

// financial-trend-chart.tsx
<LineChart data={chartData}>
  <TrendChartLines config={config} graphMode={graphMode} />
</LineChart>
```

**Исправлено (inline Line компоненты):**
```tsx
// financial-trend-chart.tsx
import { Line, ReferenceLine } from "recharts";

<LineChart data={chartData}>
  <ReferenceLine x={new Date().toISOString().split("T")[0]} ... />
  <ReferenceLine y={0} ... />

  {/* Capital Line - всегда видна */}
  <Line
    type="monotone"
    dataKey="capital"
    stroke={CHART_COLORS.capital}
    strokeWidth={2}
    dot={false}
    connectNulls
  />

  {/* Income/Expense - только в PRO режиме */}
  {graphMode === "pro" && config.showIncome && (
    <Line dataKey="income" ... />
  )}
  {graphMode === "pro" && config.showExpense && (
    <Line dataKey="expense" ... />
  )}
</LineChart>
```

---

## Изменённые файлы

| Файл | Изменения |
|------|-----------|
| `client/src/components/charts/financial-trend-chart.tsx` | Inline Line компоненты вместо TrendChartLines |
| `client/src/components/charts/trend-chart-lines.tsx` | Удалены отдельные `data` props (файл больше не используется) |
| `ecosystem.config.cjs` | Новый файл для PM2 с env переменными |

---

## Хронология работ

| Время | Действие |
|-------|----------|
| 18:00 | Начало диагностики - график без линий |
| 18:15 | Найдена проблема с `data` props на Line компонентах |
| 18:30 | Исправлен TrendChartLines - убраны отдельные data |
| 18:45 | Обнаружена проблема с X-осью до 2026 года |
| 19:00 | Исправлено: chartData = historicalData |
| 19:15 | Деплой на VPS - PM2 не стартует (missing env vars) |
| 19:30 | Создан ecosystem.config.cjs |
| 19:45 | Установлены недостающие npm пакеты |
| 20:00 | Сервер работает, но график всё ещё пустой |
| 20:15 | Глубокая диагностика API - данные корректны |
| 20:30 | **Найдена главная причина**: Recharts + child компоненты |
| 20:45 | Inline Line компоненты в LineChart |
| 21:00 | Финальный деплой и тестирование |

---

## Уроки и рекомендации

### Для будущей разработки:

1. **Recharts child компоненты**: НЕ выносить Line/Bar/Area в отдельные компоненты. Recharts требует их как прямых детей Chart.

2. **Отдельные `data` props**: В Recharts 2.x избегать отдельных `data` props на сериях данных - использовать данные из родительского Chart.

3. **PM2 + ES Modules**: При `"type": "module"` в package.json, ecosystem config должен быть `.cjs`.

4. **Service Worker кэширование**: При деплоях учитывать, что SW кэширует даже при "Disable cache" в DevTools.

5. **X-axis domain**: При смешивании исторических + forecast данных, явно устанавливать domain оси X.

---

## Текущий статус

✅ График "Мой капитал" отображает линию капитала
✅ Сервер работает на http://5.129.230.171:5000
✅ PM2 корректно загружает environment variables
✅ Новый bundle: `index-BCpVtwFE.js`

---

*Отчёт сгенерирован Claude Code*
