"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import TankGrid, { type AlarmEvent, type Tank } from "./TankGrid";
import TankDetailsModal from "./TankDetailsModal";
import {
  readCompanySetupClient,
  getVolumeMetric,
  getTemperatureMetric,
  getVolumePercentFromMetric,
  getTemperatureCFromMetric,
  getVolumeLitersFromMetric,
} from "@/lib/companySetupClient";
import { loadAlarmMap } from "@/lib/alarmStore";
import type { TankAlarmLimits } from "@/types/alarm";

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function getAlarmKey(slug: string) {
  return `tankco_alarm_map_${slug}`;
}

function loadAlarmMapForSlug(slug: string): Record<string, TankAlarmLimits> {
  try {
    const raw = localStorage.getItem(getAlarmKey(slug));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export default function TankDashboardLive() {
  const params = useParams();
  const slug = String(params?.slug ?? "");

  const [loading, setLoading] = React.useState(true);
  const [tanks, setTanks] = React.useState<Tank[]>([]);
  const [selectedTank, setSelectedTank] = React.useState<Tank | null>(null);
  const [alarmMap, setAlarmMap] = React.useState<Record<string, TankAlarmLimits>>({});
  const [alarmEvents, setAlarmEvents] = React.useState<AlarmEvent[]>([]);

  const loadAll = React.useCallback(async () => {
    if (!slug) return;

    try {
      const setup = readCompanySetupClient(slug);

      const res = await fetch("/api/influx/latest", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      const rows = Array.isArray(data?.rows) ? data.rows : [];

      const mapped: Tank[] = setup.tanks.map((cfg) => {
        const volumeMetric = getVolumeMetric(cfg);
        const temperatureMetric = getTemperatureMetric(cfg);

        const volumeRow = rows.find((r: any) => r.channel === volumeMetric.channel);
        const temperatureRow = rows.find((r: any) => r.channel === temperatureMetric.channel);

        const volumeRaw = toNumber(volumeRow?._value);
        const temperatureRaw = toNumber(temperatureRow?._value);

        const level =
          volumeRaw !== undefined
            ? getVolumePercentFromMetric(volumeRaw, cfg, volumeMetric)
            : 0;

        const volumeLiters =
          volumeRaw !== undefined
            ? getVolumeLitersFromMetric(volumeRaw, cfg, volumeMetric)
            : 0;

        const temperatureC =
          temperatureRaw !== undefined
            ? getTemperatureCFromMetric(temperatureRaw, temperatureMetric)
            : undefined;

        return {
          id: cfg.id,
          name: cfg.name,
          level,
          temperatureC,
          capacityLiters: cfg.capacityLiters,
          variant: "rect",
          volumeChannel: volumeMetric.channel,
          temperatureChannel: temperatureMetric.channel,
          volumeUnit: volumeMetric.unit,
          temperatureUnit: temperatureMetric.unit,
          volumeValue:
            volumeRaw !== undefined
              ? Math.round(volumeRaw * 100) / 100
              : Math.round(volumeLiters),
          temperatureValue:
            temperatureRaw !== undefined
              ? Math.round(temperatureRaw * 10) / 10
              : undefined,
        };
      });

      setTanks(mapped);
      setAlarmMap(loadAlarmMapForSlug(slug));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setTanks([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  React.useEffect(() => {
    if (!slug) return;

    loadAll();

    const onStorage = () => {
      setAlarmMap(loadAlarmMapForSlug(slug));
    };

    const onAlarmChanged = () => {
      setAlarmMap(loadAlarmMapForSlug(slug));
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("tankco:alarm-limits-changed", onAlarmChanged as EventListener);

    const interval = window.setInterval(loadAll, 10000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "tankco:alarm-limits-changed",
        onAlarmChanged as EventListener
      );
      window.clearInterval(interval);
    };
  }, [slug, loadAll]);

  return (
    <>
      <TankGrid
        tanks={tanks}
        loading={loading}
        alarmMap={alarmMap}
        onOpenTank={(tank) => setSelectedTank(tank)}
        onAlarmList={setAlarmEvents}
      />

      <TankDetailsModal
        open={!!selectedTank}
        onClose={() => setSelectedTank(null)}
        tank={selectedTank}
        alarmMap={alarmMap}
      />

      {alarmEvents.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="text-sm font-semibold text-white">Active alarms</div>
          <div className="mt-3 space-y-2">
            {alarmEvents.slice(0, 8).map((a) => (
              <div
                key={`${a.tankId}-${a.timeIso}-${a.reason}`}
                className="rounded-xl border border-red-500/20 bg-black/20 px-3 py-2 text-sm text-white/85"
              >
                <span className="font-medium">{a.tankName}</span>
                <span className="mx-2 text-white/30">•</span>
                {a.reason}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
