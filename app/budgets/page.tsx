'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BudgetModal } from '@/components/budgets/BudgetModal';
import { Modal } from '@/components/ui/Modal';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useAuth } from '@/components/providers/AuthProvider';
import { Budget, Category, BudgetWithProgress } from '@/types/database';
import { formatCurrency, getCurrentMonth, formatMonthYear } from '@/lib/utils';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  AlertCircle,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

export default function BudgetsPage() {
  const { user, profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  
  useEffect(() => {
    setSelectedMonth(getCurrentMonth());
  }, []);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spentMap, setSpentMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load categories
  useEffect(() => {
    if (!user) return;
    async function fetchCategories() {
      try {
        const res = await fetch(`/api/categories?userId=${user!.uid}`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }
    fetchCategories();
  }, [user]);

  // Load budgets & calculated spent amounts from MongoDB API
  const fetchBudgetData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?userId=${user.uid}&month=${selectedMonth}`);
      if (!res.ok) throw new Error('Failed to load budgets');

      const data = await res.json();
      setBudgets(data.budgets || []);
      setSpentMap(data.spentMap || {});
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonth]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  // Transform budgets with progress calculations
  const budgetsWithProgress: BudgetWithProgress[] = useMemo(() => {
    return budgets.map((b) => {
      const spent = spentMap[b.category_id] || 0;
      const budgetAmount = Number(b.amount);
      const remaining = budgetAmount - spent;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      const isExceeded = percentage >= 100;
      const isWarning = percentage >= 80 && percentage < 100;

      return {
        ...b,
        spent,
        remaining,
        percentage,
        isExceeded,
        isWarning,
      };
    });
  }, [budgets, spentMap]);

  // Overall calculations
  const totalBudgeted = budgetsWithProgress.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpentInBudgeted = budgetsWithProgress.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpentInBudgeted;
  const overallPercentage = totalBudgeted > 0 ? (totalSpentInBudgeted / totalBudgeted) * 100 : 0;

  // Alerts
  const exceededBudgets = budgetsWithProgress.filter((b) => b.isExceeded);
  const warningBudgets = budgetsWithProgress.filter((b) => b.isWarning);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete || !user) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/budgets?userId=${user.uid}&budgetId=${budgetToDelete.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete budget');
      setDeleteModalOpen(false);
      setBudgetToDelete(null);
      await fetchBudgetData();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout
      title="Monthly Budgets"
      subtitle="Track your spending limits and control category expenditures in MongoDB"
      onRefreshData={fetchBudgetData}
    >
      <div className="space-y-6">
        {/* Month Selector Bar & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center min-w-[140px]">
              <span className="text-sm font-bold text-slate-900 block leading-tight">
                {formatMonthYear(selectedMonth)}
              </span>
              <span className="text-[11px] font-semibold text-indigo-600">
                {selectedMonth}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setBudgetToEdit(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Set New Budget</span>
          </button>
        </div>

        {/* Warning / Exceeded Alert Banners */}
        {exceededBudgets.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Budget Overrun Alert ({exceededBudgets.length})
                </h4>
                <p className="mt-0.5 text-xs text-rose-700">
                  You have exceeded your spending limit in{' '}
                  <span className="font-semibold">
                    {exceededBudgets.map((b) => b.category?.name).join(', ')}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {warningBudgets.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Approaching Budget Limit ({warningBudgets.length})
                </h4>
                <p className="mt-0.5 text-xs text-amber-700">
                  You have spent over 80% of your allocated budget in{' '}
                  <span className="font-semibold">
                    {warningBudgets.map((b) => b.category?.name).join(', ')}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overall Summary Card */}
        {budgets.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Total Budget Utilization
                </h3>
                <p className="text-xs text-slate-500">
                  Overall spending against set category limits
                </p>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                    Total Budget
                  </span>
                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(totalBudgeted, profile?.currency_symbol)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                    Total Spent
                  </span>
                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(totalSpentInBudgeted, profile?.currency_symbol)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                    Remaining
                  </span>
                  <span
                    className={`text-base font-bold ${
                      totalRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(totalRemaining, profile?.currency_symbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    overallPercentage >= 100
                      ? 'bg-rose-500'
                      : overallPercentage >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, overallPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>0%</span>
                <span className="font-semibold text-slate-700">
                  {overallPercentage.toFixed(1)}% of total budget used
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Budgets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-6 h-48"
              />
            ))}
          </div>
        ) : budgetsWithProgress.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
              <PiggyBank className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-900">
              No budgets established for {formatMonthYear(selectedMonth)}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Set monthly spending targets for categories like Food, Bills, or Shopping to prevent overspending.
            </p>
            <button
              onClick={() => {
                setBudgetToEdit(null);
                setModalOpen(true);
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              Establish First Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgetsWithProgress.map((budget) => {
              const cat = budget.category;
              return (
                <div
                  key={budget.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Icon, Name & Actions */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <CategoryIcon
                          iconName={cat?.icon}
                          color={cat?.color}
                          size={18}
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {cat?.name || 'Category'}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Limit: {formatCurrency(budget.amount, profile?.currency_symbol)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setBudgetToEdit(budget);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit budget"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setBudgetToDelete(budget);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete budget"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Percent */}
                    <div className="space-y-2 my-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Spent</span>
                        <span
                          className={`font-bold ${
                            budget.isExceeded
                              ? 'text-rose-600'
                              : budget.isWarning
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {budget.percentage.toFixed(0)}%
                        </span>
                      </div>

                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            budget.isExceeded
                              ? 'bg-rose-500'
                              : budget.isWarning
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, budget.percentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Spent vs Remaining */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Spent</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(budget.spent, profile?.currency_symbol)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 text-[11px] block">
                        {budget.remaining >= 0 ? 'Remaining' : 'Over limit'}
                      </span>
                      <span
                        className={`font-bold ${
                          budget.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(Math.abs(budget.remaining), profile?.currency_symbol)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Set / Edit Budget Modal */}
      <BudgetModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setBudgetToEdit(null);
        }}
        onSuccess={fetchBudgetData}
        budgetToEdit={budgetToEdit}
        categories={categories}
        currentMonth={selectedMonth}
      />

      {/* Delete Budget Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Remove Budget Limit"
        description="Are you sure you want to remove this budget limit?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Removing the budget for <span className="font-bold">{budgetToDelete?.category?.name}</span> will remove its target spending limit for {formatMonthYear(selectedMonth)}.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Remove Budget</span>
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
