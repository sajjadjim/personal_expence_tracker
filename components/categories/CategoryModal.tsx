'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Category, TransactionType } from '@/types/database';
import { AVAILABLE_ICONS, AVAILABLE_COLORS, ICON_MAP, CategoryIcon } from '@/components/ui/CategoryIcon';
import { Loader2 } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: Category | null;
  defaultType?: TransactionType;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
  defaultType = 'expense',
}: CategoryModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [selectedIcon, setSelectedIcon] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setSelectedIcon(categoryToEdit.icon || 'Tag');
      setSelectedColor(categoryToEdit.color || '#6366f1');
    } else {
      setName('');
      setType(defaultType);
      setSelectedIcon('Tag');
      setSelectedColor('#6366f1');
    }
    setErrorMessage(null);
  }, [categoryToEdit, defaultType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Category name is required.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const payload = {
        user_id: user.id,
        name: name.trim(),
        type,
        icon: selectedIcon,
        color: selectedColor,
      };

      if (categoryToEdit) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', categoryToEdit.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save category';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? 'Edit Category' : 'Create Custom Category'}
      description="Organize your financial transactions by custom categories."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMessage}
          </div>
        )}

        {/* Type selector */}
        {!categoryToEdit && (
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense Category
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income Category
            </button>
          </div>
        )}

        {/* Name input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Subscriptions, Groceries, Dividends"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Color Picker Palette */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">
            Badge Color
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  selectedColor === color
                    ? 'border-slate-800 scale-110 shadow-sm'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Icon Picker Grid */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">
            Icon
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl">
            {AVAILABLE_ICONS.map((iconKey) => {
              const IconComp = ICON_MAP[iconKey];
              const isSelected = selectedIcon === iconKey;
              return (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => setSelectedIcon(iconKey)}
                  className={`flex items-center justify-center p-2 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-xs'
                      : 'border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                  title={iconKey}
                >
                  <IconComp className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Preview */}
        <div className="rounded-xl bg-slate-50 p-3 flex items-center gap-3 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Preview:</span>
          <CategoryIcon
            iconName={selectedIcon}
            color={selectedColor}
            size={18}
          />
          <span className="text-sm font-semibold text-slate-800">
            {name || 'Category Name'}
          </span>
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
            <span>{categoryToEdit ? 'Save Changes' : 'Create Category'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
