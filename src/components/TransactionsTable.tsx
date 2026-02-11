import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_TRANSACTIONS_BY_MONTH, UPDATE_TRANSACTION } from '../graphql/queries';
import type { GetTransactionsByMonthQuery } from '../graphql/types';
import { formatCurrency, formatDateShort } from '../utils/formatters';
import { CATEGORY_COLORS, CATEGORIES } from '../types';
import { TransactionDetailModal, type TransactionDetail } from './TransactionDetailModal';
import { Search, X, ChevronDown, ChevronRight, FileDown, FileText } from 'lucide-react';
import clsx from 'clsx';
import './TransactionsTable.css';

const PAGE_SIZE = 20;
const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c !== 'Income');

export type TransactionTypeFilter = 'all' | 'income' | 'expense';

interface TransactionsTableProps {
  year: number;
  month: number;
  period?: string;
  categoryFilter?: string | null;
  onClearCategoryFilter?: () => void;
  className?: string;
}

function downloadCSV(rows: TransactionDetail[]) {
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
  const lines = [headers.join(',')];
  rows.forEach((t) => {
    lines.push(
      [
        t.date,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${t.category}"`,
        t.type,
        t.amount,
      ].join(',')
    );
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(rows: TransactionDetail[]) {
  const rowsHtml = rows
    .map(
      (t) =>
        `<tr><td>${t.date}</td><td>${(t.description || '').replace(/</g, '&lt;')}</td><td>${t.category}</td><td>${t.type}</td><td>${formatCurrency(t.amount, { sign: true })}</td></tr>`
    )
    .join('');
  const html = `<!DOCTYPE html><html><head><title>Transactions</title><style>body{font-family:system-ui,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body><h1>Transactions</h1><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 250);
}

export function TransactionsTable({
  year,
  month,
  period = 'MONTH',
  categoryFilter,
  onClearCategoryFilter,
  className,
}: TransactionsTableProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailTx, setDetailTx] = useState<TransactionDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const { data, loading, error } = useQuery<GetTransactionsByMonthQuery>(GET_TRANSACTIONS_BY_MONTH, {
    variables: { year, month, period },
  });
  const [updateTransaction] = useMutation(UPDATE_TRANSACTION, {
    refetchQueries: [{ query: GET_TRANSACTIONS_BY_MONTH, variables: { year, month, period } }],
  });

  const handleCategoryChange = useCallback(
    (id: string, category: string) => {
      updateTransaction({ variables: { input: { id, category } } });
    },
    [updateTransaction]
  );

  const handleNotesBlur = useCallback(
    (id: string, notes: string) => {
      updateTransaction({ variables: { input: { id, notes } } });
    },
    [updateTransaction]
  );

  if (loading) return <div className={clsx('card', 'transactions-card', className)}>Loading...</div>;
  if (error) return <div className={clsx('card', 'transactions-card', className)}>Error loading transactions.</div>;

  const transactions = data?.transactionsByMonth ?? [];
  let filtered = transactions;
  if (typeFilter !== 'all') {
    filtered = filtered.filter((t: { type: string }) => t.type === typeFilter);
  }
  if (search.trim()) {
    filtered = filtered.filter(
      (t: { description: string; category: string }) =>
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (categoryFilter) {
    filtered = filtered.filter((t: { category: string }) => t.category === categoryFilter);
  }
  const totalCount = filtered.length;
  const displayList = filtered.slice(0, visibleCount) as TransactionDetail[];
  const hasMore = visibleCount < totalCount;

  const toggleExpand = (t: TransactionDetail) => {
    setExpandedId((id) => (id === t.id ? null : t.id));
    setNotesDraft((prev) => ({ ...prev, [t.id]: t.notes ?? '' }));
  };

  const openDetail = (t: TransactionDetail) => {
    setDetailTx(t);
    setDetailOpen(true);
  };

  const handleExportCSV = () => downloadCSV(filtered as TransactionDetail[]);
  const handleExportPDF = () => downloadPDF(filtered as TransactionDetail[]);

  return (
    <div className={clsx('card', 'transactions-card', className)}>
      <div className="transactions-type-filters">
        <button
          type="button"
          className={clsx('transactions-type-btn', typeFilter === 'all' && 'transactions-type-btn--active')}
          onClick={() => setTypeFilter('all')}
          aria-pressed={typeFilter === 'all'}
        >
          All
        </button>
        <button
          type="button"
          className={clsx('transactions-type-btn', typeFilter === 'income' && 'transactions-type-btn--active')}
          onClick={() => setTypeFilter('income')}
          aria-pressed={typeFilter === 'income'}
        >
          Income
        </button>
        <button
          type="button"
          className={clsx('transactions-type-btn', typeFilter === 'expense' && 'transactions-type-btn--active')}
          onClick={() => setTypeFilter('expense')}
          aria-pressed={typeFilter === 'expense'}
        >
          Expenses
        </button>
      </div>
      <div className="transactions-header">
        <h3 className="section-title">Recent Transactions</h3>
        <div className="transactions-header-actions">
          <div className="transactions-export">
            <button type="button" className="transactions-export-btn" onClick={handleExportCSV} title="Download CSV">
              <FileDown size={16} />
              CSV
            </button>
            <button type="button" className="transactions-export-btn" onClick={handleExportPDF} title="Download PDF">
              <FileText size={16} />
              PDF
            </button>
          </div>
          {categoryFilter && onClearCategoryFilter && (
            <button
              type="button"
              className="transactions-filter-tag"
              onClick={onClearCategoryFilter}
              aria-label={`Clear filter: ${categoryFilter}`}
            >
              {categoryFilter} <X size={14} />
            </button>
          )}
          <div className="transactions-search">
            <Search size={16} className="search-icon" aria-hidden />
            <input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              aria-label="Search transactions"
            />
          </div>
        </div>
      </div>
      <div className="transactions-table-wrap">
        <table className="transactions-table">
          <thead>
            <tr>
              <th className="th-expand" aria-label="Expand" />
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th className="amount-col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={5} className="transactions-empty">
                  {categoryFilter
                    ? `No transactions in ${categoryFilter}.`
                    : typeFilter !== 'all'
                    ? `No ${typeFilter} transactions this period.`
                    : search.trim()
                    ? 'No transactions match your search.'
                    : 'No transactions this period.'}
                </td>
              </tr>
            ) : (
              displayList.map((t) => {
                const expanded = expandedId === t.id;
                const categoriesForType = t.type === 'income' ? ['Income'] : EXPENSE_CATEGORIES;
                return (
                  <React.Fragment key={t.id}>
                    <tr
                      className={clsx('transactions-row-clickable', expanded && 'transactions-row-expanded')}
                      onClick={() => toggleExpand(t)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleExpand(t)}
                      aria-expanded={expanded}
                      aria-label={`${expanded ? 'Collapse' : 'Expand'} ${t.description}`}
                    >
                      <td className="td-expand">
                        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </td>
                      <td className="date-cell">{formatDateShort(t.date)}</td>
                      <td className="desc-cell">{t.description}</td>
                      <td>
                        <span
                          className="category-badge"
                          style={{
                            backgroundColor: (CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS['Other']) + '22',
                            color: CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS['Other'],
                          }}
                        >
                          {t.category}
                        </span>
                      </td>
                      <td className={clsx('amount-cell', t.type === 'income' ? 'amount-income' : 'amount-expense')}>
                        {formatCurrency(t.amount, { sign: true })}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="transactions-expanded-row">
                        <td colSpan={5} className="transactions-expanded-cell" onClick={(e) => e.stopPropagation()}>
                          <div className="transactions-expanded-content">
                            <div className="transactions-expanded-section">
                              <label className="transactions-expanded-label">Notes</label>
                              <textarea
                                className="transactions-expanded-notes"
                                value={notesDraft[t.id] ?? t.notes ?? ''}
                                onChange={(e) => setNotesDraft((prev) => ({ ...prev, [t.id]: e.target.value }))}
                                onBlur={(e) => handleNotesBlur(t.id, e.target.value)}
                                placeholder="Add notes..."
                                rows={2}
                              />
                            </div>
                            <div className="transactions-expanded-section">
                              <span className="transactions-expanded-label">Attachments</span>
                              <span className="transactions-expanded-placeholder">No attachments</span>
                            </div>
                            <div className="transactions-expanded-section">
                              <label className="transactions-expanded-label">Category</label>
                              <select
                                className="transactions-expanded-select"
                                value={t.category}
                                onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {categoriesForType.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              type="button"
                              className="transactions-expanded-details-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(t);
                              }}
                            >
                              View full details
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="transactions-load-more">
          <button
            type="button"
            className="transactions-load-more-btn"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            Load more ({totalCount - visibleCount} remaining)
          </button>
        </div>
      )}
      <TransactionDetailModal
        transaction={detailTx}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
