'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/components/providers/AuthProvider';
import { Category, Budget } from '@/types/database';
import { Loader2 } from 'lucide-react';
import { getCurrentMonth } from '@/lib/utils';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetToEdit?: Budget | null;
  categories: Category[];
  currentMonth: string;
}

export function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  budgetToEdit,
  categories,
  currentMonth,
}: BudgetModalProps) {
  const { user, profile } = useAuth();
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(currentMonth || '2026-10');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.category_id);
      setAmount(String(budgetToEdit.amount));
      setMonth(budgetToEdit.month);
    } else {
      const defaultCatId = categories.find((c) => c.type === 'expense')?.id || '';
      setCategoryId(defaultCatId);
      setAmount('');
      setMonth(currentMonth || getCurrentMonth());
    }
    setErrorMessage(null);
  }, [budgetToEdit, currentMonth, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setErrorMessage('Please select a category for this budget.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid positive budget amount.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        userId: user.uid,
        categoryId,
        month,
        amount: numAmount,
      };

      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save budget limit');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to set budget';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Edit Category Budget' : 'Set Monthly Budget'}
      description="Define spending limits for specific expense categories."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMessage}
          </div>
        )}

        {/* Month selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Target Month *
          </label>
          <input
            type="month"
            required
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Category selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Expense Category *
          </label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
          >
            <option value="">Select category</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Amount Limit */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Budget Spending Limit ({profile?.currency_symbol || '৳'}) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2 text-sm font-semibold text-slate-400">
              {profile?.currency_symbol || '৳'}
            </span>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{budgetToEdit ? 'Save Budget' : 'Set Budget Limit'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
