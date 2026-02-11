import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { MonthPicker } from './components/MonthPicker';
import { TimePeriodTabs, type Period } from './components/TimePeriodTabs';
import { OverviewCards } from './components/OverviewCards';
import { SpendingChart } from './components/SpendingChart';
import { BalanceChart } from './components/BalanceChart';
import { TransactionsTable } from './components/TransactionsTable';
import { MonthlyComparison } from './components/MonthlyComparison';
import { BudgetVelocityCard } from './components/BudgetVelocityCard';
import { BudgetByCategoryCard } from './components/BudgetByCategoryCard';
import { AddTransactionModal } from './components/AddTransactionModal';
import { GET_SPENDING_BY_CATEGORY } from './graphql/queries';
import type { GetSpendingByCategoryQuery } from './graphql/types';
import { formatCurrency } from './utils/formatters';
import { ArrowLeft, Plus } from 'lucide-react';
import './components/Dashboard.css';

const PERIOD_TO_GQL: Record<Period, string> = {
  week: 'WEEK',
  month: 'MONTH',
  quarter: 'QUARTER',
  year: 'YEAR',
};

interface DashboardProps {
  onBack?: () => void;
}

export default function Dashboard({ onBack }: DashboardProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [period, setPeriod] = useState<Period>('month');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const periodVar = PERIOD_TO_GQL[period];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          {onBack && (
            <button type="button" className="back-btn" onClick={onBack} aria-label="Back to home">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="dashboard-title">Finance Dashboard</h1>
          <button
            type="button"
            className="add-transaction-btn"
            onClick={() => setAddModalOpen(true)}
            aria-label="Add transaction"
          >
            <Plus size={18} />
            Add transaction
          </button>
        </div>
        <div className="dashboard-header-right">
          <TimePeriodTabs period={period} onPeriodChange={setPeriod} />
          <MonthPicker year={year} month={month} period={period} onMonthChange={handleMonthChange} />
        </div>
      </header>

      <AddTransactionModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        year={year}
        month={month}
      />

      <OverviewCards year={year} month={month} period={periodVar} />
      <SpendingInsight year={year} month={month} period={periodVar} />

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <BalanceChart year={year} month={month} period={periodVar} />
          <SpendingChart
            year={year}
            month={month}
            period={periodVar}
            onCategoryClick={(cat) => setCategoryFilter((prev) => (prev === cat ? null : cat))}
            selectedCategory={categoryFilter}
          />
          <TransactionsTable
            year={year}
            month={month}
            period={periodVar}
            categoryFilter={categoryFilter}
            onClearCategoryFilter={() => setCategoryFilter(null)}
          />
        </div>
        <aside className="dashboard-sidebar">
          <MonthlyComparison year={year} month={month} period={periodVar} />
          <BudgetVelocityCard year={year} month={month} period={periodVar} />
          <BudgetByCategoryCard year={year} month={month} period={periodVar} />
        </aside>
      </div>
    </div>
  );
}

/** One-line actionable insight: e.g. "You spent 23% more on Food & Dining this period." */
function SpendingInsight({
  year,
  month,
  period,
}: {
  year: number;
  month: number;
  period: string;
}) {
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const { data: curr } = useQuery<GetSpendingByCategoryQuery>(GET_SPENDING_BY_CATEGORY, { variables: { year, month, period } });
  const { data: prev } = useQuery<GetSpendingByCategoryQuery>(GET_SPENDING_BY_CATEGORY, {
    variables: { year: prevYear, month: prevMonth, period },
  });
  const currCat = curr?.spendingByCategory ?? [];
  const prevCat = prev?.spendingByCategory ?? [];
  const byPrev: Record<string, number> = {};
  prevCat.forEach((c: { category: string; total: number }) => {
    byPrev[c.category] = c.total;
  });
  let best: { category: string; pct: number; diff: number } | null = null;
  currCat.forEach((c: { category: string; total: number }) => {
    const prevTotal = byPrev[c.category] ?? 0;
    if (prevTotal <= 0) return;
    const diff = c.total - prevTotal;
    const pct = Math.round((diff / prevTotal) * 100);
    if (pct > 0 && (!best || pct > best.pct)) best = { category: c.category, pct, diff };
  });
  if (!best) return null;
  const { pct, category: bestCat, diff } = best;
  return (
    <p className="dashboard-insight">
      You spent {pct}% more on {bestCat} this period ({formatCurrency(diff)}).
    </p>
  );
}

