'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Transaction } from '@/types/database';
import { formatCurrency, downloadCSV } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Download,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  FileSpreadsheet,
} from 'lucide-react';

type ReportPeriod = 'this_year' | 'last_year' | 'last_12_months' | 'this_month';

export default function ReportsPage() {
  const { user, profile, isConfigured } = useAuth();
  const [period, setPeriod] = useState<ReportPeriod>('this_year');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [_loading, setLoading] = useState(true);

  const getDateRange = (selectedPeriod: ReportPeriod) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (selectedPeriod === 'this_year') {
      return {
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`,
        label: `Year ${currentYear}`,
      };
    }
    if (selectedPeriod === 'last_year') {
      return {
        start: `${currentYear - 1}-01-01`,
        end: `${currentYear - 1}-12-31`,
        label: `Year ${currentYear - 1}`,
      };
    }
    if (selectedPeriod === 'this_month') {
      const start = new Date(currentYear, now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(currentYear, now.getMonth() + 1, 0).toISOString().split('T')[0];
      return { start, end, label: 'This Month' };
    }
    // last_12_months
    const past = new Date();
    past.setFullYear(past.getFullYear() - 1);
    return {
      start: past.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
      label: 'Last 12 Months',
    };
  };

  const fetchReportData = useCallback(async () => {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { start, end } = getDateRange(period);

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      if (error) throw error;
      setTransactions((data as unknown as Transaction[]) || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isConfigured, period]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Aggregate Metrics
  const { totalIncome, totalExpense, netSavings, savingsRate } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === 'income') income += amt;
      else expense += amt;
    });
    const net = income - expense;
    const rate = income > 0 ? (net / income) * 100 : 0;
    return {
      totalIncome: income,
      totalExpense: expense,
      netSavings: net,
      savingsRate: Math.max(0, rate),
    };
  }, [transactions]);

  // Monthly trend series
  const monthlyTrends = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; savings: number }>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      const current = map.get(key) || { income: 0, expense: 0, savings: 0 };
      const amt = Number(tx.amount);

      if (tx.type === 'income') {
        current.income += amt;
      } else {
        current.expense += amt;
      }
      current.savings = current.income - current.expense;
      map.set(key, current);
    });

    return Array.from(map.entries()).map(([month, val]) => ({
      month,
      income: val.income,
      expense: val.expense,
      savings: val.savings,
    }));
  }, [transactions]);

  // Category Expense Breakdown
  const categoryExpenses = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; count: number; color: string; icon: string }>();

    transactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        const catId = tx.category_id || 'uncategorized';
        const name = tx.category?.name || 'Uncategorized';
        const color = tx.category?.color || '#6366f1';
        const icon = tx.category?.icon || 'Tag';
        const amt = Number(tx.amount);

        const current = map.get(catId) || { name, amount: 0, count: 0, color, icon };
        current.amount += amt;
        current.count += 1;
        map.set(catId, current);
      });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Category Income Breakdown
  const categoryIncome = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; count: number; color: string; icon: string }>();

    transactions
      .filter((tx) => tx.type === 'income')
      .forEach((tx) => {
        const catId = tx.category_id || 'uncategorized';
        const name = tx.category?.name || 'Uncategorized';
        const color = tx.category?.color || '#10b981';
        const icon = tx.category?.icon || 'Briefcase';
        const amt = Number(tx.amount);

        const current = map.get(catId) || { name, amount: 0, count: 0, color, icon };
        current.amount += amt;
        current.count += 1;
        map.set(catId, current);
      });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Export report summary to CSV
  const handleExportSummaryCSV = () => {
    const headers = ['Category', 'Type', 'Total Amount', 'Transaction Count', 'Share (%)'];
    const rows: (string | number)[][] = [];

    categoryExpenses.forEach((c) => {
      const share = totalExpense > 0 ? ((c.amount / totalExpense) * 100).toFixed(1) : '0';
      rows.push([c.name, 'Expense', c.amount, c.count, `${share}%`]);
    });

    categoryIncome.forEach((c) => {
      const share = totalIncome > 0 ? ((c.amount / totalIncome) * 100).toFixed(1) : '0';
      rows.push([c.name, 'Income', c.amount, c.count, `${share}%`]);
    });

    downloadCSV(`financial-report-summary-${period}.csv`, headers, rows);
  };

  const handleExportTransactionsCSV = () => {
    const headers = ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'];
    const rows = transactions.map((tx) => [
      tx.date,
      tx.title,
      tx.type,
      tx.category?.name || 'Uncategorized',
      tx.amount,
      tx.payment_method,
      tx.notes || '',
    ]);
    downloadCSV(`transactions-${period}.csv`, headers, rows);
  };

  const currencySymbol = profile?.currency_symbol || '৳';

  return (
    <DashboardLayout
      title="Financial Analytics & Reports"
      subtitle="Detailed income, spending breakdown, savings trends, and CSV data export"
      onRefreshData={fetchReportData}
    >
      <div className="space-y-6">
        {/* Period Selector & Export Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'this_year', label: 'This Year' },
              { id: 'last_year', label: 'Last Year' },
              { id: 'last_12_months', label: 'Last 12 Months' },
              { id: 'this_month', label: 'This Month' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as ReportPeriod)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  period === p.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSummaryCSV}
              disabled={transactions.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-slate-500" />
              <span>Export Summary CSV</span>
            </button>

            <button
              onClick={handleExportTransactionsCSV}
              disabled={transactions.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Export Ledger CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Total Inflow</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">
              {formatCurrency(totalIncome, currencySymbol)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Total Outflow</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">
              {formatCurrency(totalExpense, currencySymbol)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Net Accumulated</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <PiggyBank className="h-4 w-4" />
              </div>
            </div>
            <div className={`mt-3 text-2xl font-bold ${netSavings >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {formatCurrency(netSavings, currencySymbol)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Savings Rate</span>
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                <Percent className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">
              {savingsRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Savings Trend Area Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">
              Savings & Cashflow Trends
            </h3>
            <p className="text-xs text-slate-500">
              Trajectory of income, expenses, and net monthly surplus
            </p>
          </div>

          <div className="h-72 w-full">
            {monthlyTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No financial history recorded for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(val, currencySymbol), '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                    name="Expense"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Tables: Expenses & Income */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Expense Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Where your money was allocated
            </p>

            {categoryExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No expenses in this period.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {categoryExpenses.map((cat, idx) => {
                  const share = totalExpense > 0 ? ((cat.amount / totalExpense) * 100) : 0;
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <CategoryIcon iconName={cat.icon} color={cat.color} size={16} />
                        <div>
                          <p className="font-semibold text-slate-800">{cat.name}</p>
                          <p className="text-[11px] text-slate-400">{cat.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {formatCurrency(cat.amount, currencySymbol)}
                        </p>
                        <p className="text-[11px] text-slate-400">{share.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Income Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Income Sources
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Breakdown of your earnings streams
            </p>

            {categoryIncome.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No income in this period.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {categoryIncome.map((cat, idx) => {
                  const share = totalIncome > 0 ? ((cat.amount / totalIncome) * 100) : 0;
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <CategoryIcon iconName={cat.icon} color={cat.color} size={16} />
                        <div>
                          <p className="font-semibold text-slate-800">{cat.name}</p>
                          <p className="text-[11px] text-slate-400">{cat.count} records</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">
                          +{formatCurrency(cat.amount, currencySymbol)}
                        </p>
                        <p className="text-[11px] text-slate-400">{share.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
