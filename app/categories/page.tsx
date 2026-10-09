'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CategoryModal } from '@/components/categories/CategoryModal';
import { Modal } from '@/components/ui/Modal';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Category, TransactionType } from '@/types/database';
import { Plus, Edit2, Trash2, Sparkles, AlertTriangle, Loader2, Tags } from 'lucide-react';

export default function CategoriesPage() {
  const { user, isConfigured } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isConfigured]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSeedDefaults = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const supabase = createClient();
      await supabase.rpc('seed_default_categories_for_user', { target_user_id: user.id });
      await fetchCategories();
    } catch (err) {
      console.error('Failed to seed categories:', err);
    } finally {
      setSeeding(false);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete || !user) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      await fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <DashboardLayout
      title="Category Management"
      subtitle="Organize your financial flow with custom categories and colors"
      onRefreshData={fetchCategories}
    >
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Expense / Income Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('expense')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense Categories ({categories.filter((c) => c.type === 'expense').length})
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income Categories ({categories.filter((c) => c.type === 'income').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {categories.length === 0 && (
              <button
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {seeding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span>Load Default Categories</span>
              </button>
            )}

            <button
              onClick={() => {
                setCategoryToEdit(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add {activeTab === 'expense' ? 'Expense' : 'Income'} Category</span>
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 h-24"
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200/80">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <Tags className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-900">
              No {activeTab} categories found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Create custom categories or restore standard presets to classify your {activeTab}s.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Restore Standard Categories
              </button>
              <button
                onClick={() => {
                  setCategoryToEdit(null);
                  setModalOpen(true);
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                Create First Category
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon
                    iconName={cat.icon}
                    color={cat.color}
                    size={20}
                  />
                  <div className="min-w-0">
                    <h5 className="text-sm font-semibold text-slate-900 truncate">
                      {cat.name}
                    </h5>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      {cat.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setCategoryToEdit(cat);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Edit category"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setCategoryToDelete(cat);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCategoryToEdit(null);
        }}
        onSuccess={fetchCategories}
        categoryToEdit={categoryToEdit}
        defaultType={activeTab}
      />

      {/* Delete Category Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Category"
        description="Are you sure you want to delete this category?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3.5 text-amber-900 border border-amber-200/70">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              Deleting <span className="font-bold">{categoryToDelete?.name}</span> will unlink it from any existing transactions. (Those transactions will remain saved as Uncategorized).
            </div>
          </div>

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
              <span>Delete Category</span>
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
