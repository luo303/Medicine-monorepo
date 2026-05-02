import { create } from "zustand";

interface NavState {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useNavStore = create<NavState>(set => ({
  collapsed: false,
  toggle: () => set(state => ({ collapsed: !state.collapsed })),
  setCollapsed: (collapsed: boolean) => set({ collapsed })
}));
