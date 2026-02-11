export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  createdAt: string;
  notes?: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

export interface DailyBalance {
  date: string;
  balance: number;
  income: number;
  expense: number;
}

/* Home page theme: emerald, teal, cyan, purple */
export const CATEGORY_COLORS: Record<string, string> = {
  'Income': '#10b981',
  'Food & Dining': '#059669',
  'Transportation': '#06b6d4',
  'Shopping': '#8b5cf6',
  'Entertainment': '#7c3aed',
  'Bills & Utilities': '#0d9488',
  'Healthcare': '#14b8a6',
  'Other': '#64748b',
};

export const CATEGORIES = Object.keys(CATEGORY_COLORS);
