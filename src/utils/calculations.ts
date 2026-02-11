import { Transaction, CategorySummary, DailyBalance } from '../types';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  startOfDay,
  eachDayOfInterval,
  format,
  parseISO,
  isWithinInterval,
} from 'date-fns';

export type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

/**
 * Get the date range for a given period. (year, month) is the reference;
 * for week we use the week containing the 15th of that month.
 * When period is current (today in range), end is capped at today.
 */
export function getDateRangeForPeriod(
  year: number,
  month: number,
  period: TimePeriod
): { start: Date; end: Date } {
  const ref = new Date(year, month, 15);
  const now = new Date();
  let start: Date;
  let end: Date;
  switch (period) {
    case 'week': {
      start = startOfWeek(ref, { weekStartsOn: 0 });
      end = endOfWeek(ref, { weekStartsOn: 0 });
      break;
    }
    case 'quarter': {
      start = startOfQuarter(ref);
      end = endOfQuarter(ref);
      break;
    }
    case 'year': {
      start = startOfYear(ref);
      end = endOfYear(ref);
      break;
    }
    default: {
      // month
      start = startOfMonth(ref);
      end = endOfMonth(ref);
      break;
    }
  }
  // Cap end at today when range includes today
  if (end > now && start <= now) {
    end = startOfDay(now);
  }
  return { start, end };
}

/**
 * Filter transactions within a date range (inclusive).
 */
export function filterByDateRange(
  transactions: Transaction[],
  start: Date,
  end: Date
): Transaction[] {
  return transactions.filter((t) => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start, end });
  });
}

/**
 * Filter transactions by month (year, month 0-11).
 * When viewing the current month, only includes transactions up to and including today.
 */
export function filterByMonth(transactions: Transaction[], year: number, month: number): Transaction[] {
  const start = startOfMonth(new Date(year, month, 1));
  const end = endOfMonth(start);
  const filtered = transactions.filter((t) => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start, end });
  });
  const now = new Date();
  if (year === now.getFullYear() && month === now.getMonth()) {
    const todayStr = format(startOfDay(now), 'yyyy-MM-dd');
    return filtered.filter((t) => t.date.slice(0, 10) <= todayStr);
  }
  return filtered;
}

/**
 * Total income for a set of transactions
 */
export function totalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Total expenses for a set of transactions
 */
export function totalExpense(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Net (income - expenses) for a set of transactions
 */
export function netAmount(transactions: Transaction[]): number {
  return totalIncome(transactions) - totalExpense(transactions);
}

/**
 * Spending by category (expenses only)
 */
export function spendingByCategory(transactions: Transaction[]): CategorySummary[] {
  const byCategory: Record<string, { total: number; count: number }> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 };
      byCategory[cat].total += Math.abs(t.amount);
      byCategory[cat].count += 1;
    });
  return Object.entries(byCategory).map(([category, { total, count }]) => ({
    category,
    total,
    count,
  }));
}

/**
 * Daily balance over time (cumulative).
 * When viewing the current month, only returns days from the 1st up to and including today.
 * For past months, returns the full calendar month.
 */
export function dailyBalances(
  transactions: Transaction[],
  year: number,
  month: number
): DailyBalance[] {
  const start = startOfMonth(new Date(year, month, 1));
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const end = isCurrentMonth ? startOfDay(now) : endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  const key = (d: Date) => format(d, 'yyyy-MM-dd');

  const byDay: Record<string, { income: number; expense: number }> = {};
  days.forEach((d) => {
    byDay[key(d)] = { income: 0, expense: 0 };
  });

  const monthTx = filterByMonth(transactions, year, month);
  monthTx.forEach((t) => {
    const k = t.date.slice(0, 10);
    if (!byDay[k]) return;
    if (t.type === 'income') byDay[k].income += t.amount;
    else byDay[k].expense += Math.abs(t.amount);
  });

  let running = 0;
  return days.map((d) => {
    const k = key(d);
    const { income, expense } = byDay[k];
    running += income - expense;
    return {
      date: k,
      balance: running,
      income,
      expense,
    };
  });
}

/**
 * Daily balance for an arbitrary date range (e.g. week, quarter, year).
 */
export function dailyBalancesForRange(
  transactions: Transaction[],
  start: Date,
  end: Date
): DailyBalance[] {
  const days = eachDayOfInterval({ start, end });
  const key = (d: Date) => format(d, 'yyyy-MM-dd');
  const byDay: Record<string, { income: number; expense: number }> = {};
  days.forEach((d) => {
    byDay[key(d)] = { income: 0, expense: 0 };
  });
  const rangeTx = filterByDateRange(transactions, start, end);
  rangeTx.forEach((t) => {
    const k = t.date.slice(0, 10);
    if (!byDay[k]) return;
    if (t.type === 'income') byDay[k].income += t.amount;
    else byDay[k].expense += Math.abs(t.amount);
  });
  let running = 0;
  return days.map((d) => {
    const k = key(d);
    const { income, expense } = byDay[k];
    running += income - expense;
    return {
      date: k,
      balance: running,
      income,
      expense,
    };
  });
}
