import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  loading: boolean;
  schoolName: string;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setSchoolName: (name: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  schoolName: '',
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setSchoolName: (schoolName) => set({ schoolName }),
}));
