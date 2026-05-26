import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppNotification {
  id: string;
  assignmentId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (n) =>
        set((state) => {
          // Don't duplicate — one notification per assignment
          if (state.notifications.some((x) => x.assignmentId === n.assignmentId)) return state;
          return {
            notifications: [
              {
                ...n,
                id: crypto.randomUUID(),
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...state.notifications,
            ].slice(0, 50),
          };
        }),

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearAll: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: 'vedaai-notifications' }
  )
);
