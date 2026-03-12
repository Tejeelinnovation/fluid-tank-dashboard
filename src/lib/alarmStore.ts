import type { AlarmMap } from "@/types/alarm";

const KEY = "tankco_alarm_limits_v1";

export function loadAlarmMap(): AlarmMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const j = JSON.parse(raw);
    return (j && typeof j === "object") ? (j as AlarmMap) : {};
  } catch {
    return {};
  }
}

export function saveAlarmMap(map: AlarmMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {}
}