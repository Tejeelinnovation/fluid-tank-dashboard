"use client";

import React from "react";
import FluidTank from "./FluidTankClient";
import TankHistoryChart from "./TankHistoryChart";
import { generateTankHistory, type TankMetric } from "@/lib/tankHistoryGenerator";
import type { Tank } from "./TankGrid";
import type { TankAlarmLimits } from "@/types/alarm";
import { currentVolumeL } from "@/lib/alarm";

function toDateInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateInput(v: string) {
  const d = new Date(v);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isPointAlarmByMetric(
  p: { volumeL: number; temperatureC: number },
  metric: TankMetric,
  limits?: TankAlarmLimits
) {
  if (!limits) return false;

  if (metric === "volume") {
    const hasVolLimits =
      typeof limits.minVolumeL === "number" || typeof limits.maxVolumeL === "number";
    if (!hasVolLimits) return false;

    if (typeof limits.minVolumeL === "number" && p.volumeL < limits.minVolumeL) return true;
    if (typeof limits.maxVolumeL === "number" && p.volumeL > limits.maxVolumeL) return true;
    return false;
  }

  // metric === "temperature"
  const hasTempLimits =
    typeof limits.minTempC === "number" || typeof limits.maxTempC === "number";
  if (!hasTempLimits) return false;

  if (typeof limits.minTempC === "number" && p.temperatureC < limits.minTempC) return true;
  if (typeof limits.maxTempC === "number" && p.temperatureC > limits.maxTempC) return true;
  return false;
}

export default function TankDetailsModal({
  open,
  onClose,
  tank,
  alarmMap,
}: {
  open: boolean;
  onClose: () => void;
  tank: Tank | null;
  alarmMap: Record<string, TankAlarmLimits>;
}) {
  // ✅ always defined – avoids conditional hook order issues
  const tankId = tank?.id ?? "";
  const tankName = tank?.name ?? "";

  const [metric, setMetric] = React.useState<TankMetric>("volume");

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const defaultStart = React.useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return d;
  }, [today]);

  const [startStr, setStartStr] = React.useState(toDateInputValue(defaultStart));
  const [endStr, setEndStr] = React.useState(toDateInputValue(today));

  // lock background scroll
  React.useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // reset controls when opened / tank changes
  React.useEffect(() => {
    if (!open) return;
    setMetric("volume");
    setStartStr(toDateInputValue(defaultStart));
    setEndStr(toDateInputValue(today));
  }, [open, tankId, defaultStart, today]);

  // ✅ safe lookup
  const limits = React.useMemo(() => {
    if (!tank) return undefined;
    return alarmMap[tank.id] ?? alarmMap[tank.name];
  }, [tank, alarmMap]);

  const history = React.useMemo(() => {
    if (!tank) return [];
    const start = parseDateInput(startStr);
    const end = parseDateInput(endStr);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
    if (start > end) return [];

    return generateTankHistory({
      tankId: tank.id,
      capacityLiters: tank.capacityLiters ?? 1000,
      startDate: start,
      endDate: end,
    });
  }, [tank, startStr, endStr]);

  const chartData = React.useMemo(() => {
    return history.map((p) => ({
      ...p,
      __alarm: isPointAlarmByMetric(p, metric, limits),
  }));
}, [history, limits, metric]);

  const alarmEvents = React.useMemo(() => {
    return chartData
      .filter((p) => p.__alarm)
      .map((p) => ({
        date: p.date,
        volumeL: p.volumeL,
        temperatureC: p.temperatureC,
      }));
  }, [chartData]);

  // ✅ render gate AFTER hooks
  if (!open || !tank) return null;

  const nowVol = currentVolumeL(tank);

  const alarmNow =
    !!limits &&
    ((typeof limits.minVolumeL === "number" && nowVol < limits.minVolumeL) ||
      (typeof limits.maxVolumeL === "number" && nowVol > limits.maxVolumeL) ||
      (typeof limits.minTempC === "number" &&
        typeof tank.temperatureC === "number" &&
        tank.temperatureC < limits.minTempC) ||
      (typeof limits.maxTempC === "number" &&
        typeof tank.temperatureC === "number" &&
        tank.temperatureC > limits.maxTempC));

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* mobile fullscreen, desktop centered */}
      <div className="absolute inset-0 md:left-1/2 md:top-1/2 md:inset-auto md:w-[95vw] md:max-w-5xl md:-translate-x-1/2 md:-translate-y-1/2">
        <div
          className="
            h-full md:max-h-[85vh]
            rounded-none md:rounded-2xl
            border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl
            p-4 md:p-6
            overflow-y-auto overscroll-contain
          "
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
                <span className="truncate">{tankName}</span>
                {alarmNow ? (
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/15 text-red-200">
                    ALARM
                  </span>
                ) : null}
              </div>

              <div className="text-sm text-white/60">
                Temp:{" "}
                {typeof tank.temperatureC === "number" ? tank.temperatureC.toFixed(1) : "--"}°C
                <span className="mx-2 text-white/25">•</span>
                Vol: {Math.round(nowVol)} L
              </div>

              {limits ? (
                <div className="mt-1 text-xs text-white/45">
                  Limits:{" "}
                  {typeof limits.minVolumeL === "number" ? `Vol ≥ ${limits.minVolumeL}L` : "—"}
                  {typeof limits.maxVolumeL === "number" ? `, Vol ≤ ${limits.maxVolumeL}L` : ""}
                  {" · "}
                  {typeof limits.minTempC === "number" ? `Temp ≥ ${limits.minTempC}°C` : "—"}
                  {typeof limits.maxTempC === "number" ? `, Temp ≤ ${limits.maxTempC}°C` : ""}
                </div>
              ) : (
                <div className="mt-1 text-xs text-white/45">
                  No alarm limits set (set it in Setup).
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10 transition"
            >
              Close
            </button>
          </div>

          {/* Body */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Tank */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 flex items-center justify-center">
              <FluidTank
                level={tank.level}
                capacityLiters={tank.capacityLiters ?? 1000}
                unit="L"
                variant={tank.variant ?? "rect"}
                width={220}
                height={280}
                alarm={alarmNow}
              />
            </div>

            {/* Right: Controls + Chart + Alarms */}
            <div className="space-y-3">
              {/* Controls */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setMetric("volume")}
                    className={
                      "rounded-full px-4 py-2 text-xs border transition " +
                      (metric === "volume"
                        ? "bg-white/15 border-white/20 text-white"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10")
                    }
                  >
                    Volume
                  </button>
                  <button
                    onClick={() => setMetric("temperature")}
                    className={
                      "rounded-full px-4 py-2 text-xs border transition " +
                      (metric === "temperature"
                        ? "bg-white/15 border-white/20 text-white"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10")
                    }
                  >
                    Temperature
                  </button>
                </div>

                {/* ✅ responsive date row */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[11px] text-white/50 whitespace-nowrap">From</span>
                    <input
                      type="date"
                      value={startStr}
                      onChange={(e) => setStartStr(e.target.value)}
                      className="w-full sm:w-[155px] rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/85 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[11px] text-white/50 whitespace-nowrap">To</span>
                    <input
                      type="date"
                      value={endStr}
                      onChange={(e) => setEndStr(e.target.value)}
                      className="w-full sm:w-[155px] rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/85 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Chart */}
              {startStr > endStr ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                  Start date must be before end date.
                </div>
              ) : (
                <TankHistoryChart data={chartData as any} metric={metric} limits={limits} />
              )}

              <div className="text-xs text-white/45">
                Showing {history.length} day(s).
                {limits ? (
                  <>
                    <span className="mx-1 text-white/25">•</span>
                    Alarm points: {alarmEvents.length}
                  </>
                ) : null}
              </div>

              {/* Alarm Events List */}
              {limits ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">Alarm Events</div>
                  <div className="mt-1 text-xs text-white/55">
                    Points where limits were crossed (red dots + red segments).
                  </div>

                  {alarmEvents.length === 0 ? (
                    <div className="mt-3 text-sm text-white/50">No alarms in this range.</div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {alarmEvents.slice(0, 10).map((e) => (
                        <div
                          key={e.date + e.volumeL + e.temperatureC}
                          className="flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs text-white/70 truncate">{tankName}</div>
                            <div className="text-sm text-white">{e.date}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm text-white">
                              {e.volumeL} L
                              <span className="mx-2 text-white/25">•</span>
                              {e.temperatureC}°C
                            </div>
                            <div className="text-[11px] text-red-200/80">Limit crossed</div>
                          </div>
                        </div>
                      ))}
                      {alarmEvents.length > 10 ? (
                        <div className="text-xs text-white/45">
                          Showing first 10 alarms. Narrow date range to see more.
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="h-6 md:hidden" />
        </div>
      </div>
    </div>
  );
}