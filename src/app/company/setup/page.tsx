"use client";

import { useMemo, useState } from "react";
import BackgroundFX from "@/components/ui/BackgroundFX";
import TopHero from "@/components/ui/TopHero";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function CompanySetupPage() {
  const [tanksCount, setTanksCount] = useState(4);
  const [capacities, setCapacities] = useState<number[]>([1000, 1000, 1000, 1000]);

  const [applyAllCap, setApplyAllCap] = useState<number>(1000);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const totalCapacity = useMemo(
    () => capacities.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0),
    [capacities]
  );

  function syncCapacitiesToCount(nextCount: number) {
    setCapacities((prev) =>
      Array.from({ length: nextCount }, (_, i) => prev[i] ?? 1000)
    );
  }

  function updateCapacity(i: number, val: number) {
    const v = clamp(Number(val) || 0, 0, 1_000_000);
    setCapacities((prev) => {
      const copy = [...prev];
      copy[i] = v;
      return copy;
    });
  }

  function applyToAll() {
    const v = clamp(Number(applyAllCap) || 0, 0, 1_000_000);
    setCapacities(Array.from({ length: tanksCount }, () => v));
  }

  async function saveAndGo() {
    setMsg(null);
    setSaving(true);

    const res = await fetch("/api/company/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tanksCount, tankCapacities: capacities }),
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

  // Optional: CSV upload (only works if you created /api/company/upload-csv)
  async function uploadCSV(file: File) {
    setMsg(null);
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/company/upload-csv", {
      method: "POST",
      body: fd,
    });

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
          subtitle="Select tank count and capacity per tank. Upload CSV for live values."
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
                Choose how many tanks to show and set capacities in liters.
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

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const n = clamp(tanksCount - 1, 1, 20);
                      setTanksCount(n);
                      syncCapacitiesToCount(n);
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={tanksCount}
                    onChange={(e) => {
                      const n = clamp(Number(e.target.value), 1, 20);
                      setTanksCount(n);
                      syncCapacitiesToCount(n);
                    }}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none"
                  />
                  <button
                    onClick={() => {
                      const n = clamp(tanksCount + 1, 1, 20);
                      setTanksCount(n);
                      syncCapacitiesToCount(n);
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    +
                  </button>
                </div>

                <div className="mt-3 text-xs text-white/50">
                  Total capacity: <span className="text-white/80">{totalCapacity.toLocaleString()}</span> L
                </div>
              </div>

              {/* Apply all */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium">Quick fill</div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={applyAllCap}
                    onChange={(e) => setApplyAllCap(Number(e.target.value))}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none"
                    placeholder="Capacity for all tanks (L)"
                  />
                  <button
                    onClick={applyToAll}
                    className="rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold"
                  >
                    Apply
                  </button>
                </div>
                <div className="mt-2 text-xs text-white/55">
                  Applies the same capacity to every tank.
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

                {uploading && (
                  <div className="mt-2 text-xs text-white/60">Uploading…</div>
                )}
              </div>

              {/* messages */}
              {msg && (
                <div
                  className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                    msg.type === "ok"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {msg.text}
                </div>
              )}

              {/* save */}
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

            {/* Right: Capacity grid */}
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Tank Capacities</h2>
                  <p className="mt-1 text-sm text-white/55">
                    Set capacity per tank. This is used for volume display and level conversions.
                  </p>
                </div>
                <div className="text-xs text-white/50">
                  {tanksCount} tanks
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: tanksCount }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Tank {i + 1}</div>
                      <div className="text-xs text-white/50">Capacity</div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="number"
                        value={capacities[i] ?? 1000}
                        onChange={(e) => updateCapacity(i, Number(e.target.value))}
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none"
                      />
                      <span className="text-xs text-white/60">L</span>
                    </div>

                    <div className="mt-2 text-xs text-white/50">
                      Tip: keep consistent with actual tank size.
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/55">
                <div className="font-semibold text-white/80">Notes</div>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li><span className="text-white/80">Level</span> and <span className="text-white/80">Temp</span> come from CSV (or generated mode).</li>
                  <li><span className="text-white/80">Capacity</span> is always taken from your setup.</li>
                  <li>If admin sets your data mode to <span className="text-white/80">Disabled</span>, dashboard won’t show live tanks.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
