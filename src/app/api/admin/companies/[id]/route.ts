import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isAdminLoggedIn } from "@/lib/auth";

const filePath = path.join(process.cwd(), "src/data/companies.json");

type Company = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: string;
};

async function readDB(): Promise<{ companies: Company[] }> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { companies: [] };
  }
}

async function writeDB(data: { companies: Company[] }) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const ok = await isAdminLoggedIn();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDB();
  const before = db.companies.length;
  db.companies = db.companies.filter((c) => c.id !== params.id);

  if (db.companies.length === before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await writeDB(db);
  return NextResponse.json({ ok: true });
}
