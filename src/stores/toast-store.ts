import { create } from "zustand";

export interface ToastMessage {
  id: number;
  title: string;
  tone: "success" | "error" | "info";
}

interface ToastState {
  messages: ToastMessage[];
  push: (title: string, tone?: ToastMessage["tone"]) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  messages: [],
  push: (title, tone = "info") => {
    const id = nextId++;
    set((state) => ({ messages: [...state.messages, { id, title, tone }] }));
    window.setTimeout(() => {
      set((state) => ({ messages: state.messages.filter((message) => message.id !== id) }));
    }, 4500);
  },
  dismiss: (id) =>
    set((state) => ({ messages: state.messages.filter((message) => message.id !== id) })),
}));
