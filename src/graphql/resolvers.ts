import { generateMockTransactions } from '../utils/mockData';
import {
  filterByMonth,
  filterByDateRange,
  getDateRangeForPeriod,
  totalIncome,
  totalExpense,
  netAmount,
  spendingByCategory,
  dailyBalances,
  dailyBalancesForRange,
} from '../utils/calculations';
import type { Transaction } from '../types';

const transactions: Transaction[] = generateMockTransactions(200);

const PERIOD_MAP = { WEEK: 'week', MONTH: 'month', QUARTER: 'quarter', YEAR: 'year' } as const;

function getFiltered(transactions: Transaction[], year: number, month: number, period?: string) {
  if (!period || period === 'MONTH') {
    return filterByMonth(transactions, year, month);
  }
  const range = getDateRangeForPeriod(year, month, PERIOD_MAP[period as keyof typeof PERIOD_MAP] ?? 'month');
  return filterByDateRange(transactions, range.start, range.end);
}

function nextId(): string {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const resolvers = {
  Query: {
    transactions(_: unknown, { limit }: { limit?: number }) {
      const list = [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return limit ? list.slice(0, limit) : list;
    },
    transactionsByMonth(_: unknown, { year, month, period }: { year: number; month: number; period?: string }) {
      return getFiltered(transactions, year, month, period);
    },
    overviewMetrics(_: unknown, { year, month, period }: { year: number; month: number; period?: string }) {
      const tx = getFiltered(transactions, year, month, period);
      return {
        totalIncome: totalIncome(tx),
        totalExpense: totalExpense(tx),
        netAmount: netAmount(tx),
        transactionCount: tx.length,
      };
    },
    spendingByCategory(_: unknown, { year, month, period }: { year: number; month: number; period?: string }) {
      const tx = getFiltered(transactions, year, month, period);
      return spendingByCategory(tx);
    },
    dailyBalances(_: unknown, { year, month, period }: { year: number; month: number; period?: string }) {
      if (!period || period === 'MONTH') {
        return dailyBalances(transactions, year, month);
      }
      const range = getDateRangeForPeriod(year, month, PERIOD_MAP[period as keyof typeof PERIOD_MAP] ?? 'month');
      return dailyBalancesForRange(transactions, range.start, range.end);
    },
  },
  Mutation: {
    addTransaction(_: unknown, { input }: { input: { description: string; amount: number; type: string; category: string; date: string } }) {
      const now = new Date().toISOString();
      const amount = input.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount);
      const newTx: Transaction = {
        id: nextId(),
        description: input.description.trim(),
        amount,
        type: input.type as 'income' | 'expense',
        category: input.category,
        date: input.date,
        createdAt: now,
        notes: '',
      };
      transactions.push(newTx);
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return newTx;
    },
    updateTransaction(_: unknown, { input }: { input: { id: string; category?: string; notes?: string } }) {
      const tx = transactions.find((t) => t.id === input.id);
      if (!tx) throw new Error('Transaction not found');
      if (input.category != null) tx.category = input.category;
      if (input.notes !== undefined) tx.notes = input.notes;
      return tx;
    },
  },
};
