import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
}) => {
  if (!isOpen) return null;

  const iconMap = {
    danger:  { icon: <AlertTriangle size={20} className="text-red-500" />,   bg: 'bg-red-50',    border: 'border-red-100' },
    warning: { icon: <AlertCircle size={20} className="text-amber-500" />,   bg: 'bg-amber-50',  border: 'border-amber-100' },
    primary: { icon: <Info size={20} className="text-blue-500" />,           bg: 'bg-blue-50',   border: 'border-blue-100' },
  };
  const btnMap = {
    danger:  'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  const { icon, bg, border } = iconMap[variant];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6 animate-[slideUp_0.15s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>

        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg} border ${border} mb-4`}>
          {icon}
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-2 pr-6">{title}</h3>
        {message && <p className="text-sm text-gray-600 leading-relaxed mb-6">{message}</p>}
        {!message && <div className="mb-6" />}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${btnMap[variant]}`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
