"use client";

import * as React from "react";
import TankCard from "./TankCard";
import type { TankAlarmLimits } from "@/types/alarm";
import { loadAlarmMap } from "@/lib/alarmStore";

export type Tank = {
  id: string;
  name: string;
  level: number; // percent 0..100
  temperatureC?: number;
  capacityLiters?: number;
  variant?: "rect" | "cylinder";
};

type TankGridProps = {
  tanks?: Tank[];
  title?: string;
  loading?: boolean;
  disabled?: boolean;
  emptyText?: string;
  onOpenTank?: (tank: Tank) => void;
  onAlarmList?: (events: AlarmEvent[]) => void; // optional callback to show alarms on dashboard
};

export type AlarmEvent = {
  tankId: string;
  tankName: string;
  timeIso: string;
  temperatureC?: number;
  volumeL?: number;
  reason: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pickLimits(map: Record<string, TankAlarmLimits>, tank: Tank) {
  // ✅ robust: try id, then name, then fallback by "Tank X" already in name
  return map[tank.id] ?? map[tank.name] ?? undefined;
}

function buildReason(limits: TankAlarmLimits, temp?: number, vol?: number) {
  const reasons: string[] = [];
  if (typeof vol === "number") {
    if (typeof limits.minVolumeL === "number" && vol < limits.minVolumeL) reasons.push("Low Volume");
    if (typeof limits.maxVolumeL === "number" && vol > limits.maxVolumeL) reasons.push("High Volume");
  }
  if (typeof temp === "number") {
    if (typeof limits.minTempC === "number" && temp < limits.minTempC) reasons.push("Low Temp");
    if (typeof limits.maxTempC === "number" && temp > limits.maxTempC) reasons.push("High Temp");
  }
  return reasons.join(", ") || "Limit crossed";
}

export default function TankGrid({
  tanks = [],
  title,
  loading = false,
  disabled = false,
  emptyText = "No tank data available",
  onOpenTank,
  onAlarmList,
}: TankGridProps) {
  const [alarmMap, setAlarmMap] = React.useState<Record<string, TankAlarmLimits>>({});

  React.useEffect(() => {
    // load once on mount + when storage changes (if multiple tabs)
    const load = () => setAlarmMap(loadAlarmMap());
    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const alarmEvents = React.useMemo(() => {
    const events: AlarmEvent[] = [];
    for (const t of tanks) {
      const limits = pickLimits(alarmMap, t);
      if (!limits) continue;

      const level = clamp(Math.round(safeNum(t.level, 0)), 0, 100);
      const temp =
        t.temperatureC === undefined || t.temperatureC === null
          ? undefined
          : Math.round(safeNum(t.temperatureC, 0) * 10) / 10;

      const cap = typeof t.capacityLiters === "number" ? t.capacityLiters : 1000;
      const vol = Math.round((level / 100) * cap);

      const alarmNow =
        (typeof limits.minVolumeL === "number" && vol < limits.minVolumeL) ||
        (typeof limits.maxVolumeL === "number" && vol > limits.maxVolumeL) ||
        (typeof limits.minTempC === "number" && typeof temp === "number" && temp < limits.minTempC) ||
        (typeof limits.maxTempC === "number" && typeof temp === "number" && temp > limits.maxTempC);

      if (alarmNow) {
        events.push({
          tankId: t.id,
          tankName: t.name,
          timeIso: new Date().toISOString(),
          temperatureC: temp,
          volumeL: vol,
          reason: buildReason(limits, temp, vol),
        });
      }
    }
    return events;
  }, [tanks, alarmMap]);

  React.useEffect(() => {
    onAlarmList?.(alarmEvents);
  }, [alarmEvents, onAlarmList]);

  if (disabled) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="text-base font-semibold text-white">Dashboard Disabled</div>
        <div className="mt-1 text-sm text-white/60">Contact admin to enable data access.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
        Loading tanks...
      </div>
    );
  }

  if (!tanks || tanks.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
        {emptyText}
      </div>
    );
  }

  return (
    <div>
      {title ? (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tanks.map((tank, idx) => {
          const id = String(tank.id ?? `T${idx + 1}`);
          const name = String(tank.name ?? `Tank ${idx + 1}`);

          const level = clamp(Math.round(safeNum(tank.level, 0)), 0, 100);
          const temperatureC =
            tank.temperatureC === undefined || tank.temperatureC === null
              ? undefined
              : Math.round(safeNum(tank.temperatureC, 0) * 10) / 10;

          const capacityLiters =
            tank.capacityLiters === undefined || tank.capacityLiters === null
              ? undefined
              : Math.max(0, Math.round(safeNum(tank.capacityLiters, 0)));

          const normalized: Tank = {
            ...tank,
            id,
            name,
            level,
            temperatureC,
            capacityLiters,
          };

          const limits = pickLimits(alarmMap, normalized);

          return (
            <TankCard
              key={id}
              id={id}
              name={name}
              level={level}
              temperatureC={temperatureC}
              capacityLiters={capacityLiters}
              variant={tank.variant ?? "rect"}
              limits={limits}
              onOpen={onOpenTank ? () => onOpenTank(normalized) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}