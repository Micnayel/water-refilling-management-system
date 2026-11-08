import { create } from "zustand";
import type { SessionUser } from "@/types/session";

export type SessionStatus = "loading" | "authenticated" | "anonymous";

interface SessionState {
  user: SessionUser | null;
  status: SessionStatus;
  setUser: (user: SessionUser) => void;
  clear: () => void;
  setStatus: (status: SessionStatus) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user, status: "authenticated" }),
  clear: () => set({ user: null, status: "anonymous" }),
  setStatus: (status) => set({ status }),
}));

export function hasGrant(user: SessionUser | null, grant: string): boolean {
  return user?.grants.includes(grant) ?? false;
}
