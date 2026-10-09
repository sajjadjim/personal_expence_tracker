import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with proper decimal precision and currency symbol
 * Uses Bangladeshi Taka (৳) as default
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencySymbol = '৳',
  locale = 'en-US'
): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0);
  if (isNaN(numericAmount)) return `${currencySymbol} 0.00`;

  // Format with thousands separator and 2 decimal places
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(numericAmount));

  const sign = numericAmount < 0 ? '-' : '';
  return `${sign}${currencySymbol} ${formattedNumber}`;
}

/**
 * Formats a Date or date string according to display preference
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  formatStyle = 'DD/MM/YYYY'
): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (formatStyle === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  }
  if (formatStyle === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  // Default 'DD/MM/YYYY'
  return `${day}/${month}/${year}`;
}

/**
 * Convert an array of objects into a downloaded CSV file
 */
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get current month string in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Format YYYY-MM to human readable (e.g., 'October 2026')
 */
export function formatMonthYear(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (!year || !month) return monthStr;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}
