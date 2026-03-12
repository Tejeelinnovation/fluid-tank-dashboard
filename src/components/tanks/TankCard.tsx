"use client";

import { useEffect, useMemo, useState } from "react";
import FluidTank from "./FluidTankClient";
import type { TankAlarmLimits } from "@/types/alarm";

type TankCardProps = {
  id?: string;
  name: string;
  level: number; // percent 0..100
  variant?: "rect" | "cylinder";
  temperatureC?: number;
  capacityLiters?: number;
  limits?: TankAlarmLimits;
  onOpen?: () => void;
};

export default function TankCard({
  id,
  name,
  level,
  variant = "rect",
  temperatureC,
  capacityLiters,
  limits,
  onOpen,
}: TankCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tempText = useMemo(() => {
    if (!mounted) return "--";
    if (typeof temperatureC !== "number" || Number.isNaN(temperatureC)) return "--";
    return temperatureC.toFixed(1);
  }, [mounted, temperatureC]);

  const nowVol = useMemo(() => {
    const cap = typeof capacityLiters === "number" ? capacityLiters : 1000;
    return Math.round((Math.max(0, Math.min(100, level)) / 100) * cap);
  }, [level, capacityLiters]);

  const alarmNow =
    !!limits &&
    (
      (typeof limits.minVolumeL === "number" && nowVol < limits.minVolumeL) ||
      (typeof limits.maxVolumeL === "number" && nowVol > limits.maxVolumeL) ||
      (typeof limits.minTempC === "number" &&
        typeof temperatureC === "number" &&
        temperatureC < limits.minTempC) ||
      (typeof limits.maxTempC === "number" &&
        typeof temperatureC === "number" &&
        temperatureC > limits.maxTempC)
    );

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "text-left w-full rounded-2xl p-4 shadow-lg transition",
        "bg-white/5 border backdrop-blur",
        alarmNow ? "border-red-500/40 hover:bg-red-500/10" : "border-white/10 hover:bg-white/7",
      ].join(" ")}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-semibold text-white">{name}</h2>
          <p className="text-xs text-white/55 mt-0.5" suppressHydrationWarning>
            Temp: {tempText}°C
          </p>
        </div>

        <span className="text-xs text-white/60">{alarmNow ? "Alarm" : "Live"}</span>
      </div>

      <div className="flex justify-center">
        <FluidTank
          level={level}
          capacityLiters={capacityLiters ?? 1000}
          unit="L"
          variant={variant}
          alarm={alarmNow}
        />
      </div>
    </button>
  );
}