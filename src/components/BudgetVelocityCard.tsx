import React from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_OVERVIEW_METRICS } from '../graphql/queries';
import type { GetOverviewMetricsQuery } from '../graphql/types';
import { formatCurrency } from '../utils/formatters';
import { Target } from 'lucide-react';
import clsx from 'clsx';
import './BudgetVelocityCard.css';

const DEFAULT_BUDGET = 1500;

interface BudgetVelocityCardProps {
  year: number;
  month: number;
  period?: string;
  className?: string;
}

export function BudgetVelocityCard({ year, month, period = 'MONTH', className }: BudgetVelocityCardProps) {
  const { data } = useQuery<GetOverviewMetricsQuery>(GET_OVERVIEW_METRICS, {
    variables: { year, month, period },
  });
  const metrics = data?.overviewMetrics;
  if (!metrics) return null;

  const spent = metrics.totalExpense;
  const budget = DEFAULT_BUDGET;
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth;
  const dailyRate = daysElapsed > 0 ? spent / daysElapsed : 0;
  const projected = Math.round(dailyRate * daysInMonth);

  return (
    <div className={clsx('card', 'budget-velocity-card', className)}>
      <h3 className="section-title">
        <Target size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
        Budget & pace
      </h3>
      <div className="budget-row">
        <span className="budget-label">Spent of budget</span>
        <span className="budget-value">
          {formatCurrency(spent)} of {formatCurrency(budget)}
        </span>
      </div>
      <div className="budget-bar-wrap">
        <div
          className="budget-bar-fill"
          style={{ width: `${Math.min(pct, 100)}%` }}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="budget-pct">{pct}% of budget used</p>
      {period === 'MONTH' && (
        <p className="velocity-line">
          On track to spend <strong>{formatCurrency(projected)}</strong> this month
        </p>
      )}
    </div>
  );
}
