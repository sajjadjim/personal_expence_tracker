'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Category, Transaction, PAYMENT_METHODS, TransactionType } from '@/types/database';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Loader2 } from 'lucide-react';

const transactionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().nullable().optional(),
  date: z.string().min(1, 'Date is required'),
  payment_method: z.string().min(1, 'Payment method is required'),
  notes: z.string().max(500, 'Notes are too long').optional().nullable(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    // @ts-expect-error zodResolver type compatibility
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      title: '',
      amount: undefined,
      category_id: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      notes: '',
    },
  });

  const selectedType = watch('type');

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
      reset({
        type: transactionToEdit.type,
        title: transactionToEdit.title,
        amount: Number(transactionToEdit.amount),
        category_id: transactionToEdit.category_id || '',
        date: transactionToEdit.date,
        payment_method: transactionToEdit.payment_method,
        notes: transactionToEdit.notes || '',
      });
    } else {
      reset({
        type: defaultType,
        title: '',
        amount: undefined,
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        notes: '',
      });
    }
    setErrorMessage(null);
  }, [transactionToEdit, defaultType, isOpen, reset]);

  const filteredCategories = categories.filter((c) => c.type === selectedType);

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) {
      setErrorMessage('You must be logged in to record a transaction.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      const payload = {
        user_id: user.id,
        title: data.title.trim(),
        amount: Number(data.amount),
        type: data.type,
        category_id: data.category_id ? data.category_id : null,
        date: data.date,
        payment_method: data.payment_method,
        notes: data.notes?.trim() || null,
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMessage}
          </div>
        )}

        {/* Transaction Type Segmented Toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setValue('type', 'expense');
              setValue('category_id', '');
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              selectedType === 'expense'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('type', 'income');
              setValue('category_id', '');
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              selectedType === 'income'
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
            placeholder={selectedType === 'expense' ? 'e.g. Grocery shopping, Electricity bill' : 'e.g. Monthly salary, Freelance client'}
            {...register('title')}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-rose-500">{errors.title.message}</p>
          )}
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
                placeholder="0.00"
                {...register('amount')}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-rose-500">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              {...register('date')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {errors.date && (
              <p className="mt-1 text-xs text-rose-500">{errors.date.message}</p>
            )}
          </div>
        </div>

        {/* Category & Payment Method Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              {...register('category_id')}
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
              {...register('payment_method')}
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
            placeholder="Add any additional details or tags..."
            {...register('notes')}
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
              selectedType === 'expense'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {transactionToEdit ? 'Save Changes' : selectedType === 'expense' ? 'Add Expense' : 'Add Income'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
