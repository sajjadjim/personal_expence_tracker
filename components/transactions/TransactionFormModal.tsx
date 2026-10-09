'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Category, Transaction, PAYMENT_METHODS, TransactionType } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactionToEdit?: Transaction | null;
  defaultType?: TransactionType;
}

export function TransactionFormModal({
  isOpen,
  onClose,
  onSuccess,
  transactionToEdit,
  defaultType = 'expense',
}: TransactionFormModalProps) {
  const { user, profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [type, setType] = useState<TransactionType>(defaultType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  // Load user categories
  useEffect(() => {
    if (!user || !isOpen) return;

    async function loadCategories() {
      setLoadingCategories(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');

      if (!error && data) {
        setCategories(data);
      }
      setLoadingCategories(false);
    }

    loadCategories();
  }, [user, isOpen]);

  // Reset form values when editing or opening
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setTitle(transactionToEdit.title);
      setAmount(String(transactionToEdit.amount));
      setCategoryId(transactionToEdit.category_id || '');
      setDate(transactionToEdit.date);
      setPaymentMethod(transactionToEdit.payment_method);
      setNotes(transactionToEdit.notes || '');
    } else {
      setType(defaultType);
      setTitle('');
      setAmount('');
      setCategoryId('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Cash');
      setNotes('');
    }
    setErrorMessage(null);
  }, [transactionToEdit, defaultType, isOpen]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('You must be logged in to record a transaction.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please enter a description/title.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid positive amount.');
      return;
    }

    if (!date) {
      setErrorMessage('Please choose a date.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      const payload = {
        user_id: user.id,
        title: title.trim(),
        amount: numAmount,
        type,
        category_id: categoryId ? categoryId : null,
        date,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      };

      if (transactionToEdit) {
        const { error } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', transactionToEdit.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('transactions').insert(payload);
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save transaction';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Edit Transaction' : 'Record New Transaction'}
      description="Track your income and expenses to keep your finances organized."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMessage}
          </div>
        )}

        {/* Transaction Type Segmented Toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategoryId('');
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              type === 'expense'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategoryId('');
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              type === 'income'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Income
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Title / Description *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === 'expense'
                ? 'e.g. Grocery shopping, Electricity bill'
                : 'e.g. Monthly salary, Freelance client'
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Amount & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Amount ({profile?.currency_symbol || '৳'}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm font-medium">
                {profile?.currency_symbol || '৳'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        {/* Category & Payment Method Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loadingCategories}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
            >
              <option value="">Select a category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Optional Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details or tags..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all shadow-xs ${
              type === 'expense'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {transactionToEdit
              ? 'Save Changes'
              : type === 'expense'
              ? 'Add Expense'
              : 'Add Income'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
