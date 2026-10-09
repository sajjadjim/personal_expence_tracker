'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface StatCardsProps {
  totalIncome: number;
  totalExpense: number;
  currencySymbol?: string;
}

export function StatCards({
  totalIncome,
  totalExpense,
  currencySymbol = '৳',
}: StatCardsProps) {
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const stats = [
    {
      title: 'Current Balance',
      value: formatCurrency(balance, currencySymbol),
      icon: Wallet,
      color: balance >= 0 ? 'text-indigo-600' : 'text-rose-600',
      bgColor: balance >= 0 ? 'bg-indigo-50' : 'bg-rose-50',
      description: balance >= 0 ? 'Net positive savings' : 'Expenses exceed income',
    },
    {
      title: 'Total Income',
      value: formatCurrency(totalIncome, currencySymbol),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Incoming earnings',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpense, currencySymbol),
      icon: TrendingDown,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      description: 'Total money spent',
    },
    {
      title: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      description: `${formatCurrency(Math.max(0, balance), currencySymbol)} saved`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {stat.title}
              </span>
              <div className={`rounded-xl p-2.5 ${stat.bgColor} ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-slate-400 font-medium">
                {stat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
