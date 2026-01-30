"use client";

import { useEffect, useState } from "react";

type Company = { id: string; name: string; logoUrl?: string };

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    const res = await fetch("/api/companies");
    const j = await res.json();
    setCompanies(j.companies ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addCompany() {
    setErr("");
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, logoUrl }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error ?? "Failed");
      return;
    }

    setName("");
    setLogoUrl("");
    await load();
  }

  async function removeCompany(id: string) {
    setErr("");
    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error ?? "Failed");
      return;
    }
    await load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Companies</h1>
            <p className="mt-1 text-sm text-white/60">
              Add/remove companies (sub-admin tenants).
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Add company */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-sm font-semibold text-white">Add Company</h2>

            <div className="mt-3 space-y-3">
              <input
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                placeholder="Company name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                placeholder="Logo URL (optional)"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />

              {err && <div className="text-sm text-red-300">{err}</div>}

              <button
                onClick={addCompany}
                className="w-full rounded-xl bg-white py-3 font-semibold text-black"
              >
                Add
              </button>
            </div>
          </div>

          {/* Company list */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-sm font-semibold text-white">All Companies</h2>

            <div className="mt-4 space-y-3">
              {companies.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-8 text-center text-sm text-white/60">
                  No companies yet.
                </div>
              ) : (
                companies.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      {c.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.logoUrl}
                          alt={c.name}
                          className="h-7 w-20 rounded bg-white/5 object-contain"
                        />
                      ) : (
                        <div className="flex h-7 w-20 items-center justify-center rounded bg-white/5 text-[10px] text-white/70">
                          NO LOGO
                        </div>
                      )}

                      <div className="text-sm font-medium text-white">
                        {c.name}
                      </div>
                    </div>

                    <button
                      onClick={() => removeCompany(c.id)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {err && <div className="mt-3 text-sm text-red-300">{err}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
