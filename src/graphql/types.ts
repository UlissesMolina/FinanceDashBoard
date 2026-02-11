import type { Transaction, CategorySummary, DailyBalance } from '../types';

export interface OverviewMetrics {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
}

export interface GetOverviewMetricsQuery {
  overviewMetrics: OverviewMetrics;
}

export interface GetDailyBalancesQuery {
  dailyBalances: DailyBalance[];
}

export interface GetSpendingByCategoryQuery {
  spendingByCategory: CategorySummary[];
}

export interface GetTransactionsByMonthQuery {
  transactionsByMonth: Transaction[];
}

export interface AddTransactionInput {
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
}

export interface AddTransactionMutation {
  addTransaction: Transaction;
}

export interface UpdateTransactionInput {
  id: string;
  category?: string;
  notes?: string;
}

export interface UpdateTransactionMutation {
  updateTransaction: Transaction;
}
