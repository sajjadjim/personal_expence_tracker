import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}: AlertProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-rose-50 border-rose-200 text-rose-900',
  };

  const icons = {
    info: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-xl border p-4 text-sm shadow-xs ${styles[variant]} ${className}`}
    >
      {icons[variant]}
      <div className="flex-1">
        {title && <h5 className="font-semibold leading-none tracking-tight mb-1">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
