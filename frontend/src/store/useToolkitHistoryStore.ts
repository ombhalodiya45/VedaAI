import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ToolkitHistoryEntry {
  id: string;
  tool: string;
  title: string;
  createdAt: string;
  result: unknown;
}

interface ToolkitHistoryStore {
  entries: ToolkitHistoryEntry[];
  add: (entry: Omit<ToolkitHistoryEntry, 'id' | 'createdAt'>) => void;
  remove: (id: string) => void;
  clearTool: (tool: string) => void;
}

export const useToolkitHistoryStore = create<ToolkitHistoryStore>()(
  persist(
    (set) => ({
      entries: [],

      add: (entry) =>
        set((state) => ({
          entries: [
            { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
            ...state.entries,
          ].slice(0, 100),
        })),

      remove: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),

      clearTool: (tool) =>
        set((state) => ({ entries: state.entries.filter((e) => e.tool !== tool) })),
    }),
    { name: 'vedaai-toolkit-history' }
  )
);
