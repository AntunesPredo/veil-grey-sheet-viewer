import { useEffect, useRef, useCallback } from "react";
import { useCharacterStore } from "./store";
import { useNetworkStore } from "../../shared/store/useNetworkStore";
import { useCharacterStats } from "../../shared/hooks/useCharacterStats";
import { useActiveModifiers } from "../../shared/hooks/useActiveModifiers";
import CryptoJS from "crypto-js";

export function useTelemetrySync() {
  const name = useCharacterStore((state) => state.name);
  const hp = useCharacterStore((state) => state.hp);
  const insanity = useCharacterStore((state) => state.insanity);
  const energy = useCharacterStore((state) => state.energy);
  const sustenance = useCharacterStore((state) => state.sustenance);
  const attributes = useCharacterStore((state) => state.attributes);
  const skills = useCharacterStore((state) => state.skills);
  const customEffects = useCharacterStore((state) => state.customEffects);
  const inventory = useCharacterStore((state) => state.inventory);
  const disadvantages = useCharacterStore((state) => state.disadvantages);

  const {
    maxHp,
    maxInsanity,
    maxEnergy,
    energyState,
    maxSustenance,
    sustenanceState,
    secondaryAttributes,
  } = useCharacterStats();
  const { activeEffects } = useActiveModifiers();

  const broadcastTelemetry = useNetworkStore(
    (state) => state.broadcastTelemetry,
  );
  const isConnected = useNetworkStore(
    (state) => state.telemetryChannel !== null,
  );

  const masterPingTimestamp = useNetworkStore(
    (state) => state.masterPingTimestamp,
  );
  const masterKnownHashes = useNetworkStore((state) => state.masterKnownHashes);

  const lastPayloadHash = useRef<string>("");

  const triggerSync = useCallback(
    (force = false) => {
      if (!isConnected || !name || name === "SYS.OVERSEER") return;

      const payload = {
        hp: { current: hp.current, max: maxHp, temp: hp.temp },
        insanity: { current: insanity.current, max: maxInsanity },
        energy: { current: energy.current, max: maxEnergy, state: energyState },
        sustenance: {
          current: sustenance.current,
          max: maxSustenance,
          state: sustenanceState,
        },
        attributes,
        secondaryAttributes,
        skills,
        effects: activeEffects,
        customEffectIds: customEffects
          .filter((e) => e.link !== "FLAW" && e.link !== "SYS")
          .map((e) => e.id),
        inventory,
        disadvantages,
      };

      const payloadString = JSON.stringify(payload);
      const currentHash = CryptoJS.MD5(payloadString).toString();

      if (force || currentHash !== lastPayloadHash.current) {
        lastPayloadHash.current = currentHash;
        broadcastTelemetry(name, currentHash, payload);
      }
    },
    [
      isConnected,
      name,
      hp,
      insanity,
      energy,
      sustenance,
      attributes,
      skills,
      customEffects,
      maxHp,
      maxInsanity,
      maxEnergy,
      energyState,
      maxSustenance,
      sustenanceState,
      secondaryAttributes,
      activeEffects,
      inventory,
      disadvantages,
      broadcastTelemetry,
    ],
  );

  useEffect(() => {
    triggerSync(false);
  }, [triggerSync]);

  useEffect(() => {
    if (masterPingTimestamp > 0) {
      const myHashInMaster = masterKnownHashes[name];
      if (myHashInMaster !== lastPayloadHash.current) {
        triggerSync(true);
      }
    }
  }, [masterPingTimestamp, masterKnownHashes, name, triggerSync]);
}
