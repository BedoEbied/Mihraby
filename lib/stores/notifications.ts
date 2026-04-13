import { create } from 'zustand';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
};

type NotificationsStore = {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
};

// Track auto-dismiss timers so they can be cleared on manual dismiss or clearAll
const timers = new Map<string, NodeJS.Timeout>();

export const useNotifications = create<NotificationsStore>((set) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    if (notification.duration !== 0) {
      const timer = setTimeout(() => {
        timers.delete(id);
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, notification.duration || 5000);
      timers.set(id, timer);
    }
  },

  removeNotification: (id) => {
    const timer = timers.get(id);
    if (timer) { clearTimeout(timer); timers.delete(id); }
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    set({ notifications: [] });
  },
}));
