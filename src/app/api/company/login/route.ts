import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readCompanies } from "@/lib/dbCompanies";
import { setCompanySession } from "@/lib/companyAuth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const companyLoginId = String(body?.companyLoginId ?? "").trim();
  const password = String(body?.password ?? "").trim();

  const db = await readCompanies();
  const company = db.companies.find((c) => c.companyLoginId === companyLoginId);

  if (!company) return NextResponse.json({ error: "Invalid ID/Password" }, { status: 401 });

  const ok = await bcrypt.compare(password, company.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid ID/Password" }, { status: 401 });

  await setCompanySession(company.id);

  return NextResponse.json({ ok: true, slug: company.slug });
}
