import { useState, useEffect } from 'react';

let registeredPlantIds: Set<string> = new Set();
const listeners: Array<() => void> = [];

function notify() { listeners.forEach((fn) => fn()); }

export function registerSensorForPlant(plantId: string | null | undefined) {
  if (plantId) { registeredPlantIds = new Set([...registeredPlantIds, plantId]); notify(); }
}

export function isSensorRegistered(plantId: string | null | undefined): boolean {
  return plantId ? registeredPlantIds.has(plantId) : false;
}

export function useRegisteredSensors() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.push(fn);
    return () => { const idx = listeners.indexOf(fn); if (idx !== -1) listeners.splice(idx, 1); };
  }, []);
}
