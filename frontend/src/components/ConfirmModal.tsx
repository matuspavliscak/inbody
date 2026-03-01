import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { btn } from '../lib/styles';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass = confirmVariant === 'danger'
    ? 'inline-flex items-center gap-1.5 text-sm font-medium rounded-lg transition-colors px-4 py-2 bg-red-600 hover:bg-red-500 text-white'
    : `${btn.primary} px-4 py-2`;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h3 id="confirm-title" className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p id="confirm-message" className="text-sm text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button ref={cancelRef} onClick={onCancel} className={btn.secondary}>
            Cancel
          </button>
          <button onClick={onConfirm} className={confirmClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
