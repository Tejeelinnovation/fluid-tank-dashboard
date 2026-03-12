"use client";

import { useEffect, useMemo, useState } from "react";
import BackgroundFX from "@/components/ui/BackgroundFX";
import TopHero from "@/components/ui/TopHero";

import type { AlarmMap, TankAlarmLimits } from "@/types/alarm";
import { loadAlarmMap, saveAlarmMap } from "@/lib/alarmStore";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** =========================
 *  LOCAL STORAGE (SETUP PERSISTENCE)
 *  ========================= */
const SETUP_KEY = "tankco_company_setup_v1";

type SavedSetup = {
  tanksCount: number;
  tankCapacities: number[];
  updatedAt: string;
};

function readSavedSetup(): SavedSetup | null {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as SavedSetup;

    if (!j || typeof j !== "object") return null;
    if (typeof j.tanksCount !== "number") return null;
    if (!Array.isArray(j.tankCapacities)) return null;

    const tanksCount = clamp(Math.round(j.tanksCount), 1, 20);
    const caps = j.tankCapacities.map((x) => clamp(Number(x) || 0, 0, 1_000_000));

    return {
      tanksCount,
      tankCapacities: Array.from({ length: tanksCount }, (_, i) => caps[i] ?? 1000),
      updatedAt: j.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function writeSavedSetup(tanksCount: number, tankCapacities: number[]) {
  try {
    const payload: SavedSetup = {
      tanksCount,
      tankCapacities,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SETUP_KEY, JSON.stringify(payload));
  } catch {}
}

/** =========================
 *  HELPERS (ALARM LIMITS)
 *  ========================= */
function tankKey(i: number) {
  return `Tank ${i + 1}`;
}

function numOrUndef(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function cleanLimits(l: TankAlarmLimits): TankAlarmLimits {
  // Remove invalid values and keep only numbers
  const out: TankAlarmLimits = {};
  if (typeof l.minVolumeL === "number") out.minVolumeL = l.minVolumeL;
  if (typeof l.maxVolumeL === "number") out.maxVolumeL = l.maxVolumeL;
  if (typeof l.minTempC === "number") out.minTempC = l.minTempC;
  if (typeof l.maxTempC === "number") out.maxTempC = l.maxTempC;
  return out;
}

function isEmptyLimits(l?: TankAlarmLimits) {
  if (!l) return true;
  return (
    typeof l.minVolumeL !== "number" &&
    typeof l.maxVolumeL !== "number" &&
    typeof l.minTempC !== "number" &&
    typeof l.maxTempC !== "number"
  );
}

export default function CompanySetupPage() {
  // defaults (overwritten on mount)
  const [tanksCount, setTanksCount] = useState(4);
  const [capacities, setCapacities] = useState<number[]>([1000, 1000, 1000, 1000]);

  const [applyAllCap, setApplyAllCap] = useState<number>(1000);

  // ✅ Alarm limits map (saved to alarmStore/localStorage)
  const [alarmMap, setAlarmMap] = useState<AlarmMap>({});

  // Apply-to-all alarm inputs
  const [applyAllMinVol, setApplyAllMinVol] = useState<string>("");
  const [applyAllMaxVol, setApplyAllMaxVol] = useState<string>("");
  const [applyAllMinTemp, setApplyAllMinTemp] = useState<string>("");
  const [applyAllMaxTemp, setApplyAllMaxTemp] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  /** ✅ LOAD SAVED SETUP + ALARMS ON PAGE OPEN */
  useEffect(() => {
    const saved = readSavedSetup();
    if (saved) {
      setTanksCount(saved.tanksCount);
      setCapacities(saved.tankCapacities);
      setApplyAllCap(saved.tankCapacities?.[0] ?? 1000);
    }

    // load alarm thresholds
    setAlarmMap(loadAlarmMap());
  }, []);

  const totalCapacity = useMemo(
    () => capacities.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0),
    [capacities]
  );

  function syncCapacitiesToCount(nextCount: number) {
    setCapacities((prev) =>
      Array.from({ length: nextCount }, (_, i) => prev[i] ?? 1000)
    );

    // also ensure alarmMap has entries for new tanks (optional)
    setAlarmMap((prev) => {
      const copy = { ...prev };
      // do not force-create; keep as-is. (Empty means “no limits set”.)
      // but we remove tanks beyond range to keep tidy
      Object.keys(copy).forEach((k) => {
        const m = k.match(/^Tank\s+(\d+)$/i);
        if (m) {
          const idx = Number(m[1]) - 1;
          if (idx >= nextCount) delete copy[k];
        }
      });
      return copy;
    });
  }

  function updateCapacity(i: number, val: number) {
    const v = clamp(Number(val) || 0, 0, 1_000_000);
    setCapacities((prev) => {
      const copy = [...prev];
      copy[i] = v;
      return copy;
    });
  }

  function applyToAllCap() {
    const v = clamp(Number(applyAllCap) || 0, 0, 1_000_000);
    setCapacities(Array.from({ length: tanksCount }, () => v));
  }

  function updateTankLimit(i: number, patch: Partial<TankAlarmLimits>) {
    const key = tankKey(i);
    setAlarmMap((prev) => {
      const current = (prev[key] ?? {}) as TankAlarmLimits;
      const next: TankAlarmLimits = cleanLimits({ ...current, ...patch });
      const copy = { ...prev };

      if (isEmptyLimits(next)) {
        delete copy[key]; // no limits -> remove entry
      } else {
        copy[key] = next;
      }
      return copy;
    });
  }

  function applyLimitsToAll() {
    const minVol = numOrUndef(applyAllMinVol);
    const maxVol = numOrUndef(applyAllMaxVol);
    const minTemp = numOrUndef(applyAllMinTemp);
    const maxTemp = numOrUndef(applyAllMaxTemp);

    setAlarmMap((prev) => {
      const copy: AlarmMap = { ...prev };
      for (let i = 0; i < tanksCount; i++) {
        const key = tankKey(i);
        const current = (copy[key] ?? {}) as TankAlarmLimits;
        const next = cleanLimits({
          ...current,
          ...(minVol === undefined ? {} : { minVolumeL: minVol }),
          ...(maxVol === undefined ? {} : { maxVolumeL: maxVol }),
          ...(minTemp === undefined ? {} : { minTempC: minTemp }),
          ...(maxTemp === undefined ? {} : { maxTempC: maxTemp }),
        });

        if (isEmptyLimits(next)) delete copy[key];
        else copy[key] = next;
      }
      return copy;
    });
  }

  async function saveAndGo() {
    setMsg(null);
    setSaving(true);

    const cleanCount = clamp(Math.round(tanksCount), 1, 20);
    const cleanCaps = Array.from({ length: cleanCount }, (_, i) =>
      clamp(Number(capacities[i] ?? 1000) || 0, 0, 1_000_000)
    );

    // ✅ Persist locally
    writeSavedSetup(cleanCount, cleanCaps);

    // ✅ Persist alarm limits locally (your dashboard reads from here)
    saveAlarmMap(alarmMap);

    // ✅ Also save to your API
    const res = await fetch("/api/company/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tanksCount: cleanCount, tankCapacities: cleanCaps }),
    });

    const j = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setMsg({ type: "err", text: j?.error ?? "Failed to save settings" });
      return;
    }

    setMsg({ type: "ok", text: "Saved ✅ Redirecting…" });
    window.location.href = "/company/dashboard";
  }

  async function uploadCSV(file: File) {
    setMsg(null);
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/company/upload-csv", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    setUploading(false);

    if (!res.ok) {
      setMsg({ type: "err", text: j?.error ?? "CSV upload failed" });
      return;
    }

    setMsg({ type: "ok", text: "CSV uploaded ✅" });
  }

  return (
    <main className="relative min-h-screen text-white overflow-hidden">
      <BackgroundFX />

      <div className="relative">
        <TopHero
          brand="Tankco."
          ctaLabel="Dashboard"
          onCtaClickHref="/company/dashboard"
          eyebrow="COMPANY SETUP"
          titleLine1="Configure"
          titleLine2="Your Tanks"
          subtitle="Set tank count, capacities, and alarm thresholds."
          navItems={[
            { label: "Setup", href: "/company/setup" },
            { label: "Dashboard", href: "/company/dashboard" },
          ]}
        />

        <section className="mx-auto max-w-6xl px-6 pb-20 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Controls */}
            <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <h2 className="text-lg font-semibold">Tank Settings</h2>
              <p className="mt-1 text-sm text-white/55">
                Choose tank count, capacities, and alarm thresholds.
              </p>

              {/* Tank count */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-white/70">Number of tanks</label>
                  <div className="text-sm font-semibold">{tanksCount}</div>
                </div>

                <input
                  type="range"
                  min={1}
                  max={20}
                  value={tanksCount}
                  onChange={(e) => {
                    const n = clamp(Number(e.target.value), 1, 20);
                    setTanksCount(n);
                    syncCapacitiesToCount(n);
                  }}
                  className="mt-3 w-full"
                />

                <div className="mt-3 text-xs text-white/50">
                  Total capacity:{" "}
                  <span className="text-white/80">{totalCapacity.toLocaleString()}</span> L
                </div>
              </div>

              {/* Apply all capacities */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium">Quick fill capacity</div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={applyAllCap}
                    onChange={(e) => setApplyAllCap(Number(e.target.value))}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none"
                    placeholder="Capacity for all tanks (L)"
                  />
                  <button
                    onClick={applyToAllCap}
                    className="rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Apply all alarm thresholds */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium">Apply alarm limits to all tanks</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    value={applyAllMinVol}
                    onChange={(e) => setApplyAllMinVol(e.target.value)}
                    placeholder="Min Vol (L)"
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs outline-none"
                  />
                  <input
                    value={applyAllMaxVol}
                    onChange={(e) => setApplyAllMaxVol(e.target.value)}
                    placeholder="Max Vol (L)"
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs outline-none"
                  />
                  <input
                    value={applyAllMinTemp}
                    onChange={(e) => setApplyAllMinTemp(e.target.value)}
                    placeholder="Min Temp (°C)"
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs outline-none"
                  />
                  <input
                    value={applyAllMaxTemp}
                    onChange={(e) => setApplyAllMaxTemp(e.target.value)}
                    placeholder="Max Temp (°C)"
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs outline-none"
                  />
                </div>

                <button
                  onClick={applyLimitsToAll}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs text-white/90 hover:bg-white/15"
                >
                  Apply limits to all tanks
                </button>

                <div className="mt-2 text-[11px] text-white/50">
                  Leave a field blank to not set that limit.
                </div>
              </div>

              {/* CSV upload */}
              <div className="mt-6">
                <div className="text-sm font-medium">CSV Upload (optional)</div>
                <p className="mt-1 text-xs text-white/55">
                  CSV headers: <span className="text-white/80">TankName, Level, Temp</span>
                </p>

                <input
                  type="file"
                  accept=".csv"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCSV(f);
                  }}
                  className="mt-3 block w-full text-xs text-white/70 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-semibold file:text-black hover:file:opacity-90"
                />
                {uploading && <div className="mt-2 text-xs text-white/60">Uploading…</div>}
              </div>

              {msg && (
                <div
                  className={[
                    "mt-6 rounded-xl border px-4 py-3 text-sm",
                    msg.type === "ok"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border-red-500/30 bg-red-500/10 text-red-300",
                  ].join(" ")}
                >
                  {msg.text}
                </div>
              )}

              <button
                onClick={saveAndGo}
                disabled={saving}
                className="mt-6 w-full rounded-2xl bg-white text-black py-3 font-semibold disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save & Go to Dashboard"}
              </button>

              <a
                href="/company/dashboard"
                className="mt-3 block text-center text-xs text-white/60 hover:text-white/80"
              >
                Skip → Open Dashboard
              </a>
            </div>

            {/* Right: Tanks grid (capacities + limits per tank) */}
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Per Tank Settings</h2>
                  <p className="mt-1 text-sm text-white/55">
                    Capacity and alarm thresholds. Empty limits = no alarms for that metric.
                  </p>
                </div>
                <div className="text-xs text-white/50">{tanksCount} tanks</div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: tanksCount }).map((_, i) => {
                  const key = tankKey(i);
                  const lim = (alarmMap[key] ?? {}) as TankAlarmLimits;

                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{key}</div>
                        <div className="text-xs text-white/50">
                          {isEmptyLimits(lim) ? "No limits" : "Limits set"}
                        </div>
                      </div>

                      {/* Capacity */}
                      <div className="mt-3">
                        <div className="text-xs text-white/55">Capacity (L)</div>
                        <input
                          type="number"
                          value={capacities[i] ?? 1000}
                          onChange={(e) => updateCapacity(i, Number(e.target.value))}
                          className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs outline-none"
                        />
                      </div>

                      {/* Volume limits */}
                      <div className="mt-3">
                        <div className="text-xs text-white/55">Volume limits (L)</div>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <input
                            value={typeof lim.minVolumeL === "number" ? String(lim.minVolumeL) : ""}
                            onChange={(e) =>
                              updateTankLimit(i, {
                                minVolumeL: e.target.value === "" ? undefined : Number(e.target.value),
                              })
                            }
                            placeholder="Min"
                            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs outline-none"
                          />
                          <input
                            value={typeof lim.maxVolumeL === "number" ? String(lim.maxVolumeL) : ""}
                            onChange={(e) =>
                              updateTankLimit(i, {
                                maxVolumeL: e.target.value === "" ? undefined : Number(e.target.value),
                              })
                            }
                            placeholder="Max"
                            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs outline-none"
                          />
                        </div>
                      </div>

                      {/* Temp limits */}
                      <div className="mt-3">
                        <div className="text-xs text-white/55">Temp limits (°C)</div>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <input
                            value={typeof lim.minTempC === "number" ? String(lim.minTempC) : ""}
                            onChange={(e) =>
                              updateTankLimit(i, {
                                minTempC: e.target.value === "" ? undefined : Number(e.target.value),
                              })
                            }
                            placeholder="Min"
                            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs outline-none"
                          />
                          <input
                            value={typeof lim.maxTempC === "number" ? String(lim.maxTempC) : ""}
                            onChange={(e) =>
                              updateTankLimit(i, {
                                maxTempC: e.target.value === "" ? undefined : Number(e.target.value),
                              })
                            }
                            placeholder="Max"
                            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div className="mt-3 text-[11px] text-white/45">
                        Tip: Leave blank to disable that limit.
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/55">
                <div className="font-semibold text-white/80">How alarms work</div>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Limits are saved locally and used by dashboard to turn tanks red.</li>
                  <li>Graph shows dotted min/max lines and red segments only for the selected metric.</li>
                  <li>If only temp limits are set, volume tab stays normal (no red).</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}