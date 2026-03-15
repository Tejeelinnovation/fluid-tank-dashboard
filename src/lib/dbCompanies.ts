import "server-only";
import { promises as fs } from "fs";
import path from "path";

export type Company = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;

  companyLoginId: string;
  passwordHash: string;

  tanksCount: number;
  tankCapacities: number[];

  csvPath?: string;

  dataMode: "generated" | "csv" | "disabled";
  createdAt: string;
};

const filePath = path.join(process.cwd(), "src/data/companies.json");

async function ensureFile() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(
      filePath,
      JSON.stringify({ companies: [] }, null, 2),
      "utf-8"
    );
  }
}

function normalize(data: unknown): { companies: Company[] } {
  if (!data || typeof data !== "object") {
    return { companies: [] };
  }

  const obj = data as { companies?: unknown };

  if (!Array.isArray(obj.companies)) {
    return { companies: [] };
  }

  return { companies: obj.companies as Company[] };
}

export async function readCompanies(): Promise<{ companies: Company[] }> {
  await ensureFile();

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return normalize(JSON.parse(raw));
  } catch {
    return { companies: [] };
  }
}

export async function writeCompanies(data: { companies: Company[] }) {
  await ensureFile();
  await fs.writeFile(
    filePath,
    JSON.stringify(normalize(data), null, 2),
    "utf-8"
  );
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}