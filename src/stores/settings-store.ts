import { create } from "zustand";
import { persist } from "zustand/middleware";

export const SESSION_TIMEOUT_OPTIONS = [15, 30, 60, 120] as const;

interface SettingsState {
  sessionTimeoutMinutes: number;
  setSessionTimeout: (minutes: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sessionTimeoutMinutes: 60,
      setSessionTimeout: (minutes) => set({ sessionTimeoutMinutes: minutes }),
    }),
    {
      name: "wrms.settings",
      partialize: (state) => ({ sessionTimeoutMinutes: state.sessionTimeoutMinutes }),
    },
  ),
);

export const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
