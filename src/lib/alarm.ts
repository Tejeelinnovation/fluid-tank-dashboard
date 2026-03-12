import type { Tank } from "@/components/tanks/TankGrid";
import type { TankAlarmLimits } from "@/types/alarm";

export function currentVolumeL(tank: Tank) {
  const cap = tank.capacityLiters ?? 1000;
  const pct = Math.max(0, Math.min(100, tank.level ?? 0));
  return (pct / 100) * cap;
}

export function isTankInAlarm(tank: Tank, limits?: TankAlarmLimits) {
  if (!limits) return false;

  const vol = currentVolumeL(tank);
  const temp = typeof tank.temperatureC === "number" ? tank.temperatureC : undefined;

  if (typeof limits.minVolumeL === "number" && vol < limits.minVolumeL) return true;
  if (typeof limits.maxVolumeL === "number" && vol > limits.maxVolumeL) return true;

  if (typeof limits.minTempC === "number" && typeof temp === "number" && temp < limits.minTempC)
    return true;
  if (typeof limits.maxTempC === "number" && typeof temp === "number" && temp > limits.maxTempC)
    return true;

  return false;
}