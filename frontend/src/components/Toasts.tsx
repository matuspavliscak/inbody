import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let nextId = 0;
export function createToast(message: string, type: 'success' | 'error' = 'success'): Toast {
  return { id: nextId++, message, type };
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, toast.type === 'error' ? 6000 : 3000);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.type]);

  const isSuccess = toast.type === 'success';

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm max-w-md transition-all duration-300 ${
        exiting ? 'opacity-0 translate-x-4' : visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      } ${isSuccess ? 'bg-gray-900 text-gray-100' : 'bg-red-600 text-white'}`}
    >
      {isSuccess
        ? <CheckCircle size={16} className="text-emerald-400 shrink-0" />
        : <XCircle size={16} className="text-red-200 shrink-0" />
      }
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => { setExiting(true); setTimeout(onDismiss, 300); }} className="text-white/50 hover:text-white shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}
