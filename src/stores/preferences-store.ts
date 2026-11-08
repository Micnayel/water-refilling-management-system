import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyTemplate, DEFAULT_TEMPLATE_ID } from "@/config/system-templates";

interface PreferencesState {
  template: string;
  setTemplate: (template: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      template: DEFAULT_TEMPLATE_ID,
      setTemplate: (template) => {
        applyTemplate(template);
        set({ template });
      },
    }),
    {
      name: "wrms.preferences",
      partialize: (state) => ({ template: state.template }),
      onRehydrateStorage: () => (state) => {
        applyTemplate(state?.template ?? DEFAULT_TEMPLATE_ID);
      },
    },
  ),
);
