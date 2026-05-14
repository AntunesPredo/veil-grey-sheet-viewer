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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  telemetryData: Record<string, any>;
  channel: RealtimeChannel | null;
  telemetryChannel: RealtimeChannel | null;
  queue: QueuedPayload[];
  connect: (playerName: string) => void;
  sendPayload: (target: string, type: string, data: unknown) => void;
  broadcastTelemetry: (playerName: string, data: unknown) => void;
  pushToQueue: (payload: QueuedPayload) => void;
  popQueue: () => void;
  disconnect: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  onlinePlayers: [],
  telemetryData: {},
  channel: null,
  telemetryChannel: null,
  queue: [],

  pushToQueue: (payload) =>
    set((state) => ({ queue: [...state.queue, payload] })),
  popQueue: () => set((state) => ({ queue: state.queue.slice(1) })),

  connect: (playerName) => {
    if (get().channel) return;

    // CANAL PRIMÁRIO: Ações, Injeções e Presença
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
            attackerName: payload.attackerName || "SYS.OVERSEER",
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

    // CANAL SECUNDÁRIO: Telemetria de Vitals isolada para não poluir o MAIN
    const telemetryChannel = supabase.channel("vg-telemetry");

    // Listener atrelado ANTES do subscribe
    telemetryChannel
      .on("broadcast", { event: "SYNC_STATS" }, ({ payload }) => {
        set((state) => ({
          telemetryData: {
            ...state.telemetryData,
            [payload.name]: payload.data,
          },
        }));
      })
      .subscribe();

    RetroToast.success(`SYS.ONLINE | CONNECTED AS: [${playerName}]`);
    set({ channel, telemetryChannel });
  },

  disconnect: () => {
    const { channel, telemetryChannel } = get();
    if (channel) {
      channel.untrack();
      channel.unsubscribe();
    }
    if (telemetryChannel) {
      telemetryChannel.unsubscribe();
    }
    set({
      channel: null,
      telemetryChannel: null,
      onlinePlayers: [],
      telemetryData: {},
    });
  },

  sendPayload: (target, type, data) => {
    const senderName = useCharacterStore.getState().name;
    if (target === "SELF") {
      get().pushToQueue({
        id: crypto.randomUUID(),
        type,
        attackerName: senderName,
        data,
      });
      RetroToast.info(`PACOTE ENFILEIRADO LOCALMENTE: [${type}]`);
      return;
    }
    const { channel } = get();
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "system-inject",
        payload: { target, type, attackerName: senderName, data },
      });
    }
  },

  broadcastTelemetry: (playerName, data) => {
    const { telemetryChannel } = get();
    if (telemetryChannel) {
      telemetryChannel.send({
        type: "broadcast",
        event: "SYNC_STATS",
        payload: { name: playerName, data },
      });
    }
  },
}));
