import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useMeetings } from '../../context/MeetingContext';

export default function Toast() {
  const { toasts, removeToast } = useMeetings();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '360px'
    }}>
      {toasts.map(t => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isSuccess && <CheckCircle2 size={16} color="#16A34A" />}
              {isError && <AlertCircle size={16} color="#DC2626" />}
              {!isSuccess && !isError && <Info size={16} color="var(--text-secondary)" />}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
