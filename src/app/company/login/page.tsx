"use client";

import { useState } from "react";
import BackgroundFX from "@/components/ui/BackgroundFX";
import TopHero from "@/components/ui/TopHero";

export default function CompanyLoginPage() {
  const [companyLoginId, setCompanyLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await fetch("/api/company/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyLoginId, password }),
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLoading(false);
        setErr(j?.error ?? "Login failed");
        return;
      }

      const slug = String(j?.slug ?? "").trim();

      if (!slug) {
        setLoading(false);
        setErr("Login succeeded but company slug is missing");
        return;
      }

      window.location.href = `/company/${slug}/setup`;
    } catch {
      setErr("Login failed");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <BackgroundFX />

      <div className="relative">
        <TopHero
          brand="Tankco."
          ctaLabel="Admin"
          onCtaClickHref="/admin/login"
          eyebrow="COMPANY ACCESS"
          titleLine1="Company"
          titleLine2="Login"
          subtitle="Use the Company Login ID and temporary password provided by admin."
          navItems={[
            { label: "Home", href: "/" },
            { label: "Company Login", href: "/company/login" },
          ]}
        />

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-10">
          <div className="mx-auto max-w-md">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Sign in</h2>
                  <p className="mt-1 text-sm text-white/55">
                    Enter your company credentials.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">
                  Secure
                </span>
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs text-white/60">Company Login ID</label>
                  <input
                    value={companyLoginId}
                    onChange={(e) => setCompanyLoginId(e.target.value)}
                    placeholder="e.g. abc_admin"
                    autoComplete="username"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none placeholder:text-white/25 focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/60">Temporary Password</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Provided by admin"
                    type="password"
                    autoComplete="current-password"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none placeholder:text-white/25 focus:border-white/20"
                  />
                </div>

                {err && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {err}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !companyLoginId || !password}
                  className="w-full rounded-2xl bg-white py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Login"}
                </button>
              </form>
            </div>

            <div className="mt-4 text-center text-xs text-white/45">
              Powered by Tankco • Industrial Monitoring
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
