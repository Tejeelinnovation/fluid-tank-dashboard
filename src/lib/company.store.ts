import fs from "fs";
import path from "path";

export type Company = {
  id: string;
  name: string;
  logoUrl?: string;
};

const FILE = path.join(process.cwd(), "data", "companies.json");

function readFile(): Company[] {
  try {
    const raw = fs.readFileSync(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeFile(companies: Company[]) {
  fs.writeFileSync(FILE, JSON.stringify(companies, null, 2), "utf-8");
}

export function getCompanies(): Company[] {
  return readFile();
}

export function addCompany(input: Omit<Company, "id">): Company {
  const companies = readFile();
  const newCompany: Company = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    logoUrl: input.logoUrl?.trim() || "",
  };
  companies.unshift(newCompany);
  writeFile(companies);
  return newCompany;
}

export function deleteCompany(id: string) {
  const companies = readFile().filter((c) => c.id !== id);
  writeFile(companies);
}
