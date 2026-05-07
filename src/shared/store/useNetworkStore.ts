import { create } from "zustand";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { useCharacterStore } from "../../features/character/store";
import { RetroToast } from "../ui/RetroToast";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export interface QueuedPayload {
  id: string;
  type: string;
  attackerName: string;
  data: unknown;
}

interface NetworkState {
  onlinePlayers: string[];
  channel: RealtimeChannel | null;
  queue: QueuedPayload[];
  connect: (playerName: string) => void;
  sendPayload: (target: string, type: string, data: unknown) => void;
  pushToQueue: (payload: QueuedPayload) => void;
  popQueue: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  onlinePlayers: [],
  channel: null,
  queue: [],

  pushToQueue: (payload) =>
    set((state) => ({ queue: [...state.queue, payload] })),
  popQueue: () => set((state) => ({ queue: state.queue.slice(1) })),

  connect: (playerName) => {
    if (get().channel) return;

    const channel = supabase.channel("vg-session-main", {
      config: { presence: { key: playerName } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        set({ onlinePlayers: Object.keys(state) });
      })
      .on("broadcast", { event: "system-inject" }, ({ payload }) => {
        if (payload.target === playerName || payload.target === "ALL") {
          get().pushToQueue({
            id: crypto.randomUUID(),
            type: payload.type,
            attackerName: payload.attackerName || "M.D",
            data: payload.data,
          });
          RetroToast.info(`PACOTE ENFILEIRADO: [${payload.type}]`);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    set({ channel });
  },

  sendPayload: (target, type, data) => {
    const { channel } = get();
    if (channel) {
      const senderName = useCharacterStore.getState().name;
      channel.send({
        type: "broadcast",
        event: "system-inject",
        payload: { target, type, attackerName: senderName, data },
      });
    } else {
      RetroToast.error("FALHA DE COMUNICAÇÃO: SISTEMA OFFLINE.");
    }
  },
}));
