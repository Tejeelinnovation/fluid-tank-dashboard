"use client";
import { useEffect, useState } from "react";
import TankGrid from "@/components/tanks/TankGrid";

export default function CompanyDashboardPage() {
  const [tanks, setTanks] = useState<any[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    const res = await fetch("/api/company/tanks");
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(j?.error || "Failed to load");
    setTanks(j.tanks ?? []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // refresh every 5s (optional)
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen p-8 text-white">
      <h1 className="text-2xl font-semibold">Company Tank Dashboard</h1>
      {err && <div className="mt-3 text-sm text-red-300">{err}</div>}

      <div className="mt-6">
        <TankGrid tanks={tanks} />
      </div>
    </div>
  );
}
