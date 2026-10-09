'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal';
import { Modal } from '@/components/ui/Modal';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Transaction, Category } from '@/types/database';
import { formatCurrency, formatDate, downloadCSV } from '@/lib/utils';
import {
  Search,
  Plus,
  Download,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const { user, profile, isConfigured } = useAuth();

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load categories
  useEffect(() => {
    if (!user || !isConfigured) return;
    async function fetchCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');
      if (data) setCategories(data);
    }
    fetchCategories();
  }, [user, isConfigured]);

  // Load transactions
  const fetchTransactions = useCallback(async () => {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions((data as unknown as Transaction[]) || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isConfigured]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Client filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (
        searchQuery &&
        !tx.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !tx.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      // Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }
      // Category
      if (categoryFilter !== 'all' && tx.category_id !== categoryFilter) {
        return false;
      }
      // Date range
      if (startDate && tx.date < startDate) {
        return false;
      }
      if (endDate && tx.date > endDate) {
        return false;
      }
      return true;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter, startDate, endDate]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

  const handleEdit = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setFormModalOpen(true);
  };

  const handleDeletePrompt = (tx: Transaction) => {
    setTransactionToDelete(tx);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete || !user) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
      await fetchTransactions();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'];
    const rows = filteredTransactions.map((tx) => [
      tx.date,
      tx.title,
      tx.type,
      tx.category?.name || 'Uncategorized',
      tx.amount,
      tx.payment_method,
      tx.notes || '',
    ]);
    downloadCSV(`transactions-export-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <DashboardLayout
      title="Transactions"
      subtitle="Complete ledger of all your income and expenses"
      onRefreshData={fetchTransactions}
    >
      <div className="space-y-6">
        {/* Top Action & Search Bar */}
        <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions by title or notes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleExportCSV}
                disabled={filteredTransactions.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => {
                  setTransactionToEdit(null);
                  setFormModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            {/* Type selector */}
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setTypeFilter('expense');
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  typeFilter === 'expense' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expense
              </button>
              <button
                onClick={() => {
                  setTypeFilter('income');
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  typeFilter === 'income' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Income
              </button>
            </div>

            {/* Category dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>

            {/* Date range pickers */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
              />
              <span className="font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Transactions Table & Cards */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-6">
              <table className="w-full">
                <tbody>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </tbody>
              </table>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Receipt className="h-6 w-6" />
              </div>
              <h4 className="text-base font-semibold text-slate-900">
                {hasActiveFilters ? 'No transactions match your filters' : 'No transactions recorded yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                {hasActiveFilters
                  ? 'Try adjusting your search criteria, dates, or category selections.'
                  : 'Start tracking your personal financial flow by recording your first transaction.'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTransactionToEdit(null);
                    setFormModalOpen(true);
                  }}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Add First Record
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-6">Description</th>
                      <th className="py-3.5 px-6">Category</th>
                      <th className="py-3.5 px-6">Payment Method</th>
                      <th className="py-3.5 px-6 text-right">Amount</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedTransactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(tx.date, profile?.date_format)}
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-900 max-w-xs">
                            <div className="truncate">{tx.title}</div>
                            {tx.notes && (
                              <div className="text-[11px] text-slate-400 font-normal truncate mt-0.5">
                                {tx.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <CategoryIcon
                                iconName={tx.category?.icon}
                                color={tx.category?.color}
                                size={14}
                                className="p-1.5"
                              />
                              <span className="text-xs font-medium text-slate-700">
                                {tx.category?.name || 'Uncategorized'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500">
                            {tx.payment_method}
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <span
                              className={`font-bold tracking-tight text-sm ${
                                isIncome ? 'text-emerald-600' : 'text-slate-900'
                              }`}
                            >
                              {isIncome ? '+' : '-'}{formatCurrency(tx.amount, profile?.currency_symbol)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                              <button
                                onClick={() => handleEdit(tx)}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePrompt(tx)}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="divide-y divide-slate-100 md:hidden">
                {paginatedTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <div key={tx.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <CategoryIcon
                            iconName={tx.category?.icon}
                            color={tx.category?.color}
                            size={16}
                            className="p-1.5"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{tx.title}</p>
                            <p className="text-[11px] text-slate-400">
                              {formatDate(tx.date, profile?.date_format)} • {tx.payment_method}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-bold text-sm ${
                            isIncome ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount, profile?.currency_symbol)}
                        </span>
                      </div>
                      {tx.notes && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                          {tx.notes}
                        </p>
                      )}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(tx)}
                          className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                <span className="text-xs text-slate-500 font-medium">
                  Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
                  <span className="font-semibold text-slate-800">
                    {Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)}
                  </span>{' '}
                  of <span className="font-semibold text-slate-800">{filteredTransactions.length}</span> records
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit/Add Modal */}
      <TransactionFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSuccess={fetchTransactions}
        transactionToEdit={transactionToEdit}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
        description="This action cannot be undone."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-3.5 text-rose-900 border border-rose-100">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              Are you sure you want to delete <span className="font-bold">{transactionToDelete?.title}</span> for{' '}
              <span className="font-bold">
                {formatCurrency(transactionToDelete?.amount, profile?.currency_symbol)}
              </span>
              ?
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
              <span>Delete Permanently</span>
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
