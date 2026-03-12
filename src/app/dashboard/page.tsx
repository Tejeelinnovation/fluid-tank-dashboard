"use client";

import { useEffect, useState } from "react";
import TankGrid, { Tank } from "@/components/tanks/TankGrid";
import type { AlarmEvent } from "@/components/tanks/TankGrid";

import TopHero from "@/components/ui/TopHero";
import BackgroundFX from "@/components/ui/BackgroundFX";

export default function CompanyDashboardPage() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ alarms computed inside TankGrid (based on your saved limits)
  const [alarms, setAlarms] = useState<AlarmEvent[]>([]);

  async function load() {
    setErr("");
    try {
      const res = await fetch("/api/company/tanks", { cache: "no-store" });
      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(j?.error || "Failed to load");
        setTanks([]);
        return;
      }

      setTanks(j.tanks ?? []);
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
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="relative min-h-screen text-white overflow-hidden">
      <BackgroundFX />

      <div className="relative">
        <TopHero
          brand="Tankco."
          ctaLabel="Logout"
          onCtaClickHref="/company/login"
          eyebrow="COMPANY DASHBOARD"
          titleLine1="Tank"
          titleLine2="Dashboard"
          subtitle="Live levels from CSV / generated data, based on your setup."
          navItems={[
            { label: "Setup", href: "/company/setup" },
            { label: "Tanks", href: "#tanks" },
          ]}
        />

        {/* Extra Logout button (your existing pattern) */}
        <div className="mx-auto max-w-6xl px-6 -mt-6">
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
              <h2 className="text-xl md:text-2xl font-semibold text-white">
                Live Tanks
              </h2>
              <p className="mt-1 text-sm text-white/55">
                Showing current levels based on company setup.
              </p>
            </div>

            <div className="text-xs text-white/50">
              {loading ? "Loading…" : "Updated in real-time"}
            </div>
          </div>

          {err && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {err}
            </div>
          )}

          {/* ✅ Alarm Events List */}
          {alarms.length > 0 && (
            <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 backdrop-blur-xl">
              <div className="text-sm font-semibold text-red-200">
                Alarm Events
              </div>
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
                      Vol: {typeof a.volumeL === "number" ? `${a.volumeL} L` : "--"} • Temp:{" "}
                      {typeof a.temperatureC === "number" ? `${a.temperatureC}°C` : "--"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <TankGrid
              tanks={tanks}
              loading={loading}
              onAlarmList={setAlarms}
              // later: onOpenTank={(tank) => setModalTank(tank)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}