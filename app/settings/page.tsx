'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { changePassword } from '@/lib/firebase/auth';
import { SUPPORTED_CURRENCIES } from '@/types/database';
import { Alert } from '@/components/ui/Alert';
import { formatCurrency } from '@/lib/utils';
import {
  User,
  Lock,
  Save,
  Loader2,
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Database,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();

  // Profile fields: Name, Age, Current Income, Address, Mobile Number
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('');
  const [currentIncome, setCurrentIncome] = useState<string>('');
  const [address, setAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Regional preferences
  const [currencyCode, setCurrencyCode] = useState('BDT');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  // Loading & notification states
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password update
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAge(profile.age !== null && profile.age !== undefined ? String(profile.age) : '');
      setCurrentIncome(
        profile.current_income !== null && profile.current_income !== undefined
          ? String(profile.current_income)
          : ''
      );
      setAddress(profile.address || '');
      setMobileNumber(profile.mobile_number || '');
      setCurrencyCode(profile.currency_code || 'BDT');
      setDateFormat(profile.date_format || 'DD/MM/YYYY');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError(null);

    try {
      const selectedCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          fullName: fullName.trim(),
          age: age ? Number(age) : null,
          currentIncome: currentIncome ? Number(currentIncome) : null,
          address: address.trim(),
          mobileNumber: mobileNumber.trim(),
          currencyCode,
          currencySymbol: selectedCurrency?.symbol || '৳',
          dateFormat,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update profile information');
      }

      await refreshProfile();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setProfileError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(false);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);

    try {
      await changePassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const currencySymbol = profile?.currency_symbol || '৳';
  const totalIncome = profile?.total_income ?? 0;
  const totalExpense = profile?.total_expense ?? 0;
  const currentBalance = profile?.current_balance ?? (totalIncome - totalExpense);
  const monthlyIncome = profile?.current_income ?? 0;

  return (
    <DashboardLayout
      title="Profile & Settings"
      subtitle="Manage your personal information, monthly income, and view live database expense calculations"
    >
      <div className="space-y-8 max-w-4xl">
        {/* 1. Live MongoDB Expense Calculation Overview */}
        <div className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-indigo-50/70 via-white to-slate-50 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-sm">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Stored MongoDB Expense Calculations
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated and stored in MongoDB database: <code className="text-indigo-600 font-semibold">expence_tracker_smart &gt; user</code>
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Synced
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <Wallet className="h-4 w-4 text-indigo-600" />
                Monthly Income
              </div>
              <div className="text-xl font-bold text-slate-900">
                {monthlyIncome > 0 ? formatCurrency(monthlyIncome, currencySymbol) : 'Not specified'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Your base monthly income</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Total Income
              </div>
              <div className="text-xl font-bold text-emerald-600">
                {formatCurrency(totalIncome, currencySymbol)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Tracked earnings</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <TrendingDown className="h-4 w-4 text-rose-600" />
                Total Expenses
              </div>
              <div className="text-xl font-bold text-rose-600">
                {formatCurrency(totalExpense, currencySymbol)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Tracked spendings</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <PiggyBank className="h-4 w-4 text-violet-600" />
                Net Balance
              </div>
              <div className={`text-xl font-bold ${currentBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                {formatCurrency(currentBalance, currencySymbol)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Income − Expenses</p>
            </div>
          </div>
        </div>

        {/* 2. Personal Profile Information Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Personal Profile Information
              </h3>
              <p className="text-xs text-slate-500">
                Update your Name, Age, Monthly Income, Address, and Mobile Number stored in MongoDB
              </p>
            </div>
          </div>

          {profileSuccess && (
            <div className="mb-6">
              <Alert variant="success" title="Profile Saved">
                Your profile information and monthly income have been saved to MongoDB.
              </Alert>
            </div>
          )}

          {profileError && (
            <div className="mb-6">
              <Alert variant="error" title="Update Failed">
                {profileError}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Row 1: Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sajjad Hossain"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Email / ID
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || profile?.email || ''}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Row 2: Age and Current Income */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Age
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 24"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Monthly Income ({currencySymbol})
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                    {currencySymbol}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentIncome}
                    onChange={(e) => setCurrentIncome(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Mobile Number and Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. +880 1712 345678"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Dhaka, Bangladesh"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Currency and Date Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Currency
                </label>
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Default: Bangladeshi Taka (৳ BDT)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date Display Format
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 10/10/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/10/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-10)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {savingProfile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save Profile Information</span>
              </button>
            </div>
          </form>
        </div>

        {/* 3. Security & Password Settings */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Security & Password
              </h3>
              <p className="text-xs text-slate-500">
                Keep your financial account safe with Firebase secure authentication
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="mb-6">
              <Alert variant="success" title="Password Updated">
                Your account password has been changed successfully.
              </Alert>
            </div>
          )}

          {passwordError && (
            <div className="mb-6">
              <Alert variant="error" title="Password Error">
                {passwordError}
              </Alert>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={updatingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {updatingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
