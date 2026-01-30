import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isAdminLoggedIn } from "@/lib/auth";
import { readCompanies, writeCompanies, slugify } from "@/lib/dbCompanies";
import type { Company } from "@/lib/dbCompanies";


function randomPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(req: Request) {
  const ok = await isAdminLoggedIn();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const logoUrl = String(body?.logoUrl ?? "").trim();
  const companyLoginId = String(body?.companyLoginId ?? "").trim();

  if (!name) return NextResponse.json({ error: "Company name required" }, { status: 400 });
  if (!companyLoginId) return NextResponse.json({ error: "Company Login ID required" }, { status: 400 });

  const db = await readCompanies();

  if (db.companies.some((c) => c.companyLoginId === companyLoginId)) {
    return NextResponse.json({ error: "Company Login ID already exists" }, { status: 400 });
  }

  const baseSlug = slugify(name);
  let slug = baseSlug || "company";
  let i = 2;
  while (db.companies.some((c) => c.slug === slug)) slug = `${baseSlug}-${i++}`;

  const tempPassword = randomPassword(10);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const company: Company = {

  id: crypto.randomUUID(),
  name,
  slug,
  logoUrl: logoUrl || undefined,
  companyLoginId,
  passwordHash,

  // ✅ DEFAULT TANK CONFIG (PASTE THIS PART)
  tanksCount: 6,
  tankCapacities: Array.from({ length: 6 }, () => 1000),

  // ✅ DATA SOURCE CONTROL
  dataMode: "generated",   // generated | csv | disabled
  csvPath: undefined,

  createdAt: new Date().toISOString(),
};


  db.companies.unshift(company);
  await writeCompanies(db);

  // IMPORTANT: return tempPassword ONCE to admin (store it somewhere safe)
  return NextResponse.json({ company, tempPassword });
}
