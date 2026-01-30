"use client";

import { useEffect, useState } from "react";
import BackgroundFX from "@/components/ui/BackgroundFX";
import TopHero from "@/components/ui/TopHero";

type DataMode = "generated" | "csv" | "disabled";

type Company = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;

  companyLoginId: string;
  tanksCount: number;
  dataMode: DataMode;
};

export default function AdminDashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [companyLoginId, setCompanyLoginId] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  async function load() {
    setErr("");
    setLoadingList(true);
    const res = await fetch("/api/companies", { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    setLoadingList(false);
    if (!res.ok) {
      setErr(j?.error ?? "Failed to load companies");
      setCompanies([]);
      return;
    }
    setCompanies(j.companies ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addCompany() {
    setErr("");
    setTempPassword(null);
    setLoading(true);

    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, companyLoginId, logoUrl }),
    });

    const j = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErr(j?.error ?? "Failed to create company");
      return;
    }

    setTempPassword(j?.tempPassword ?? null);
    setName("");
    setCompanyLoginId("");
    setLogoUrl("");
    await load();
  }

  async function removeCompany(id: string) {
    setErr("");
    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j?.error ?? "Failed to delete");
      return;
    }
    await load();
  }

  async function setMode(companyId: string, dataMode: DataMode) {
    setErr("");
    const res = await fetch("/api/admin/company-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, dataMode }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j?.error ?? "Failed to update mode");
      return;
    }
    await load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/admin/login";
  }

  return (
    <main className="relative min-h-screen text-white overflow-hidden">
      <BackgroundFX />

      <div className="relative">
        <TopHero
          brand="Tankco."
          ctaLabel="Logout"
          onCtaClickHref="/admin/login"
          eyebrow="ADMIN PANEL"
          titleLine1="Company"
          titleLine2="Management"
          subtitle="Create companies, issue temporary credentials, and control data mode."
          navItems={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Companies", href: "#companies" },
          ]}
        />

        <div className="mx-auto max-w-6xl px-6 -mt-6">
          <button
            onClick={logout}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            Logout
          </button>
        </div>

        <section id="companies" className="mx-auto max-w-6xl px-6 pb-20 pt-10">
          {err && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create card */}
            <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <h2 className="text-lg font-semibold">Create Company</h2>
              <p className="mt-1 text-sm text-white/55">
                Generate a company login ID + temporary password.
              </p>

              <div className="mt-6 space-y-3">
                <div>
                  <label className="text-xs text-white/60">Company name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Akshar Enterprise"
                    className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none
                               placeholder:text-white/25 focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/60">Company Login ID (unique)</label>
                  <input
                    value={companyLoginId}
                    onChange={(e) => setCompanyLoginId(e.target.value)}
                    placeholder="e.g. akshar_admin"
                    className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none
                               placeholder:text-white/25 focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/60">Logo URL (optional)</label>
                  <input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none
                               placeholder:text-white/25 focus:border-white/20"
                  />
                </div>

                <button
                  disabled={loading || !name || !companyLoginId}
                  onClick={addCompany}
                  className="mt-2 w-full rounded-2xl bg-white text-black py-3 font-semibold
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating…" : "Create"}
                </button>

                {tempPassword && (
                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                    <div className="text-xs text-emerald-200/80">Temporary password</div>
                    <div className="mt-1 font-mono text-sm text-emerald-100">
                      {tempPassword}
                    </div>
                    <div className="mt-2 text-xs text-emerald-200/60">
                      Copy now and share with the company. It won’t be shown again.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* List card */}
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Companies</h2>
                  <p className="mt-1 text-sm text-white/55">
                    Manage tenants and their data mode.
                  </p>
                </div>
                <div className="text-xs text-white/50">
                  {loadingList ? "Loading…" : `${companies.length} total`}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {companies.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3
                               rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {c.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.logoUrl}
                          alt={c.name}
                          className="h-9 w-24 object-contain rounded bg-white/5 border border-white/10"
                        />
                      ) : (
                        <div className="h-9 w-24 rounded bg-white/5 border border-white/10 grid place-items-center text-[10px] text-white/60">
                          NO LOGO
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{c.name}</div>
                        <div className="text-xs text-white/55 truncate">
                          Login ID: <span className="text-white/80">{c.companyLoginId}</span>
                          <span className="mx-2">•</span>
                          Tanks: <span className="text-white/80">{c.tanksCount ?? 0}</span>
                        </div>
                        <div className="text-xs text-white/45 truncate">
                          Public: <span className="text-white/70">/c/{c.slug}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <select
                        value={c.dataMode}
                        onChange={(e) => setMode(c.id, e.target.value as DataMode)}
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"
                        title="Data mode"
                      >
                        <option value="generated">Generated</option>
                        <option value="csv">CSV</option>
                        <option value="disabled">Disabled</option>
                      </select>

                      <a
                        href={`/c/${c.slug}`}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
                      >
                        Open
                      </a>

                      <button
                        onClick={() => removeCompany(c.id)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {!loadingList && companies.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-10 text-center text-sm text-white/55">
                    No companies created yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
