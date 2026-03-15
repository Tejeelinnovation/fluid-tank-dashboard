"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import TankGrid, { type Tank, type AlarmEvent } from "@/components/tanks/TankGrid";
import type { TankAlarmLimits } from "@/types/alarm";
import TopHero from "@/components/ui/TopHero";
import BackgroundFX from "@/components/ui/BackgroundFX";
import TankDetailsModal from "@/components/tanks/TankDetailsModal";
import {
  readCompanySetupClient,
  getVolumeMetric,
  getTemperatureMetric,
  getVolumePercentFromMetric,
  getTemperatureCFromMetric,
  getVolumeLitersFromMetric,
} from "@/lib/companySetupClient";

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

export default function CompanyDashboardPage() {
  const params = useParams();
  const slug = String(params?.slug ?? "");

  const [tanks, setTanks] = useState<Tank[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [alarms, setAlarms] = useState<AlarmEvent[]>([]);
  const [openTankId, setOpenTankId] = useState<string | null>(null);
  const [alarmMap, setAlarmMap] = useState<Record<string, TankAlarmLimits>>({});

  const modalTank = useMemo(() => {
    if (!openTankId) return null;
    return tanks.find((t) => String(t.id) === String(openTankId)) ?? null;
  }, [tanks, openTankId]);

  async function load() {
    if (!slug) return;

    setErr("");

    try {
      const setup = readCompanySetupClient(slug);

      const res = await fetch("/api/influx/latest", { cache: "no-store" });
      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(j?.error || "Failed to load Influx data");
        setTanks([]);
        return;
      }

      const rows = Array.isArray(j?.rows) ? j.rows : [];

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
    } catch {
      setErr("Network error");
      setTanks([]);
    } finally {
      setLoading(false);
    }
  }

  async function logoutCompany() {
    await fetch("/api/company/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/company/login";
  }

  useEffect(() => {
    if (!slug) return;

    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const refresh = () => setAlarmMap(loadAlarmMapForSlug(slug));
    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("tankco:alarm-limits-changed", refresh as EventListener);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("tankco:alarm-limits-changed", refresh as EventListener);
    };
  }, [slug]);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <BackgroundFX />

      <div className="relative">
        <TopHero
          brand="Tankco."
          ctaLabel="Logout"
          onCtaClickHref="/company/login"
          eyebrow="COMPANY DASHBOARD"
          titleLine1="Tank"
          titleLine2="Dashboard"
          subtitle="Live values from InfluxDB using fixed volume and temperature channels configured by the admin."
          navItems={[
            { label: "Setup", href: `/company/${slug}/setup` },
            { label: "Tanks", href: "#tanks" },
          ]}
        />

        <div className="mx-auto -mt-6 max-w-6xl px-6">
          <button
            onClick={logoutCompany}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            Logout
          </button>
        </div>

        <section id="tanks" className="mx-auto max-w-6xl px-6 pb-20 pt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white md:text-2xl">Live Tanks</h2>
              <p className="mt-1 text-sm text-white/55">
                Showing current configured volume and temperature channels from InfluxDB.
              </p>
            </div>

            <div className="text-xs text-white/50">
              {loading ? "Loading…" : "Updated every 15s"}
            </div>
          </div>

          {err ? (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {err}
            </div>
          ) : null}

          {alarms.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 backdrop-blur-xl">
              <div className="text-sm font-semibold text-red-200">Alarm Events</div>
              <div className="mt-2 space-y-2 text-xs text-white/70">
                {alarms.map((a, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="text-white/90">
                      <span className="font-semibold">{a.tankName}</span>{" "}
                      <span className="text-red-200">— {a.reason}</span>
                    </div>
                    <div className="text-white/55">
                      Value: {typeof a.volumeL === "number" ? `${a.volumeL}` : "--"} • Temp:{" "}
                      {typeof a.temperatureC === "number" ? `${a.temperatureC}°C` : "--"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <TankGrid
              tanks={tanks}
              loading={loading}
              alarmMap={alarmMap}
              onAlarmList={setAlarms}
              onOpenTank={(t) => setOpenTankId(String(t.id))}
            />
          </div>
        </section>
      </div>

      <TankDetailsModal
        open={!!openTankId}
        onClose={() => setOpenTankId(null)}
        tank={modalTank}
        alarmMap={alarmMap}
      />
    </main>
  );
}
