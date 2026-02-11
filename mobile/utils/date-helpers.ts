import type { Transaction } from "../types";

export type DateFilterValue = "week" | "month" | "year" | "all";

export interface StatsResponse {
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  balance?: number;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateRange(
  filter: DateFilterValue
): { from: string; to: string } | null {
  const now = new Date();
  const today = formatLocalDate(now);

  if (filter === "all") return null;

  if (filter === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { from: formatLocalDate(start), to: today };
  }

  if (filter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: formatLocalDate(start), to: today };
  }

  if (filter === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { from: formatLocalDate(start), to: today };
  }

  return null;
}

function isTodayDate(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isYesterdayDate(date: Date): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return (
    date.getDate() === y.getDate() &&
    date.getMonth() === y.getMonth() &&
    date.getFullYear() === y.getFullYear()
  );
}

export function getDateHeader(
  dateStr: string,
  locale: string = "en-US",
  labels?: { today: string; yesterday: string },
): string {
  const date = new Date(dateStr + "T00:00:00");
  if (isTodayDate(date)) return labels?.today ?? "Today";
  if (isYesterdayDate(date)) return labels?.yesterday ?? "Yesterday";
  return date.toLocaleDateString(locale, { day: "numeric", month: "long" });
}

export function groupTransactionsByDate(
  transactions: Transaction[]
): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  transactions.forEach((t) => {
    const dateKey = t.date.split("T")[0];
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(t);
  });
  return groups;
}
