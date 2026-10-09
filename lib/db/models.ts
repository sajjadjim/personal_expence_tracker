import { ObjectId } from 'mongodb';
import { TransactionType, PaymentMethod } from '@/types/database';

export interface MongoProfile {
  _id?: ObjectId;
  userId: string;
  email: string;
  fullName: string;
  currencyCode: string;
  currencySymbol: string;
  dateFormat: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoCategory {
  _id?: ObjectId;
  userId: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoTransaction {
  _id?: ObjectId;
  userId: string;
  categoryId: string | null;
  title: string;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod | string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoBudget {
  _id?: ObjectId;
  userId: string;
  categoryId: string;
  month: string; // YYYY-MM
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense' as const, icon: 'Utensils', color: '#f97316' },
  { name: 'Transport', type: 'expense' as const, icon: 'Car', color: '#3b82f6' },
  { name: 'Shopping', type: 'expense' as const, icon: 'ShoppingBag', color: '#ec4899' },
  { name: 'Bills & Utilities', type: 'expense' as const, icon: 'Receipt', color: '#ef4444' },
  { name: 'Education', type: 'expense' as const, icon: 'GraduationCap', color: '#8b5cf6' },
  { name: 'Healthcare', type: 'expense' as const, icon: 'HeartPulse', color: '#10b981' },
  { name: 'Entertainment', type: 'expense' as const, icon: 'Film', color: '#eab308' },
  { name: 'Housing & Rent', type: 'expense' as const, icon: 'Home', color: '#6366f1' },
  { name: 'Other Expense', type: 'expense' as const, icon: 'Tag', color: '#64748b' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', type: 'income' as const, icon: 'Briefcase', color: '#10b981' },
  { name: 'Freelance', type: 'income' as const, icon: 'Laptop', color: '#3b82f6' },
  { name: 'Business', type: 'income' as const, icon: 'Building2', color: '#06b6d4' },
  { name: 'Investments', type: 'income' as const, icon: 'TrendingUp', color: '#8b5cf6' },
  { name: 'Other Income', type: 'income' as const, icon: 'PiggyBank', color: '#14b8a6' },
];
