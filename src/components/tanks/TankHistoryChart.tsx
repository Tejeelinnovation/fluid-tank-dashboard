"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { TankMetric, TankHistoryPoint } from "@/lib/tankHistoryGenerator";
import type { TankAlarmLimits } from "@/types/alarm";

type ChartPoint = TankHistoryPoint & { __alarm?: boolean };

export default function TankHistoryChart({
  data,
  metric,
  limits,
}: {
  data: ChartPoint[];
  metric: TankMetric;
  limits?: TankAlarmLimits;
}) {
  const key = metric === "volume" ? "volumeL" : "temperatureC";
  const unit = metric === "volume" ? "L" : "°C";

  // Only enable alarm visuals if that metric has limits set
  const hasMetricLimits =
    metric === "volume"
      ? typeof limits?.minVolumeL === "number" || typeof limits?.maxVolumeL === "number"
      : typeof limits?.minTempC === "number" || typeof limits?.maxTempC === "number";

  // Build two series: normal + alarm (alarm has values only where __alarm=true)
  const chartData = React.useMemo(() => {
    return (data ?? []).map((p) => {
      const v = (p as any)[key] as number;

      const alarm = !!p.__alarm && hasMetricLimits;

      return {
        ...p,
        __normal: alarm ? null : v,
        __alarmSeg: alarm ? v : null,
      };
    });
  }, [data, key, hasMetricLimits]);

  const minLine =
    metric === "volume" ? limits?.minVolumeL : limits?.minTempC;
  const maxLine =
    metric === "volume" ? limits?.maxVolumeL : limits?.maxTempC;

  return (
    <div className="h-[220px] sm:h-[280px] w-full rounded-2xl border border-white/10 bg-white/5 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
            minTickGap={18}
          />

          <YAxis
            tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
            width={36}
          />

          <Tooltip
            contentStyle={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 12,
              color: "white",
              backdropFilter: "blur(10px)",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.75)" }}
            formatter={(value: any) => [`${value} ${unit}`, metric === "volume" ? "Volume" : "Temp"]}
          />

          {/* ===== DOTTED LIMIT REFERENCE LINES (ONLY IF SET FOR THIS METRIC) ===== */}
          {hasMetricLimits && typeof minLine === "number" ? (
            <ReferenceLine
              y={minLine}
              stroke="rgba(255,80,80,0.85)"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={{
                value: metric === "volume" ? `Min Vol (${minLine}L)` : `Min Temp (${minLine}°C)`,
                position: "insideTopLeft",
                fill: "rgba(255,120,120,0.85)",
                fontSize: 10,
              }}
            />
          ) : null}

          {hasMetricLimits && typeof maxLine === "number" ? (
            <ReferenceLine
              y={maxLine}
              stroke="rgba(255,80,80,0.85)"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={{
                value: metric === "volume" ? `Max Vol (${maxLine}L)` : `Max Temp (${maxLine}°C)`,
                position: "insideTopLeft",
                fill: "rgba(255,120,120,0.85)",
                fontSize: 10,
              }}
            />
          ) : null}

          {/* ===== NORMAL LINE (CYAN) ===== */}
          <Line
            type="monotone"
            dataKey="__normal"
            stroke="rgba(120, 245, 255, 0.9)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />

          {/* ===== ALARM SEGMENTS (RED) + RED DOTS ===== */}
          <Line
            type="monotone"
            dataKey="__alarmSeg"
            stroke="rgba(255,80,80,0.95)"
            strokeWidth={2.8}
            connectNulls={false}
            dot={(props: any) => {
              const { cx, cy } = props;
              if (!hasMetricLimits) return null;
              if (typeof cx !== "number" || typeof cy !== "number") return null;
              return <circle cx={cx} cy={cy} r={3.8} fill="rgba(255,80,80,0.95)" />;
            }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}