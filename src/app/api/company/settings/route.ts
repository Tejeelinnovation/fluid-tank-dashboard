import { NextResponse } from "next/server";
import { getCompanySessionId } from "@/lib/companyAuth";
import { readCompanies, writeCompanies } from "@/lib/dbCompanies";

function clampInt(n: any, min: number, max: number) {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return null;
  return Math.max(min, Math.min(max, v));
}

export async function POST(req: Request) {
  const companyId = await getCompanySessionId();
  if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // ✅ accept NEW UI fields
  const tanksCount = clampInt(body?.tanksCount, 1, 50);
  const caps = Array.isArray(body?.tankCapacities) ? body.tankCapacities : null;

  if (!tanksCount) {
    return NextResponse.json({ error: "tanksCount must be 1..50" }, { status: 400 });
  }

  if (!caps || caps.length !== tanksCount) {
    return NextResponse.json(
      { error: "tankCapacities length must match tanksCount" },
      { status: 400 }
    );
  }

  const tankCapacities = caps.map((x: any) => {
    const v = Number(x);
    return Number.isFinite(v) && v >= 0 ? Math.round(v) : 1000;
  });

  const db = await readCompanies();
  const idx = db.companies.findIndex((c) => c.id === companyId);
  if (idx === -1) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  db.companies[idx].tanksCount = tanksCount;
  db.companies[idx].tankCapacities = tankCapacities;

  await writeCompanies(db);

  return NextResponse.json({ ok: true });
}
