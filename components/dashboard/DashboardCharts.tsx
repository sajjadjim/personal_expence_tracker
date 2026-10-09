'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface IncomeVsExpenseItem {
  period: string;
  income: number;
  expense: number;
}

interface CategoryExpenseItem {
  name: string;
  amount: number;
  color: string;
}

interface DashboardChartsProps {
  comparisonData: IncomeVsExpenseItem[];
  categoryData: CategoryExpenseItem[];
  currencySymbol?: string;
}

const CustomBarTooltip = ({ active, payload, label, currencySymbol = '৳' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-xs">
        <p className="font-semibold text-slate-800 mb-1.5">{label}</p>
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-emerald-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Income: {formatCurrency(payload[0]?.value, currencySymbol)}
          </p>
          <p className="flex items-center gap-2 text-rose-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Expense: {formatCurrency(payload[1]?.value, currencySymbol)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload, currencySymbol = '৳' }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-xs">
        <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: data.payload.color || '#6366f1' }}
          />
          {data.name}
        </p>
        <p className="text-slate-600 font-medium">
          Spent: {formatCurrency(data.value, currencySymbol)}
        </p>
      </div>
    );
  }
  return null;
};

export function DashboardCharts({
  comparisonData,
  categoryData,
  currencySymbol = '৳',
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly Cashflow Bar Chart (2 cols) */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Cashflow Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Income vs expenses across recent periods
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600">Expenses</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {comparisonData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No cashflow data recorded yet for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={(props: any) => <CustomBarTooltip {...props} currencySymbol={currencySymbol} />} />
                <Bar
                  dataKey="income"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="expense"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Expense by Category Donut Chart (1 col) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Spending by Category
          </h3>
          <p className="text-xs text-slate-500">
            Top expenditure categories
          </p>
        </div>

        <div className="h-56 w-full my-3 flex items-center justify-center">
          {categoryData.length === 0 ? (
            <div className="text-center text-xs text-slate-400">
              No expenses recorded for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={(props: any) => <CustomPieTooltip {...props} currencySymbol={currencySymbol} />} />
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || '#6366f1'}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Legend list */}
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {categoryData.slice(0, 5).map((cat, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color || '#6366f1' }}
                />
                <span className="truncate text-slate-600 font-medium">{cat.name}</span>
              </div>
              <span className="font-semibold text-slate-900 shrink-0">
                {formatCurrency(cat.amount, currencySymbol)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
