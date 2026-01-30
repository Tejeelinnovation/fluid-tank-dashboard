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

    const res = await fetch("/api/company/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyLoginId, password }),
    });

    const j = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErr(j?.error ?? "Login failed");
      return;
    }

    // ✅ after login go to setup (or change to /company/dashboard)
    window.location.href = "/company/setup";
  }

  return (
    <main className="relative min-h-screen text-white overflow-hidden">
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
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
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
                    className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none
                               placeholder:text-white/25 focus:border-white/20"
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
                    className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none
                               placeholder:text-white/25 focus:border-white/20"
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
                  className="w-full rounded-2xl bg-white text-black py-3 font-semibold
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in…" : "Login"}
                </button>
              </form>

              
            </div>

            {/* Footer note */}
            <div className="mt-4 text-center text-xs text-white/45">
              Powered by Tankco • Industrial Monitoring
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
