import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { readCompanies, writeCompanies } from "@/lib/dbCompanies";

export async function POST(req: Request) {
  const ok = await isAdminLoggedIn();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { companyId, dataMode } = await req.json();

  if (!["generated", "csv", "disabled"].includes(dataMode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const db = await readCompanies();
  const idx = db.companies.findIndex(c => c.id === companyId);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.companies[idx].dataMode = dataMode;
  await writeCompanies(db);

  return NextResponse.json({ ok: true });
}
