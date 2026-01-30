"use client";

import * as React from "react";
import TankCard from "./TankCard";

export type Tank = {
  id: string;
  name: string;
  level: number; // expected 0..100 (percent)
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
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function TankGrid({
  tanks = [],
  title,
  loading = false,
  disabled = false,
  emptyText = "No tank data available",
}: TankGridProps) {
  if (disabled) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="text-base font-semibold text-white">Dashboard Disabled</div>
        <div className="mt-1 text-sm text-white/60">
          Contact admin to enable data access.
        </div>
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

          return (
            <TankCard
              key={id}
              name={name}
              level={level}
              temperatureC={temperatureC}
              capacityLiters={capacityLiters}
              variant={tank.variant ?? "rect"}
            />
          );
        })}
      </div>
    </div>
  );
}
