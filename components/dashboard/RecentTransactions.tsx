'use client';

import React from 'react';
import Link from 'next/link';
import { Transaction } from '@/types/database';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, ArrowRight, ReceiptText } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  currencySymbol?: string;
  dateFormat?: string;
  onOpenAddExpense?: () => void;
  onOpenAddIncome?: () => void;
}

export function RecentTransactions({
  transactions,
  currencySymbol = '৳',
  dateFormat = 'DD/MM/YYYY',
  onOpenAddExpense,
  onOpenAddIncome,
}: RecentTransactionsProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Recent Transactions
          </h3>
          <p className="text-xs text-slate-500">
            Your latest earnings and expenses
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAddIncome && (
            <button
              onClick={onOpenAddIncome}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              + Add Income
            </button>
          )}
          {onOpenAddExpense && (
            <button
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              + Add Expense
            </button>
          )}
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <ReceiptText className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">No transactions recorded yet</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
            Start tracking your money by adding your first expense or income transaction.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onOpenAddExpense}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              Record First Transaction
            </button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {transactions.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3.5 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon
                    iconName={tx.category?.icon || (isIncome ? 'TrendingUp' : 'Receipt')}
                    color={tx.category?.color || (isIncome ? '#10b981' : '#f43f5e')}
                    size={18}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {tx.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{tx.category?.name || (isIncome ? 'Income' : 'Expense')}</span>
                      <span>•</span>
                      <span>{tx.payment_method}</span>
                      <span>•</span>
                      <span>{formatDate(tx.date, dateFormat)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-3">
                  <span
                    className={`text-sm font-bold tracking-tight ${
                      isIncome ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currencySymbol)}
                  </span>
                  {isIncome ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
