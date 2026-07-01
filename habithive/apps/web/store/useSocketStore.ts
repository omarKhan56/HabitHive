import { create } from "zustand";
import type { Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@habithive/shared/schemas";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketStore {
  socket: AppSocket | null;
  connected: boolean;
  /** userId -> online boolean, updated by presence:update events */
  presence: Record<string, boolean>;
  setSocket: (socket: AppSocket) => void;
  setConnected: (connected: boolean) => void;
  setPresence: (userId: string, online: boolean) => void;
  clearSocket: () => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  connected: false,
  presence: {},
  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ connected }),
  setPresence: (userId, online) =>
    set((state) => ({ presence: { ...state.presence, [userId]: online } })),
  clearSocket: () => set({ socket: null, connected: false, presence: {} }),
}));