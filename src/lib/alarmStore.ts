import type { AlarmMap } from "@/types/alarm";

const KEY = "tankco_alarm_limits_v1";
const CHANGE_EVENT = "tankco:alarm-limits-changed";

export function loadAlarmMap(): AlarmMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const j = JSON.parse(raw);
    return j && typeof j === "object" ? (j as AlarmMap) : {};
  } catch {
    return {};
  }
}

export function saveAlarmMap(map: AlarmMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {}
}

export function subscribeAlarmMap(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener(CHANGE_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CHANGE_EVENT, handler as EventListener);
  };
}
