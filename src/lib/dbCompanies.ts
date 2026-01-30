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

export async function readCompanies(): Promise<{ companies: Company[] }> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { companies: [] };
  }
}

export async function writeCompanies(data: { companies: Company[] }) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
