'use client';

import { useNotifications } from '@/lib/stores/notifications';

const TYPE_STYLES: Record<string, string> = {
  error: 'bg-[var(--color-error-light)] text-[var(--color-error)] border-[var(--color-error)]/20',
  success: 'bg-[var(--color-success-light)] text-[var(--color-success)] border-[var(--color-success)]/20',
  warning: 'bg-[var(--color-warning-light)] text-[var(--color-accent-dark)] border-[var(--color-accent)]/20',
  info: 'bg-[var(--color-surface)] text-[var(--color-primary)] border-[var(--color-primary)]/20',
};

export const Notifications = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 end-4 z-[9999] flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg border p-4 shadow-[var(--shadow-md)] flex items-start gap-3 ${TYPE_STYLES[notification.type] ?? TYPE_STYLES.info}`}
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{notification.title}</p>
            {notification.message && (
              <p className="text-sm mt-0.5 opacity-80">{notification.message}</p>
            )}
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="shrink-0 text-lg leading-none opacity-60 hover:opacity-100 transition-opacity px-1 py-0.5"
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};
