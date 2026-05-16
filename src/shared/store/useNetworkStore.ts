import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  masterPingTimestamp: number;
  masterKnownHashes: Record<string, string>;
  telemetryData: Record<string, unknown>;
  telemetryHashes: Record<string, string>;
  channel: RealtimeChannel | null;
  telemetryChannel: RealtimeChannel | null;
  queue: QueuedPayload[];

  connect: (playerName: string) => void;
  sendPayload: (target: string, type: string, data: unknown) => void;
  broadcastTelemetry: (playerName: string, hash: string, data: unknown) => void;
  broadcastMasterPing: (knownHashes: Record<string, string>) => void;
  broadcastPowerOff: (playerName: string) => void;
  removeTelemetry: (playerName: string) => void;
  pushToQueue: (payload: QueuedPayload) => void;
  popQueue: () => void;
  disconnect: () => void;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      onlinePlayers: [],
      masterPingTimestamp: 0,
      masterKnownHashes: {},
      telemetryData: {},
      telemetryHashes: {},
      channel: null,
      telemetryChannel: null,
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
                attackerName: payload.attackerName || "MESTRE",
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

        const telemetryChannel = supabase.channel("vg-telemetry");

        telemetryChannel
          .on("broadcast", { event: "SYNC_STATS" }, ({ payload }) => {
            set((state) => ({
              telemetryData: {
                ...state.telemetryData,
                [payload.name]: payload.data,
              },
              telemetryHashes: {
                ...state.telemetryHashes,
                [payload.name]: payload.hash,
              },
            }));
          })
          .on("broadcast", { event: "POWER_OFF" }, ({ payload }) => {
            get().removeTelemetry(payload.name);
          })
          .on("broadcast", { event: "MASTER_PING" }, ({ payload }) => {
            set({
              masterPingTimestamp: Date.now(),
              masterKnownHashes: payload.hashes || {},
            });
          })
          .subscribe();

        RetroToast.success(`TELEMETRY.ONLINE | CONNECTED AS: [${playerName}]`);
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
        set({ channel: null, telemetryChannel: null, onlinePlayers: [] });
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

      broadcastTelemetry: (playerName, hash, data) => {
        const { telemetryChannel } = get();
        if (telemetryChannel) {
          telemetryChannel.send({
            type: "broadcast",
            event: "SYNC_STATS",
            payload: { name: playerName, hash, data },
          });
        }
      },

      broadcastMasterPing: (knownHashes) => {
        const { telemetryChannel } = get();
        if (telemetryChannel) {
          telemetryChannel.send({
            type: "broadcast",
            event: "MASTER_PING",
            payload: { hashes: knownHashes },
          });
        }
      },

      removeTelemetry: (playerName) =>
        set((state) => {
          const newData = { ...state.telemetryData };
          const newHashes = { ...state.telemetryHashes };
          delete newData[playerName];
          delete newHashes[playerName];
          return { telemetryData: newData, telemetryHashes: newHashes };
        }),
      broadcastPowerOff: (playerName) => {
        const { telemetryChannel } = get();
        if (telemetryChannel) {
          telemetryChannel.send({
            type: "broadcast",
            event: "POWER_OFF",
            payload: { name: playerName },
          });
        }
      },
    }),
    {
      name: "vg_network_cache",
      partialize: (state) => ({
        telemetryData: state.telemetryData,
        telemetryHashes: state.telemetryHashes,
      }),
    },
  ),
);
