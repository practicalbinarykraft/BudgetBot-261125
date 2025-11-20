import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n/context";
import { CHART_COLORS, formatCompactCurrency } from "@/lib/chart-utils";

// Mock data for demo
const chartData = [
  { month: "Jan", income: 4200, expenses: 3100 },
  { month: "Feb", income: 4500, expenses: 3400 },
  { month: "Mar", income: 4100, expenses: 2900 },
  { month: "Apr", income: 4800, expenses: 3600 },
  { month: "May", income: 5200, expenses: 3200 },
  { month: "Jun", income: 4900, expenses: 3500 },
];

function CountUpNumber({ end, duration = 2000, prefix = "", suffix = "" }: { 
  end: number; 
  duration?: number; 
  prefix?: string; 
  suffix?: string; 
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function DashboardPreview() {
  const { t } = useTranslation();
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    // Start animations after component mounts
    const timer = setTimeout(() => setAnimationStarted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const totalIncome = chartData.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
  const balance = totalIncome - totalExpenses;

  return (
    <div className="space-y-4" data-testid="dashboard-preview">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: animationStarted ? 1 : 0, y: animationStarted ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20" data-testid="card-preview-balance">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("preview.balance")}</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-preview-balance">
                    {animationStarted && <CountUpNumber end={balance} prefix="$" />}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: animationStarted ? 1 : 0, y: animationStarted ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20" data-testid="card-preview-income">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("preview.income")}</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-preview-income">
                    {animationStarted && <CountUpNumber end={totalIncome} prefix="$" />}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: animationStarted ? 1 : 0, y: animationStarted ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20" data-testid="card-preview-expenses">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("preview.expenses")}</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-preview-expenses">
                    {animationStarted && <CountUpNumber end={totalExpenses} prefix="$" />}
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-full">
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: animationStarted ? 1 : 0, y: animationStarted ? 0 : 20 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card data-testid="card-preview-chart">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t("preview.chart_title")}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCompactCurrency}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke={CHART_COLORS.income}
                  strokeWidth={2}
                  dot={true}
                  animationDuration={2000}
                  animationBegin={500}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke={CHART_COLORS.expense}
                  strokeWidth={2}
                  dot={true}
                  animationDuration={2000}
                  animationBegin={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
