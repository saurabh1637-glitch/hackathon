import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };

export default function Toasts() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || CheckCircle2;
        return (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon size={18} />
            <span>{t.message}</span>
            <button className="icon-btn" onClick={() => dismissToast(t.id)} aria-label="Dismiss" style={{ width: 28, height: 28 }}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
