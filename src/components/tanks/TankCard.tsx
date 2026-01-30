"use client";

import { useEffect, useMemo, useState } from "react";
import FluidTank from "./FluidTankClient";

type TankCardProps = {
  name: string;
  level: number;
  variant?: "rect" | "cylinder";
  temperatureC?: number;
  capacityLiters?: number;
};

export default function TankCard({
  name,
  level,
  variant = "rect",
  temperatureC,
  capacityLiters,
}: TankCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tempText = useMemo(() => {
    if (!mounted) return "--";
    if (typeof temperatureC !== "number" || Number.isNaN(temperatureC)) return "--";
    return temperatureC.toFixed(1);
  }, [mounted, temperatureC]);

  return (
    <div
      className="rounded-2xl bg-white/5 border border-white/10 p-4
                 shadow-lg hover:bg-white/7 transition"
    >
      <div className="flex items-start justify-between mb-3">
        {/* Left: name + temperature */}
        <div>
          <h2 className="font-semibold text-white">{name}</h2>

          {/* Stable SSR -> no hydration mismatch */}
          <p className="text-xs text-white/55 mt-0.5" suppressHydrationWarning>
            Temp: {tempText}°C
          </p>
        </div>

        {/* Right: live */}
        <span className="text-xs text-white/60">Live</span>
      </div>

      <div className="flex justify-center">
        <FluidTank
          level={level}
          capacityLiters={capacityLiters ?? 1000}
          unit="L"
          variant={variant}
        />
      </div>
    </div>
  );
}
